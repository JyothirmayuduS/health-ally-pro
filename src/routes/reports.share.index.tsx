import { createFileRoute } from "@tanstack/react-router";
import { ReportsSharePickerPage } from "@/components/patient/reports/ReportsSharePickerPage";

export const Route = createFileRoute("/reports/share/")({
  head: () => ({
    meta: [{ title: "Share Report — Medora" }],
  }),
  component: ReportsSharePickerPage,
});
