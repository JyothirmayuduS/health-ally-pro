import { PatientProfileWorkspace } from "./PatientProfileWorkspace";
import { PORTAL_DEMO_PATIENT_ID } from "@/lib/shared/patient-registry";
import { loadPatientRegistry } from "@/lib/shared/patient-registry";

export function PatientSelfServicePanel() {
  const shared =
    loadPatientRegistry().find((p) => p.id === PORTAL_DEMO_PATIENT_ID) ??
    loadPatientRegistry()[0];

  return (
    <div className="space-y-4" data-testid="patient-self-service">
      <div className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
        <h1 className="font-serif text-xl text-ink sm:text-2xl">Health record</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Review demographics, emergency contacts, consents, documents, and your hospital ID
          card. Changes sync to your care team when connected.
        </p>
        <p className="mt-3 text-xs text-ink-muted border-t border-[#EDEAE6] pt-3">
          Access grants: you can authorize family members at reception — note who should receive
          read-only access to this record.
        </p>
      </div>
      <PatientProfileWorkspace
        patientId={shared?.id ?? PORTAL_DEMO_PATIENT_ID}
        mode="self"
        sharedPatient={shared}
      />
    </div>
  );
}
