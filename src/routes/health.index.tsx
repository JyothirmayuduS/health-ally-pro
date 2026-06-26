import { createFileRoute } from "@tanstack/react-router";
import { HealthHubPage } from "@/components/patient/health/HealthHubPage";

export const Route = createFileRoute("/health/")({
  head: () => ({
    meta: [
      { title: "Health — Medora" },
      {
        name: "description",
        content: "Medications, prescriptions, and your secure clinical report archive.",
      },
    ],
  }),
  component: HealthHubPage,
});
