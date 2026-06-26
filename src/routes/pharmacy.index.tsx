import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/pharmacy-desk/pages/Dashboard";

export const Route = createFileRoute("/pharmacy/")({
  component: Dashboard,
});
