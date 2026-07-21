import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse, verifyPatientWebAiRequest } from "@/server/ai/api-auth";
import { salesMailto } from "@/lib/legal-content";

/**
 * Commercial checkout handoff.
 * When STRIPE_SECRET_KEY + price IDs are configured, create a Checkout Session.
 * Otherwise return a sales mailto URL so the website stays sellable without fake self-checkout.
 */
export const Route = createFileRoute("/api/billing/checkout")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyPatientWebAiRequest(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { plan?: string; email?: string; hospitalName?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          /* empty */
        }

        const plan = (body.plan || "professional").toLowerCase();
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const priceMap: Record<string, string | undefined> = {
          starter: process.env.STRIPE_PRICE_STARTER,
          professional: process.env.STRIPE_PRICE_PROFESSIONAL,
          enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
        };
        const priceId = priceMap[plan];

        if (stripeKey && priceId && stripeKey.startsWith("sk_")) {
          try {
            const origin = new URL(request.url).origin;
            const params = new URLSearchParams();
            params.set("mode", "subscription");
            params.set("success_url", `${origin}/register-hospital?checkout=success`);
            params.set("cancel_url", `${origin}/pricing?checkout=cancel`);
            params.set("line_items[0][price]", priceId);
            params.set("line_items[0][quantity]", "1");
            if (body.email) params.set("customer_email", body.email);
            params.set("metadata[plan]", plan);
            if (body.hospitalName) params.set("metadata[hospital_name]", body.hospitalName);

            const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params,
            });
            const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
            if (!res.ok || !data.url) {
              return jsonResponse(
                { ok: false, error: data.error?.message || "Stripe session failed", mode: "sales" },
                { status: 502 },
              );
            }
            return jsonResponse({ ok: true, mode: "stripe", url: data.url, sessionId: data.id });
          } catch (e) {
            return jsonResponse(
              { ok: false, error: e instanceof Error ? e.message : "Stripe error", mode: "sales" },
              { status: 502 },
            );
          }
        }

        const subject = `Medora ${plan} checkout — ${body.hospitalName || "hospital"}`;
        const mailto = salesMailto(
          subject,
          `Plan: ${plan}\nHospital: ${body.hospitalName || ""}\nEmail: ${body.email || ""}\n`,
        );
        return jsonResponse({
          ok: true,
          mode: "sales",
          url: mailto,
          message: "Stripe not configured — continuing with sales order form.",
        });
      },
    },
  },
});
