import { createFileRoute } from "@tanstack/react-router";
import StorageMap from "@/components/pharmacy-desk/pages/StorageMap";

type PharmacyMapSearch = { highlight?: string };

export const Route = createFileRoute("/pharmacy/map")({
  validateSearch: (search: Record<string, unknown>): PharmacyMapSearch => ({
    highlight: (search.highlight as string) || undefined,
  }),
  component: StorageMap,
});
