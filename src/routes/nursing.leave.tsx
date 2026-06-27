import { createFileRoute } from "@tanstack/react-router";
import StaffLeavePortal from "@/components/shared/StaffLeavePortal";

export const Route = createFileRoute("/nursing/leave")({
  component: NursingLeavePage,
  head: () => ({ meta: [{ title: "My Leaves — Nursing" }] }),
});

function NursingLeavePage() {
  return <StaffLeavePortal />;
}
