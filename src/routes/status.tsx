import { createFileRoute } from "@tanstack/react-router";
import StatusPage from "@/components/marketing/StatusPage";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — Medora" },
      { name: "description", content: "Medora system status." },
    ],
  }),
  component: StatusPage,
});
