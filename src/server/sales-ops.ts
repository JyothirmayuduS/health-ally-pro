/**
 * Sales ops helpers: Turnstile (optional) + lead webhook (optional).
 * When secrets are unset, checks are no-ops so demos stay sellable.
 */

export async function verifyTurnstile(
  token: string | undefined,
  request: Request,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };
  if (!token?.trim()) {
    return { ok: false, error: "Bot verification required" };
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined;

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token.trim());
    if (ip) body.set("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      return { ok: false, error: "Bot verification failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Bot verification unavailable" };
  }
}

export async function notifyLeadWebhook(payload: {
  hospitalName: string;
  adminEmail: string;
  plan: string;
  provisioned: boolean;
}): Promise<void> {
  const url = process.env.MEDORA_LEAD_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MEDORA_LEAD_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.MEDORA_LEAD_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify({
        type: "hospital_onboarding_lead",
        at: new Date().toISOString(),
        ...payload,
      }),
    });
  } catch {
    /* best-effort */
  }
}
