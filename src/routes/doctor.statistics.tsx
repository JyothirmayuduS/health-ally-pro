import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/statistics")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor" });
  },
  component: () => null,
});
