import { createFileRoute } from "@tanstack/react-router";
import Prescriptions from "@/components/pharmacy-desk/pages/Prescriptions";

export const Route = createFileRoute("/pharmacy/prescriptions")({
  component: Prescriptions,
});
