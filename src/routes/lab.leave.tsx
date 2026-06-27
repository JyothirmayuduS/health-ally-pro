import { createFileRoute } from "@tanstack/react-router";
import StaffLeavePortal from "@/components/shared/StaffLeavePortal";

export const Route = createFileRoute("/lab/leave")({
  component: LabLeavePage,
  head: () => ({ meta: [{ title: "My Leaves — Lab Station" }] }),
});

function LabLeavePage() {
  return <StaffLeavePortal />;
}
