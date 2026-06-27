import { createFileRoute } from "@tanstack/react-router";
import AdminRevenue from "@/components/admin-desk/pages/Revenue";

export const Route = createFileRoute("/admin/revenue")({
  component: AdminRevenue,
});
