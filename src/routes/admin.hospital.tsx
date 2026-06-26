import { createFileRoute } from "@tanstack/react-router";
import AdminHospital from "@/components/admin-desk/pages/Hospital";

export const Route = createFileRoute("/admin/hospital")({
  component: AdminHospital,
});
