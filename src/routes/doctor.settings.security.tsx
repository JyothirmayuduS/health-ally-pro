import { createFileRoute } from "@tanstack/react-router";
import { DoctorSettingsSecurity } from "@/components/doctor/DoctorSettingsSecurity";

export const Route = createFileRoute("/doctor/settings/security")({
  component: DoctorSettingsSecurityPage,
  head: () => ({
    meta: [{ title: "Security — Medora Doctor" }],
  }),
});

function DoctorSettingsSecurityPage() {
  return <DoctorSettingsSecurity />;
}
