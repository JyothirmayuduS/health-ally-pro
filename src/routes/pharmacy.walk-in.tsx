import { createFileRoute } from "@tanstack/react-router";
import WalkIn from "@/components/pharmacy-desk/pages/WalkIn";

export const Route = createFileRoute("/pharmacy/walk-in")({
  component: WalkIn,
});
