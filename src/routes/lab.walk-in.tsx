import { createFileRoute } from "@tanstack/react-router";
import WalkIn from "@/components/lab-desk/pages/WalkIn";
import { requireLabSupervisor } from "@/lib/lab-desk/roles";

export const Route = createFileRoute("/lab/walk-in")({
  beforeLoad: () => requireLabSupervisor(),
  component: WalkIn,
});
