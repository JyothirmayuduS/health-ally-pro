import { createFileRoute } from "@tanstack/react-router";
import StaffLeavePortal from "@/components/shared/StaffLeavePortal";

export const Route = createFileRoute("/pharmacy/leave")({
  component: PharmacyLeavePage,
  head: () => ({ meta: [{ title: "My Leaves — Pharmacy" }] }),
});

function PharmacyLeavePage() {
  return <StaffLeavePortal />;
}
