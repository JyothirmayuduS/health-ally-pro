/**
 * Stripe webhook signature verification matching stripe-node / Stripe CLI format.
 * @see https://docs.stripe.com/webhooks?verify=verify-manually
 *
 * - Header: `t=<unix>,v1=<hex hmac>` (ignore v0)
 * - Payload signed: `${t}.${rawBody}`
 * - Secret: try UTF-8 of full `whsec_…` (Stripe CLI) and base64 suffix (Dashboard / stripe-node)
 */

export function parseStripeSignatureHeader(header: string | null): {
  timestamp: string;
  signatures: string[];
} | null {
  if (!header) return null;
  const parts = header.split(",").map((p) => p.trim());
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq);
    const v = part.slice(eq + 1);
    if (k === "t") timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

/**
 * Candidate HMAC keys for a Stripe webhook secret.
 *
 * - Dashboard / stripe-node: `whsec_` + base64(raw key bytes)
 * - Stripe CLI `listen` sandbox secrets: HMAC key is UTF-8 of the full `whsec_…` string
 *   (confirmed against a live CLI-forwarded signature, 2026-07-22)
 */
export function stripeWebhookSecretKeyCandidates(secret: string): Uint8Array[] {
  const utf8 = new TextEncoder().encode(secret);
  const out: Uint8Array[] = [utf8];
  if (secret.startsWith("whsec_")) {
    const suffix = secret.slice("whsec_".length);
    try {
      const bin = atob(suffix);
      const b64 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) b64[i] = bin.charCodeAt(i);
      out.push(b64);
    } catch {
      /* not valid base64 — CLI hex-looking secrets still work via utf8 candidate */
    }
  }
  return out;
}

/** @deprecated Prefer stripeWebhookSecretKeyCandidates — kept for tests. */
export function decodeStripeWebhookSecret(secret: string): Uint8Array {
  return stripeWebhookSecretKeyCandidates(secret)[0]!;
}

export async function computeStripeSignatureHex(
  timestamp: string,
  rawBody: string,
  secret: string,
  keyBytes = stripeWebhookSecretKeyCandidates(secret)[0]!,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  return bufferToHex(signed);
}

/** Build a Stripe-Signature header like `stripe listen` / stripe-node test helpers. */
export async function generateStripeTestHeader(
  rawBody: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
): Promise<string> {
  const t = String(timestamp);
  const v1 = await computeStripeSignatureHex(t, rawBody, secret);
  return `t=${t},v1=${v1}`;
}

export async function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec = 300,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!secret) return { ok: false, error: "STRIPE_WEBHOOK_SECRET not configured" };
  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (!parsed) return { ok: false, error: "Invalid Stripe-Signature header" };

  const ts = Number(parsed.timestamp);
  if (!Number.isFinite(ts)) return { ok: false, error: "Invalid signature timestamp" };
  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > toleranceSec) return { ok: false, error: "Signature timestamp outside tolerance" };

  for (const keyBytes of stripeWebhookSecretKeyCandidates(secret)) {
    const expected = await computeStripeSignatureHex(parsed.timestamp, rawBody, secret, keyBytes);
    if (parsed.signatures.some((sig) => timingSafeEqualHex(sig, expected))) {
      return { ok: true };
    }
  }
  return { ok: false, error: "Signature mismatch" };
}

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export type SubscriptionPatch = {
  status: string;
  plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string | null;
  meta?: Record<string, unknown>;
};

/** Map Stripe event types to hospital_subscriptions updates. */
export function subscriptionPatchFromStripeEvent(event: {
  type: string;
  data?: { object?: Record<string, unknown> };
}): SubscriptionPatch | null {
  const obj = event.data?.object ?? {};
  const type = event.type;

  const customer = typeof obj.customer === "string" ? obj.customer : undefined;
  const subId =
    typeof obj.id === "string" && type.startsWith("customer.subscription")
      ? obj.id
      : typeof obj.subscription === "string"
        ? obj.subscription
        : undefined;

  const periodEnd =
    typeof obj.current_period_end === "number"
      ? new Date(obj.current_period_end * 1000).toISOString()
      : null;

  const planFromItems = extractPlan(obj);

  switch (type) {
    case "customer.subscription.created":
      return {
        status: String(obj.status ?? "active"),
        plan: planFromItems,
        stripe_customer_id: customer,
        stripe_subscription_id: subId,
        current_period_end: periodEnd,
        meta: { lastEvent: type },
      };
    case "customer.subscription.updated":
      return {
        status: String(obj.status ?? "active"),
        plan: planFromItems,
        stripe_customer_id: customer,
        stripe_subscription_id: subId,
        current_period_end: periodEnd,
        meta: { lastEvent: type },
      };
    case "customer.subscription.deleted":
      return {
        status: "canceled",
        stripe_customer_id: customer,
        stripe_subscription_id: subId,
        current_period_end: periodEnd,
        meta: { lastEvent: type },
      };
    case "invoice.payment_failed":
      return {
        status: "past_due",
        stripe_customer_id: customer,
        stripe_subscription_id: subId,
        meta: { lastEvent: type },
      };
    default:
      return null;
  }
}

function extractPlan(obj: Record<string, unknown>): string | undefined {
  const meta = obj.metadata as Record<string, unknown> | undefined;
  if (meta?.plan && typeof meta.plan === "string") return meta.plan;
  const items = obj.items as
    | { data?: Array<{ price?: { lookup_key?: string; id?: string } }> }
    | undefined;
  const lookup = items?.data?.[0]?.price?.lookup_key;
  if (lookup) return lookup;
  return undefined;
}
