import { createFileRoute } from "@tanstack/react-router";
import DoctorLeavePortal from "@/components/doctor/DoctorLeavePortal";

export const Route = createFileRoute("/doctor/leave")({
  component: DoctorLeavePage,
  head: () => ({ meta: [{ title: "My Leaves — Medora Doctor" }] }),
});

function DoctorLeavePage() {
  return <DoctorLeavePortal />;
}
