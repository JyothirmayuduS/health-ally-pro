import { createFileRoute } from "@tanstack/react-router";
import QualityControl from "@/components/lab-desk/pages/QualityControl";

export const Route = createFileRoute("/lab/qc")({
  component: QualityControl,
});
