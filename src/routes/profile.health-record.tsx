import { createFileRoute } from "@tanstack/react-router";
import { PatientSelfServicePanel } from "@/components/patient-management/PatientSelfServicePanel";
import { PatientHubLayout } from "@/components/patient/PatientHubLayout";

export const Route = createFileRoute("/profile/health-record")({
  head: () => ({
    meta: [
      { title: "Health record — Medora" },
      {
        name: "description",
        content: "Manage your hospital health record, consents, documents, and patient ID.",
      },
    ],
  }),
  component: HealthRecordPage,
});

function HealthRecordPage() {
  return (
    <PatientHubLayout widthClass="max-w-3xl">
      <PatientSelfServicePanel />
    </PatientHubLayout>
  );
}
