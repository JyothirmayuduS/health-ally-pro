import { createFileRoute } from "@tanstack/react-router";
import AdminDoctors from "@/components/admin-desk/pages/Doctors";

export const Route = createFileRoute("/admin/doctors")({
  component: AdminDoctors,
});
