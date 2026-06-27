import { createFileRoute } from "@tanstack/react-router";
import Insurance from "@/components/reception-desk/pages/Insurance";

interface InsuranceSearch {
  patientId?: string;
  action?: string;
}

export const Route = createFileRoute("/reception/insurance")({
  validateSearch: (search: Record<string, unknown>): InsuranceSearch => {
    return {
      patientId: search.patientId as string | undefined,
      action: search.action as string | undefined,
    };
  },
  component: Insurance,
});
