import { createFileRoute } from "@tanstack/react-router";
import { DoctorLabsWorkspace } from "@/components/doctor/clinical/DoctorLabsWorkspace";

export const Route = createFileRoute("/doctor/orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: DoctorOrdersRoute,
});

function DoctorOrdersRoute() {
  const { patientId } = Route.useSearch();
  return <DoctorLabsWorkspace searchPatientId={patientId} />;
}
