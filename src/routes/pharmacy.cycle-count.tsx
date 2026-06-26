import { createFileRoute } from "@tanstack/react-router";
import CycleCount from "@/components/pharmacy-desk/pages/CycleCount";

export const Route = createFileRoute("/pharmacy/cycle-count")({
  component: CycleCount,
});
