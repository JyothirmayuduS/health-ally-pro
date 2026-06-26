import { createFileRoute } from "@tanstack/react-router";
import MedicineSearch from "@/components/pharmacy-desk/pages/Search";

export const Route = createFileRoute("/pharmacy/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
  }),
  component: MedicineSearch,
});
