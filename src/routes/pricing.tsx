import { createFileRoute } from "@tanstack/react-router";
import PricingPage from "@/components/marketing/PricingPage";

type PricingSearch = { plan?: string };

export const Route = createFileRoute("/pricing")({
  validateSearch: (s: Record<string, unknown>): PricingSearch => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
  }),
  head: () => ({ meta: [{ title: "Pricing — Medora for Hospitals" }] }),
  component: PricingPage,
});
