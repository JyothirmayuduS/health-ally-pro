import { useCallback, useEffect, useState } from "react";
import {
  listActiveMedications,
  PATIENT_MEDS_EVENT,
  toggleMedicationTaken,
} from "@/lib/patient-meds-store";
import type { PatientMedication } from "@/lib/mock-data";

export function usePatientMedications() {
  const [meds, setMeds] = useState<PatientMedication[]>(listActiveMedications);

  const sync = useCallback(() => {
    setMeds(listActiveMedications());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(PATIENT_MEDS_EVENT, sync);
    return () => window.removeEventListener(PATIENT_MEDS_EVENT, sync);
  }, [sync]);

  const toggle = useCallback((medId: string) => {
    setMeds(toggleMedicationTaken(medId));
  }, []);

  return { meds, toggle, sync };
}
