import { createFileRoute } from "@tanstack/react-router";
import BillingPayments from "@/components/billing-desk/pages/Payments";

export const Route = createFileRoute("/billing/payments")({
  component: BillingPayments,
});
