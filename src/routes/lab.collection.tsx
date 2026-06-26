import { createFileRoute } from "@tanstack/react-router";
import Collection from "@/components/lab-desk/pages/Collection";
import { requireLabTechnician } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/collection")({
  beforeLoad: () => requireLabTechnician(),
  component: Collection,
});
