import { createFileRoute } from "@tanstack/react-router";
import AdminAnnouncements from "@/components/admin-desk/pages/Announcements";

export const Route = createFileRoute("/admin/announcements")({
  component: AdminAnnouncements,
});
