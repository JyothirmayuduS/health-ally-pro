import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/components/lab-desk/pages/Settings";
import { requireLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/settings")({
  beforeLoad: () => requireLabSupervisor(),
  component: Settings,
});
