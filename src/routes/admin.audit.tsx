import { createFileRoute } from "@tanstack/react-router";
import AdminAuditExport from "@/components/admin-desk/pages/Audit";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditExport,
});
