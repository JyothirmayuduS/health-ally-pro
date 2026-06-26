import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/components/lab-desk/pages/Reports";
import { requireLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/reports")({
  beforeLoad: () => requireLabSupervisor(),
  component: Reports,
});
