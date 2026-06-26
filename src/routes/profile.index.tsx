import { createFileRoute } from "@tanstack/react-router";
import { ProfileHubPage } from "@/components/patient/profile/ProfileHubPage";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "Profile — Medora" },
      {
        name: "description",
        content:
          "Manage your personal information, care preferences, notifications, and account security.",
      },
    ],
  }),
  component: ProfileHubPage,
});
