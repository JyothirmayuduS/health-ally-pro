import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/reception-desk/pages/Dashboard";

export const Route = createFileRoute("/reception/")({
  component: Dashboard,
});
