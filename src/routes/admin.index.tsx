import { createFileRoute } from "@tanstack/react-router";
import { HospitalCommandCenter } from "@/components/hospital-erp/HospitalCommandCenter";

export const Route = createFileRoute("/admin/")({
  component: AdminCommandCenter,
});

function AdminCommandCenter() {
  return <HospitalCommandCenter />;
}
