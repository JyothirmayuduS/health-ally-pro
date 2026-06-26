import { createFileRoute } from "@tanstack/react-router";
import Team from "@/components/lab-desk/pages/Team";
import { requireLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/team")({
  beforeLoad: () => requireLabSupervisor(),
  component: Team,
});
