import { createFileRoute } from "@tanstack/react-router";
import AdminOccupancy from "@/components/admin-desk/pages/OccupancyLoad";

export const Route = createFileRoute("/admin/occupancy")({
  component: AdminOccupancy,
});
