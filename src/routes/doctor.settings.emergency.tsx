import { createFileRoute } from "@tanstack/react-router";
import { DoctorEmergencyAwayScreen } from "@/components/doctor/profile/DoctorEmergencyAwayScreen";

export const Route = createFileRoute("/doctor/settings/emergency")({
  component: DoctorSettingsEmergency,
  head: () => ({ meta: [{ title: "Emergency / away — Medora Doctor" }] }),
});

function DoctorSettingsEmergency() {
  return <DoctorEmergencyAwayScreen />;
}
