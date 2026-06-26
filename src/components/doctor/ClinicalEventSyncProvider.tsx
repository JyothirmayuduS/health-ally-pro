import { useEffect } from "react";
import { upsertClinicalEventFromSync } from "@/lib/shared/clinical-event-log";
import {
  defaultClinicalSyncPatientId,
  pollClinicalEventSync,
  saveClinicalEventSyncCursor,
} from "@/lib/shared/clinical-event-sync";

const POLL_MS = 5000;

/** Doctor portal — ingests patient/native clinical events into local triage log. */
export function ClinicalEventSyncProvider() {
  useEffect(() => {
    const patientId = defaultClinicalSyncPatientId();
    let cancelled = false;

    const pull = async () => {
      try {
        const { events, latestSeq } = await pollClinicalEventSync(patientId);
        if (cancelled || events.length === 0) return;
        for (const event of events) {
          upsertClinicalEventFromSync(event);
        }
        saveClinicalEventSyncCursor(patientId, latestSeq);
      } catch {
        /* server offline */
      }
    };

    void pull();
    const id = window.setInterval(() => void pull(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
