import { createFileRoute } from "@tanstack/react-router";
import NursingPatients from "@/components/nursing-desk/pages/Patients";

export const Route = createFileRoute("/nursing/patients")({
  component: NursingPatients,
});
