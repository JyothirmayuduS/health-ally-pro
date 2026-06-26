import { createFileRoute, Link } from "@tanstack/react-router";
import { ReportDetailPage } from "@/components/patient/reports/ReportDetailPage";
import { reports } from "@/lib/mock-data";

export const Route = createFileRoute("/reports/$reportId")({
  head: ({ params }) => {
    const r = reports.find((x) => x.id === params.reportId);
    return {
      meta: [
        { title: r ? `${r.title} — Medora` : "Report — Medora" },
        {
          name: "description",
          content: r
            ? `${r.type} report from ${r.doctor}. Securely view and share with other physicians.`
            : "View and share your medical report.",
        },
      ],
    };
  },
  component: function ReportDetailRoute() {
    const { reportId } = Route.useParams();
    return <ReportDetailPage reportId={reportId} />;
  },
  notFoundComponent: () => (
    <div className="py-16 text-center">
      <p className="text-ink-muted">Report not found.</p>
      <Link to="/reports" className="mt-4 inline-block text-clay">
        Back to archive
      </Link>
    </div>
  ),
});
