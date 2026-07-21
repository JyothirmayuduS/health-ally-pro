import { createFileRoute } from "@tanstack/react-router";
import ImplementPage from "@/components/marketing/ImplementPage";

export const Route = createFileRoute("/implement")({
  head: () => ({
    meta: [
      { title: "Implementation — Medora" },
      { name: "description", content: "Hospital IT implementation checklist for Medora go-live." },
    ],
  }),
  component: ImplementPage,
});
