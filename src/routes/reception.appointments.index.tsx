import { createFileRoute } from "@tanstack/react-router";
import Appointments from "@/components/reception-desk/pages/Appointments";

export const Route = createFileRoute("/reception/appointments/")({
  component: Appointments,
});
