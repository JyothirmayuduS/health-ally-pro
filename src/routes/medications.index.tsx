import { createFileRoute } from "@tanstack/react-router";
import { MedicationsHubPage } from "@/components/patient/medications/MedicationsHubPage";

export const Route = createFileRoute("/medications/")({
  head: () => ({ meta: [{ title: "Medications — Medora" }] }),
  component: MedicationsHubPage,
});
