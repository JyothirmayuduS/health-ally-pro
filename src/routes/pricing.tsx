import { createFileRoute } from "@tanstack/react-router";
import PricingPage from "@/components/marketing/PricingPage";

export const Route = createFileRoute("/pricing")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({ meta: [{ title: "Pricing — Medora for Hospitals" }] }),
  component: PricingPage,
});
