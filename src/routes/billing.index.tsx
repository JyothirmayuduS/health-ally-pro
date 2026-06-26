import { createFileRoute } from "@tanstack/react-router";
import BillingDashboard from "@/components/billing-desk/pages/Dashboard";

export const Route = createFileRoute("/billing/")({
  component: BillingDashboard,
});
