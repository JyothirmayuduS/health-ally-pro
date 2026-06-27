import { createFileRoute } from "@tanstack/react-router";
import StaffLeavePortal from "@/components/shared/StaffLeavePortal";

export const Route = createFileRoute("/billing/leave")({
  component: BillingLeavePage,
  head: () => ({ meta: [{ title: "My Leaves — Billing" }] }),
});

function BillingLeavePage() {
  return <StaffLeavePortal />;
}
