import { createFileRoute } from "@tanstack/react-router";
import { DoctorWorkspaceScreen } from "@/components/doctor/DoctorWorkspaceScreen";

export const Route = createFileRoute("/doctor/workspace")({
  component: DoctorWorkspacePage,
});

function DoctorWorkspacePage() {
  return <DoctorWorkspaceScreen />;
}
