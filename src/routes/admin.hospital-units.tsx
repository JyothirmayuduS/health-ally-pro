import { createFileRoute } from "@tanstack/react-router";
import HospitalUnitsPage from "@/components/admin-desk/pages/HospitalUnits";

export const Route = createFileRoute("/admin/hospital-units")({
  component: HospitalUnitsPage,
  head: () => ({
    meta: [{ title: "Hospital units — Medora Admin" }],
  }),
});
