import { createFileRoute } from "@tanstack/react-router";
import DoctorSpecialtyDeskPage from "@/components/doctor/specialty/DoctorSpecialtyDeskPage";

export const Route = createFileRoute("/doctor/specialty")({
  component: DoctorSpecialtyDeskPage,
  head: () => ({
    meta: [{ title: "Specialty workstation — Medora Doctor" }],
  }),
});
