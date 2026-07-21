import { createFileRoute } from "@tanstack/react-router";
import SecurityPage from "@/components/marketing/SecurityPage";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security — Medora" },
      { name: "description", content: "Security overview for hospital IT and procurement." },
    ],
  }),
  component: SecurityPage,
});
