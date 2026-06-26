import { createFileRoute } from "@tanstack/react-router";
import { ChefMedoraChatPage } from "@/components/patient/diet/ChefMedoraChatPage";

export const Route = createFileRoute("/diet/chef")({
  head: () => ({
    meta: [
      { title: "Chef Medora — Clinical nutrition" },
      { name: "description", content: "AI chef for medication-synced recipes and meal guidance." },
    ],
  }),
  component: ChefMedoraChatPage,
});
