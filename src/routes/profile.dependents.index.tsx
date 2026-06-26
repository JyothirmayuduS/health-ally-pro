import { createFileRoute } from "@tanstack/react-router";
import { DependentsListPage } from "@/components/patient/profile/DependentsListPage";

export const Route = createFileRoute("/profile/dependents/")({
  head: () => ({
    meta: [{ title: "Dependents — Medora" }],
  }),
  component: DependentsListPage,
});
