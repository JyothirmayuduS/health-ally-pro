import { createFileRoute } from "@tanstack/react-router";
import AdminBranches from "@/components/admin-desk/pages/Branches";

export const Route = createFileRoute("/admin/branches")({
  component: AdminBranches,
});
