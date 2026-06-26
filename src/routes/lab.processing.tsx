import { createFileRoute } from "@tanstack/react-router";
import Processing from "@/components/lab-desk/pages/Processing";
import { requireLabTechnician } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/processing")({
  beforeLoad: () => requireLabTechnician(),
  component: Processing,
});
