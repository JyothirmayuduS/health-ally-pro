import { createFileRoute } from "@tanstack/react-router";
import Refills from "@/components/pharmacy-desk/pages/Refills";

export const Route = createFileRoute("/pharmacy/refills")({
  component: Refills,
});
