import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse, verifyPatientWebAiRequest } from "@/server/ai/api-auth";
import { salesMailto } from "@/lib/legal-content";

/**
 * Stripe Customer Portal session (when STRIPE_SECRET_KEY set).
 * Else returns sales mailto for billing changes.
 */
export const Route = createFileRoute("/api/billing/portal")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyPatientWebAiRequest(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { customerId?: string; email?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          /* empty */
        }

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const customerId = body.customerId || process.env.STRIPE_CUSTOMER_ID;

        if (stripeKey?.startsWith("sk_") && customerId) {
          try {
            const origin = new URL(request.url).origin;
            const params = new URLSearchParams();
            params.set("customer", customerId);
            params.set("return_url", `${origin}/admin/settings?billing=portal`);

            const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params,
            });
            const data = (await res.json()) as { url?: string; error?: { message?: string } };
            if (!res.ok || !data.url) {
              return jsonResponse(
                { ok: false, error: data.error?.message || "Portal session failed", mode: "sales" },
                { status: 502 },
              );
            }
            return jsonResponse({ ok: true, mode: "stripe", url: data.url });
          } catch (e) {
            return jsonResponse(
              { ok: false, error: e instanceof Error ? e.message : "Stripe error", mode: "sales" },
              { status: 502 },
            );
          }
        }

        return jsonResponse({
          ok: true,
          mode: "sales",
          url: salesMailto(
            "Medora billing / seat change",
            `Please update our subscription.\nEmail: ${body.email || ""}\n`,
          ),
          message: "Stripe portal not configured — continuing with sales.",
        });
      },
    },
  },
});
