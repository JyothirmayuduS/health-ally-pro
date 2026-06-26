import { createFileRoute } from "@tanstack/react-router";
import AdminAnalytics from "@/components/admin-desk/pages/Analytics";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});
