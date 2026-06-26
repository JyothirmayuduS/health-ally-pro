import { useEffect } from "react";
import { listActiveMedications } from "@/lib/patient-meds-store";
import { scheduleMedicationReminders } from "@/lib/medication-reminders";
import { startPatientRxSync } from "@/lib/patient-rx-sync";
import { startClinicalEventSync } from "@/lib/clinical-event-sync";
import { checkNotificationPermission } from "@/lib/notifications";

/** Boots Rx inbox polling, clinical event sync, and daily med reminders */
export function usePatientSyncBootstrap() {
  useEffect(() => {
    const stopRx = startPatientRxSync();
    const stopClinical = startClinicalEventSync();

    let cancelled = false;
    void (async () => {
      const ok = await checkNotificationPermission();
      if (!cancelled && ok) {
        const meds = await listActiveMedications();
        await scheduleMedicationReminders(meds.slice(0, 3));
      }
    })();

    return () => {
      cancelled = true;
      stopRx();
      stopClinical();
    };
  }, []);
}
