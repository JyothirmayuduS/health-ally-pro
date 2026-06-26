import { createFileRoute } from "@tanstack/react-router";
import { DoctorScheduleSlotsScreen } from "@/components/doctor/profile/DoctorScheduleSlotsScreen";

export const Route = createFileRoute("/doctor/settings/slots")({
  component: DoctorSettingsSlots,
  head: () => ({ meta: [{ title: "Slots — Medora Doctor" }] }),
});

function DoctorSettingsSlots() {
  return <DoctorScheduleSlotsScreen />;
}
