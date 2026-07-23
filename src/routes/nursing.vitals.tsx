import { createFileRoute } from "@tanstack/react-router";
import NursingVitals from "@/components/nursing-desk/pages/Vitals";

type NursingVitalsSearch = { patient?: string };


export const Route = createFileRoute("/nursing/vitals")({
  validateSearch: (search: Record<string, unknown>): NursingVitalsSearch => ({
    patient: (search.patient as string) || undefined,
  }),
  component: NursingVitals,
});
