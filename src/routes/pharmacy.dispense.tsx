import { createFileRoute } from "@tanstack/react-router";
import Dispense from "@/components/pharmacy-desk/pages/Dispense";

export const Route = createFileRoute("/pharmacy/dispense")({
  component: Dispense,
});
