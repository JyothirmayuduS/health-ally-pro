import { createFileRoute } from "@tanstack/react-router";
import AdminReports from "@/components/admin-desk/pages/Reports";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});
