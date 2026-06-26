import { createFileRoute } from "@tanstack/react-router";
import StorageMap from "@/components/pharmacy-desk/pages/StorageMap";

export const Route = createFileRoute("/pharmacy/map")({
  validateSearch: (search: Record<string, unknown>) => ({
    highlight: (search.highlight as string) || undefined,
  }),
  component: StorageMap,
});
