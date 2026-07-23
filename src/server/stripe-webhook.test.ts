import { describe, expect, it } from "vitest";
import {
  computeStripeSignatureHex,
  decodeStripeWebhookSecret,
  generateStripeTestHeader,
  parseStripeSignatureHeader,
  subscriptionPatchFromStripeEvent,
  verifyStripeWebhookSignature,
} from "@/server/stripe-webhook";

describe("stripe webhook HMAC (Stripe CLI / stripe-node compatible)", () => {
  it("parses Stripe-Signature header and ignores v0", () => {
    const parsed = parseStripeSignatureHeader(
      "t=123,v1=abc,v0=legacy,v1=def",
    );
    expect(parsed).toEqual({ timestamp: "123", signatures: ["abc", "def"] });
  });

  it("accepts both CLI utf8 secrets and Dashboard base64 whsec_ keys", async () => {
    const { stripeWebhookSecretKeyCandidates } = await import("@/server/stripe-webhook");
    // CLI-style: first candidate is UTF-8 of full string
    const cli = stripeWebhookSecretKeyCandidates("whsec_abc");
    expect(new TextDecoder().decode(cli[0]!)).toBe("whsec_abc");

    // Dashboard-style: second candidate is base64("secret") => "c2VjcmV0"
    const dash = stripeWebhookSecretKeyCandidates("whsec_c2VjcmV0");
    expect(new TextDecoder().decode(dash[1]!)).toBe("secret");

    // Legacy helper returns primary (utf8) candidate
    expect(new TextDecoder().decode(decodeStripeWebhookSecret("whsec_c2VjcmV0"))).toBe(
      "whsec_c2VjcmV0",
    );
  });

  it("rejects missing secret", async () => {
    const res = await verifyStripeWebhookSignature("{}", "t=1,v1=x", "");
    expect(res.ok).toBe(false);
  });

  it("round-trips generateStripeTestHeader like Stripe CLI", async () => {
    const secret = "whsec_c2VjcmV0X2Zvcl90ZXN0aW5nX29ubHk"; // base64 of secret_for_testing_only
    const body = JSON.stringify({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1", customer: "cus_1", status: "active" } },
    });
    const header = await generateStripeTestHeader(body, secret, 1_700_000_000);
    expect(header).toMatch(/^t=1700000000,v1=[0-9a-f]{64}$/);

    // stale timestamp rejected
    const stale = await verifyStripeWebhookSignature(body, header, secret, 60);
    expect(stale.ok).toBe(false);

    const freshTs = Math.floor(Date.now() / 1000);
    const freshHeader = await generateStripeTestHeader(body, secret, freshTs);
    const ok = await verifyStripeWebhookSignature(body, freshHeader, secret);
    expect(ok).toEqual({ ok: true });

    // Tampered body fails
    const bad = await verifyStripeWebhookSignature(body + " ", freshHeader, secret);
    expect(bad.ok).toBe(false);

    // Hex matches recomputation
    const expected = await computeStripeSignatureHex(String(freshTs), body, secret);
    expect(freshHeader).toContain(expected);
  });

  it("maps subscription lifecycle events", () => {
    expect(
      subscriptionPatchFromStripeEvent({
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_1",
            customer: "cus_1",
            status: "active",
            metadata: { plan: "professional" },
            current_period_end: 1_800_000_000,
          },
        },
      }),
    ).toMatchObject({ status: "active", plan: "professional", stripe_subscription_id: "sub_1" });

    expect(
      subscriptionPatchFromStripeEvent({
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_1", customer: "cus_1" } },
      }),
    ).toMatchObject({ status: "canceled" });

    expect(
      subscriptionPatchFromStripeEvent({
        type: "invoice.payment_failed",
        data: { object: { customer: "cus_1", subscription: "sub_1" } },
      }),
    ).toMatchObject({ status: "past_due" });

    expect(
      subscriptionPatchFromStripeEvent({
        type: "customer.subscription.updated",
        data: { object: { id: "sub_1", customer: "cus_1", status: "trialing" } },
      }),
    ).toMatchObject({ status: "trialing" });
  });
});
