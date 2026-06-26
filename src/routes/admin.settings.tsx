import { createFileRoute } from "@tanstack/react-router";
import AdminSettings from "@/components/admin-desk/pages/Settings";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});
