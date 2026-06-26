import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/patients")({
  component: DoctorPatientsLayout,
});

function DoctorPatientsLayout() {
  return <Outlet />;
}
