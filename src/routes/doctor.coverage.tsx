import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/coverage")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/settings/emergency" });
  },
  component: () => null,
});
