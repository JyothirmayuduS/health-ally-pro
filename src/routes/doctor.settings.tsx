import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/settings")({
  component: DoctorSettingsLayout,
});

function DoctorSettingsLayout() {
  return <Outlet />;
}
