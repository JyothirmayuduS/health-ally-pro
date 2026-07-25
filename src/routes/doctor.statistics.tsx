import { createFileRoute } from "@tanstack/react-router";
import { DoctorAnalyticsScreen } from "@/components/doctor/DoctorAnalyticsScreen";

export const Route = createFileRoute("/doctor/statistics")({
  component: DoctorStatisticsPage,
  head: () => ({ meta: [{ title: "Analytics — Medora Doctor" }] }),
});

function DoctorStatisticsPage() {
  return <DoctorAnalyticsScreen />;
}
