import { createFileRoute } from "@tanstack/react-router";
import { ExerciseDetailPage } from "@/components/patient/exercise/ExerciseDetailPage";

export const Route = createFileRoute("/exercise/$routineId")({
  component: function ExerciseRoutineRoute() {
    const { routineId } = Route.useParams();
    return <ExerciseDetailPage routineId={routineId} />;
  },
});
