import { createFileRoute, Link } from "@tanstack/react-router";
import { PatientPrescriptionView } from "@/components/patient/PatientPrescriptionView";
import { getPatientPrescription } from "@/lib/patient-prescription-store";

export const Route = createFileRoute("/prescriptions/$rxId")({
  head: ({ params }) => ({
    meta: [
      { title: `Prescription ${params.rxId} — Medora` },
      { name: "description", content: "View your e-prescription details." },
    ],
  }),
  component: PatientPrescriptionDetailPage,
});

function PatientPrescriptionDetailPage() {
  const { rxId } = Route.useParams();
  const record = getPatientPrescription(rxId);

  if (!record) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-serif text-2xl text-ink">Prescription not found</p>
        <p className="mt-2 text-sm text-ink-muted">This Rx may have been removed or the link is invalid.</p>
        <Link
          to="/prescriptions"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Back to prescriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-8 lg:pb-12">
      <PatientPrescriptionView record={record} />
    </div>
  );
}
