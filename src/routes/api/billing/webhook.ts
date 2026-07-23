import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import { productionBootHttpResponse } from "@/server/production-boot";
import {
  subscriptionPatchFromStripeEvent,
  verifyStripeWebhookSignature,
} from "@/server/stripe-webhook";
import { DEFAULT_HOSPITAL_ID } from "@/server/hospital-persistence";

export const Route = createFileRoute("/api/billing/webhook")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const rawBody = await request.text();
        const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
        const verified = await verifyStripeWebhookSignature(
          rawBody,
          request.headers.get("stripe-signature"),
          secret,
        );
        if (!verified.ok) {
          return jsonResponse({ error: verified.error }, { status: 400 });
        }

        let event: { type: string; data?: { object?: Record<string, unknown> } };
        try {
          event = JSON.parse(rawBody) as typeof event;
        } catch {
          return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
        }

        const patch = subscriptionPatchFromStripeEvent(event);
        if (!patch) {
          return jsonResponse({ ok: true, ignored: event.type });
        }

        const admin = getSupabaseAdmin();
        if (!admin) {
          return jsonResponse({ error: "admin_unavailable" }, { status: 503 });
        }

        const hospitalId =
          (typeof event.data?.object?.metadata === "object" &&
          event.data?.object?.metadata &&
          typeof (event.data.object.metadata as { hospital_id?: string }).hospital_id === "string"
            ? (event.data.object.metadata as { hospital_id: string }).hospital_id
            : null) || DEFAULT_HOSPITAL_ID;

        const row: Record<string, unknown> = {
          hospital_id: hospitalId,
          status: patch.status,
          meta: patch.meta ?? {},
        };
        if (patch.plan) row.plan = patch.plan;
        if (patch.stripe_customer_id) row.stripe_customer_id = patch.stripe_customer_id;
        if (patch.stripe_subscription_id) row.stripe_subscription_id = patch.stripe_subscription_id;
        if (patch.current_period_end !== undefined) {
          row.current_period_end = patch.current_period_end;
        }

        const { error } = await admin.from("hospital_subscriptions").upsert(row, {
          onConflict: "hospital_id",
        });
        if (error) {
          return jsonResponse({ ok: false, error: error.message }, { status: 502 });
        }

        return jsonResponse({ ok: true, hospitalId, status: patch.status, event: event.type });
      },
    },
  },
});
