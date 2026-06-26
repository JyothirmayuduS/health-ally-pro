import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/settings/schedule")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/settings/slots" });
  },
  component: () => null,
});
