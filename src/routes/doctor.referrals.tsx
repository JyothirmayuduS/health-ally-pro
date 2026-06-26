import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/referrals")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/settings/referrals" });
  },
  component: () => null,
});
