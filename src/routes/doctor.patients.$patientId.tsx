import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/patients/$patientId")({
  component: PatientChartLayout,
});

function PatientChartLayout() {
  return <Outlet />;
}
