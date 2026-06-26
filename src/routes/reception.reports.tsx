import { createFileRoute } from "@tanstack/react-router";
import Reports from "@/components/reception-desk/pages/Reports";

export const Route = createFileRoute("/reception/reports")({
  component: Reports,
});
