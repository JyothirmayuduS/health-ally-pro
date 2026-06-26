import { createFileRoute } from "@tanstack/react-router";
import Formulary from "@/components/pharmacy-desk/pages/Formulary";

export const Route = createFileRoute("/pharmacy/formulary")({
  component: Formulary,
});
