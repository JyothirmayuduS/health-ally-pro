import { createFileRoute, Link } from "@tanstack/react-router";
import { VisitDetailPage } from "@/components/patient/care/VisitDetailPage";
import { appointments as mockAppointments } from "@/lib/mock-data";

function resolveVisit(id: string) {
  return mockAppointments.find((a) => a.id === id);
}

export const Route = createFileRoute("/care/visits/$visitId")({
  head: ({ params }) => {
    const visit = resolveVisit(params.visitId);
    return {
      meta: [
        {
          title: visit
            ? `${visit.reason} — Medora`
            : "Visit details — Medora",
        },
      ],
    };
  },
  component: function CareVisitDetailRoute() {
    const { visitId } = Route.useParams();
    return <VisitDetailPage visitId={visitId} />;
  },
  notFoundComponent: () => (
    <div className="py-16 text-center">
      <p className="text-ink-muted">Visit not found.</p>
      <Link to="/care/visits" className="mt-4 inline-block text-clay">
        Back to visits
      </Link>
    </div>
  ),
});
