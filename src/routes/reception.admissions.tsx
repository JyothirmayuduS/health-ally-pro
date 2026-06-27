import { createFileRoute } from "@tanstack/react-router";
import Admissions from "@/components/reception-desk/pages/Admissions";

export const Route = createFileRoute("/reception/admissions")({
  component: Admissions,
});
