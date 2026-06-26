import { createFileRoute } from "@tanstack/react-router";
import { ClinicalDietPage } from "@/components/patient/diet/ClinicalDietPage";

export const Route = createFileRoute("/diet/")({
  head: () => ({ meta: [{ title: "Clinical Diet — Medora" }] }),
  component: ClinicalDietPage,
});
