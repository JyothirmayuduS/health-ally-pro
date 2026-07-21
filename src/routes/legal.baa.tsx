import { createFileRoute } from "@tanstack/react-router";
import BaaPage from "@/components/marketing/BaaPage";

export const Route = createFileRoute("/legal/baa")({
  head: () => ({
    meta: [
      { title: "BAA & DPA — Medora" },
      { name: "description", content: "Business Associate Agreement and DPA pack overview." },
    ],
  }),
  component: BaaPage,
});
