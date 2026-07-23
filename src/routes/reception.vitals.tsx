import { createFileRoute } from "@tanstack/react-router";
import { ReceptionVitalsWorkspace } from "@/components/reception-desk/pages/Vitals";

type ReceptionVitalsSearch = { patientId?: string };


export const Route = createFileRoute("/reception/vitals")({
  validateSearch: (search: Record<string, unknown>): ReceptionVitalsSearch => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: ReceptionVitalsRoute,
});

function ReceptionVitalsRoute() {
  const { patientId } = Route.useSearch();
  return <ReceptionVitalsWorkspace searchPatientId={patientId} />;
}
