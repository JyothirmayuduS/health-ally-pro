import { createFileRoute } from "@tanstack/react-router";
import TrustPackPage from "@/components/marketing/TrustPackPage";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust pack — Medora" },
      { name: "description", content: "Procurement trust pack for Medora HMS." },
    ],
  }),
  component: TrustPackPage,
});
