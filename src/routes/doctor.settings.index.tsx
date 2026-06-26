import { createFileRoute } from "@tanstack/react-router";
import { DoctorProfileScreen } from "@/components/doctor/DoctorProfileScreen";

export const Route = createFileRoute("/doctor/settings/")({
  component: DoctorSettingsIndex,
  head: () => ({
    meta: [{ title: "Profile — Medora Doctor" }],
  }),
});

function DoctorSettingsIndex() {
  return <DoctorProfileScreen />;
}
