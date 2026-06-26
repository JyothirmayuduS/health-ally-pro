import { createFileRoute } from "@tanstack/react-router";
import { DoctorNoteWorkspace } from "@/components/doctor/clinical/DoctorNoteWorkspace";

export const Route = createFileRoute("/doctor/encounters")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: DoctorEncountersRoute,
});

function DoctorEncountersRoute() {
  const { patientId } = Route.useSearch();
  return <DoctorNoteWorkspace searchPatientId={patientId} />;
}
