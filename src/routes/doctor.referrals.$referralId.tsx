import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/referrals/$referralId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/doctor/settings/referrals",
      search: { id: params.referralId },
    });
  },
  component: () => null,
});
