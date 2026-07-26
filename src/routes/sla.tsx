import { createFileRoute } from "@tanstack/react-router";
import SlaPage from "@/components/marketing/SlaPage";

export const Route = createFileRoute("/sla")({
  head: () => ({
    meta: [
      { title: "SLA — Medora" },
      { name: "description", content: "Service level targets for licensed Medora hospitals." },
    ],
  }),
  component: SlaPage,
});
