import { createFileRoute } from "@tanstack/react-router";
import AdminAccessControl from "@/components/admin-desk/pages/AccessControl";

export const Route = createFileRoute("/admin/access-control")({
  component: AdminAccessControl,
});
