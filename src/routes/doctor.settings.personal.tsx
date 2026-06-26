import { createFileRoute } from "@tanstack/react-router";
import { DoctorSettingsPersonal } from "@/components/doctor/DoctorSettingsPersonal";

export const Route = createFileRoute("/doctor/settings/personal")({
  component: DoctorSettingsPersonalPage,
  head: () => ({
    meta: [{ title: "Personal information — Medora Doctor" }],
  }),
});

function DoctorSettingsPersonalPage() {
  return <DoctorSettingsPersonal />;
}
