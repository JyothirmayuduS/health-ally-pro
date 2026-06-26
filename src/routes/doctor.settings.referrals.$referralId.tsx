import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path → search param on list route (keeps list + sheet mounted). */
export const Route = createFileRoute("/doctor/settings/referrals/$referralId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/doctor/settings/referrals",
      search: { id: params.referralId },
    });
  },
  component: () => null,
});
