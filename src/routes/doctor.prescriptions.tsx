import { createFileRoute } from "@tanstack/react-router";
import {
  DoctorPrescriptionWorkspace,
  type PrescriptionView,
} from "@/components/doctor/prescriptions/DoctorPrescriptionWorkspace";

type PrescriptionSearch = {
  patientId?: string;
  view?: PrescriptionView;
  rxId?: string;
  amendFrom?: string;
  templateApply?: string;
};

export const Route = createFileRoute("/doctor/prescriptions")({
  validateSearch: (search: Record<string, unknown>): PrescriptionSearch => {
    const view = search.view;
    const validView =
      view === "write" || view === "sent" || view === "templates" ? view : "write";
    return {
      patientId: typeof search.patientId === "string" ? search.patientId : undefined,
      view: validView,
      rxId: typeof search.rxId === "string" ? search.rxId : undefined,
      amendFrom: typeof search.amendFrom === "string" ? search.amendFrom : undefined,
      templateApply: typeof search.templateApply === "string" ? search.templateApply : undefined,
    };
  },
  head: () => ({
    meta: [{ title: "E-prescribe — Medora Doctor" }],
  }),
  component: DoctorPrescriptionsPage,
});

function DoctorPrescriptionsPage() {
  const { patientId, view, rxId, amendFrom } = Route.useSearch();
  return (
    <DoctorPrescriptionWorkspace
      view={view ?? "write"}
      initialPatientId={patientId}
      rxId={rxId}
      amendFrom={amendFrom}
    />
  );
}
