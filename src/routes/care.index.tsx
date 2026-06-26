import { createFileRoute } from "@tanstack/react-router";
import { CareHubPage } from "@/components/patient/care/CareHubPage";

export const Route = createFileRoute("/care/")({
  head: () => ({
    meta: [
      { title: "Care — Medora" },
      {
        name: "description",
        content: "Book appointments, track your live queue, and browse specialists.",
      },
    ],
  }),
  component: CareHubPage,
});
