import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/reception/appointments")({
  component: AppointmentsLayout,
});

function AppointmentsLayout() {
  return <Outlet />;
}
