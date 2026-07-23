import { createFileRoute } from "@tanstack/react-router";
import MedicineSearch from "@/components/pharmacy-desk/pages/Search";

type PharmacySearchQ = { q?: string };


export const Route = createFileRoute("/pharmacy/search")({
  validateSearch: (search: Record<string, unknown>): PharmacySearchQ => ({
    q: (search.q as string) || undefined,
  }),
  component: MedicineSearch,
});
