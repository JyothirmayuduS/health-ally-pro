import { createFileRoute } from "@tanstack/react-router";
import { ClinicalRulesPage } from "@/components/patient/diet/ClinicalRulesPage";

export const Route = createFileRoute("/diet/$mealId/clinical-rules")({
  head: () => ({ meta: [{ title: "Clinical Rules — Medora" }] }),
  component: function ClinicalRulesRoute() {
    const { mealId } = Route.useParams();
    return <ClinicalRulesPage mealId={mealId} />;
  },
});
