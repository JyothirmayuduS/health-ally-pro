import { createFileRoute } from "@tanstack/react-router";
import Samples from "@/components/lab-desk/pages/Samples";

export const Route = createFileRoute("/lab/samples")({
  component: Samples,
});
