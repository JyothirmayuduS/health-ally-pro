import { createFileRoute } from "@tanstack/react-router";
import { MealDetailPage } from "@/components/patient/diet/MealDetailPage";

export const Route = createFileRoute("/diet/$mealId")({
  component: function DietMealRoute() {
    const { mealId } = Route.useParams();
    return <MealDetailPage mealId={mealId} />;
  },
});
