import { createFileRoute } from "@tanstack/react-router";
import { DoctorVitalsWorkspace } from "@/components/doctor/clinical/DoctorVitalsWorkspace";

export const Route = createFileRoute("/doctor/vitals")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: DoctorVitalsRoute,
});

function DoctorVitalsRoute() {
  const { patientId } = Route.useSearch();
  return <DoctorVitalsWorkspace searchPatientId={patientId} />;
}
