import { createFileRoute } from "@tanstack/react-router";
import Controlled from "@/components/pharmacy-desk/pages/Controlled";

export const Route = createFileRoute("/pharmacy/controlled")({
  component: Controlled,
});
