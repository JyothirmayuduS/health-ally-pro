import { createFileRoute } from "@tanstack/react-router";
import AdminDepartments from "@/components/admin-desk/pages/Departments";

export const Route = createFileRoute("/admin/departments")({
  component: AdminDepartments,
});
