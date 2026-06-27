import { createFileRoute } from "@tanstack/react-router";
import AdminDoctorRoster from "@/components/admin-desk/pages/DoctorRoster";

export const Route = createFileRoute("/admin/doctor-roster")({
  component: AdminDoctorRoster,
});
