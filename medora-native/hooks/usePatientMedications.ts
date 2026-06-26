import { useCallback, useEffect, useState } from "react";
import type { Medication } from "@/lib/mock-data";
import {
  listActiveMedications,
  medsAdherenceSummary,
  subscribePatientMeds,
  toggleMedicationTaken,
} from "@/lib/patient-meds-store";

export function usePatientMedications() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await listActiveMedications();
    setMeds(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    return subscribePatientMeds(() => {
      void refresh();
    });
  }, [refresh]);

  const toggle = useCallback(
    async (medId: string) => {
      const next = await toggleMedicationTaken(medId);
      setMeds(next);
      return next;
    },
    [],
  );

  const taken = meds.filter((m) => m.taken).length;
  const total = meds.length;
  const pct = total ? Math.round((taken / total) * 100) : 0;

  return {
    meds,
    loading,
    refresh,
    toggle,
    taken,
    total,
    pct,
    summary: () => medsAdherenceSummary(),
  };
}
