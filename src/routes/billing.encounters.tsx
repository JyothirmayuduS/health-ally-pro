import { createFileRoute } from "@tanstack/react-router";
import BillingEncounters from "@/components/billing-desk/pages/Encounters";

type EncounterSearch = { encounter?: string };

export const Route = createFileRoute("/billing/encounters")({
  validateSearch: (search: Record<string, unknown>): EncounterSearch => ({
    encounter: typeof search.encounter === "string" ? search.encounter : undefined,
  }),
  component: BillingEncounters,
});
