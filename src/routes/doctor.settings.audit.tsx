import { createFileRoute } from "@tanstack/react-router";
import { DoctorAuditTrailScreen } from "@/components/doctor/profile/DoctorAuditTrailScreen";

export const Route = createFileRoute("/doctor/settings/audit")({
  component: DoctorSettingsAudit,
  head: () => ({ meta: [{ title: "Audit trail — Medora Doctor" }] }),
});

function DoctorSettingsAudit() {
  return <DoctorAuditTrailScreen />;
}
