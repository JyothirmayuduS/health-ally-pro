import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/care/visits")({
  component: function CareVisitsLayout() {
    return <Outlet />;
  },
});
