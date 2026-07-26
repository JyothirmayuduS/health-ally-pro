import { createFileRoute } from "@tanstack/react-router";
import { PatientMobileDashboard } from "@/components/patient/PatientMobileDashboard";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Patient home — Medora" },
      {
        name: "description",
        content:
          "Your daily care snapshot: live queue, medications, meal plan, appointments, and reports.",
      },
    ],
  }),
  component: PatientMobileDashboard,
});
