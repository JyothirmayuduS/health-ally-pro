import { createFileRoute } from "@tanstack/react-router";
import { ReportsHistoryPage } from "@/components/patient/reports/ReportsHistoryPage";

export const Route = createFileRoute("/reports/history")({
  head: () => ({
    meta: [{ title: "Archive History — Medora" }],
  }),
  component: ReportsHistoryPage,
});
