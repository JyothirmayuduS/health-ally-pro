import { createFileRoute } from "@tanstack/react-router";
import { ClinicalRulesPage } from "@/components/patient/diet/ClinicalRulesPage";

export const Route = createFileRoute("/diet/clinical-rules")({
  head: () => ({ meta: [{ title: "Clinical Rules — Medora" }] }),
  component: function DietPlanClinicalRulesRoute() {
    return <ClinicalRulesPage />;
  },
});
