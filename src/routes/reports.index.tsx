import { createFileRoute } from "@tanstack/react-router";
import { ReportsHubPage } from "@/components/patient/reports/ReportsHubPage";

function ReportsIndexPage() {
  return <ReportsHubPage />;
}

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — Medora" },
      {
        name: "description",
        content:
          "Your secure clinical archive. Browse, download, and share medical reports with selected doctors.",
      },
    ],
  }),
  component: ReportsIndexPage,
});
