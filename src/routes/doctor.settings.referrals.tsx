import { createFileRoute, redirect } from "@tanstack/react-router";
import { DoctorReferralsWorkspace } from "@/components/doctor/profile/DoctorReferralsScreen";

type ReferralsSearch = {
  id?: string;
};

export const Route = createFileRoute("/doctor/settings/referrals")({
  validateSearch: (search: Record<string, unknown>): ReferralsSearch => ({
    id: typeof search.id === "string" && search.id.length > 0 ? search.id : undefined,
  }),
  component: DoctorSettingsReferrals,
  head: () => ({ meta: [{ title: "Referrals — Medora Doctor" }] }),
});

function DoctorSettingsReferrals() {
  const { id } = Route.useSearch();
  return <DoctorReferralsWorkspace selectedReferralId={id} />;
}
