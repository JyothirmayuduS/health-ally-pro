import { createFileRoute } from "@tanstack/react-router";
import { DoctorShell } from "@/components/doctor/DoctorShell";

export const Route = createFileRoute("/doctor")({
  component: DoctorShell,
});
