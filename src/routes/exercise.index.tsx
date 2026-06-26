import { createFileRoute } from "@tanstack/react-router";
import { ExerciseRecoveryHubPage } from "@/components/patient/exercise/ExerciseRecoveryHubPage";

export const Route = createFileRoute("/exercise/")({
  head: () => ({ meta: [{ title: "Move — Exercise Recovery — Medora" }] }),
  component: ExerciseRecoveryHubPage,
});
