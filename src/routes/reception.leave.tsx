import { createFileRoute } from "@tanstack/react-router";
import StaffLeavePortal from "@/components/shared/StaffLeavePortal";

export const Route = createFileRoute("/reception/leave")({
  component: ReceptionLeavePage,
  head: () => ({ meta: [{ title: "My Leaves — Reception" }] }),
});

function ReceptionLeavePage() {
  return <StaffLeavePortal />;
}
