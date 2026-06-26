import { createFileRoute } from "@tanstack/react-router";
import NursingDashboard from "@/components/nursing-desk/pages/Dashboard";

export const Route = createFileRoute("/nursing/")({
  component: NursingDashboard,
});
