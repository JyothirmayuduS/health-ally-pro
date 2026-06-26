import { createFileRoute } from "@tanstack/react-router";
import { ReportsShareDoctorPage } from "@/components/patient/reports/ReportsShareDoctorPage";

export const Route = createFileRoute("/reports/share/$reportId")({
  head: () => ({
    meta: [{ title: "Share Report — Medora" }],
  }),
  component: function ReportsShareDoctorRoute() {
    const { reportId } = Route.useParams();
    return <ReportsShareDoctorPage reportId={reportId} />;
  },
});
