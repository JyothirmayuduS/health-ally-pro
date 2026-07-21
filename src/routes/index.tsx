import { createFileRoute } from "@tanstack/react-router";
import MarketingHomePage from "@/components/marketing/MarketingHomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medora — Hospital OS for multi-specialty campuses" },
      {
        name: "description",
        content:
          "License Medora: specialty doctor desks, 3D anatomy, lab, pharmacy, billing, and patient engagement for your hospital.",
      },
      { property: "og:title", content: "Medora — Hospital OS" },
      {
        property: "og:description",
        content: "Specialty-true clinical workspaces ready to license for multi-specialty hospitals.",
      },
    ],
  }),
  component: MarketingHomePage,
});
