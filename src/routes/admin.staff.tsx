import { createFileRoute } from "@tanstack/react-router";
import AdminStaff from "@/components/admin-desk/pages/Staff";

export const Route = createFileRoute("/admin/staff")({
  component: AdminStaff,
});
