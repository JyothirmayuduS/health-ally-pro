import { createFileRoute } from "@tanstack/react-router";
import { DoctorNotificationsScreen } from "@/components/doctor/profile/DoctorNotificationsScreen";

export const Route = createFileRoute("/doctor/settings/notifications")({
  component: DoctorSettingsNotifications,
  head: () => ({ meta: [{ title: "Notifications — Medora Doctor" }] }),
});

function DoctorSettingsNotifications() {
  return <DoctorNotificationsScreen />;
}
