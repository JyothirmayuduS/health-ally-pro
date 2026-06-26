import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/notifications")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/settings/notifications" });
  },
  component: () => null,
});
