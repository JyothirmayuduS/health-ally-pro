import { createFileRoute } from "@tanstack/react-router";
import Patients from "@/components/reception-desk/pages/Patients";

type PatientSearch = { patient?: string };

export const Route = createFileRoute("/reception/patients")({
  validateSearch: (search: Record<string, unknown>): PatientSearch => ({
    patient: typeof search.patient === "string" ? search.patient : undefined,
  }),
  component: Patients,
});
