import { createFileRoute } from "@tanstack/react-router";
import NursingVitals from "@/components/nursing-desk/pages/Vitals";

export const Route = createFileRoute("/nursing/vitals")({
  validateSearch: (search: Record<string, unknown>) => ({
    patient: (search.patient as string) || undefined,
  }),
  component: NursingVitals,
});
