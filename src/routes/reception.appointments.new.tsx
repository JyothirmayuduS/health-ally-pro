import { createFileRoute } from "@tanstack/react-router";
import NewAppointment from "@/components/reception-desk/pages/NewAppointment";

type NewApptSearch = { patient?: string };

export const Route = createFileRoute("/reception/appointments/new")({
  validateSearch: (search: Record<string, unknown>): NewApptSearch => ({
    patient: typeof search.patient === "string" ? search.patient : undefined,
  }),
  component: NewAppointment,
});
