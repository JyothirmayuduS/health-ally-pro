import { useEffect } from "react";
import {
  defaultSyncPatientId,
  pollPatientRxSync,
  publishPatientRxSync,
  rxRecordToSyncEnvelope,
  saveSyncCursor,
} from "@/lib/shared/patient-rx-sync";
import { PATIENT_RX_SYNC_CHANNEL } from "@/lib/shared/patient-rx-sync-types";
import {
  PATIENT_RX_EVENT,
  upsertPatientPrescriptionFromSync,
  type PatientRxRecord,
} from "@/lib/patient-prescription-store";
import { notifyNewPrescription } from "@/lib/patient-notifications";
import { setMedRemindersEnabled, startPatientMedReminders } from "@/lib/patient-med-reminders";
import { requestPatientNotificationPermission } from "@/lib/patient-notifications";
import { upsertClinicalEventFromSync } from "@/lib/shared/clinical-event-log";
import {
  defaultClinicalSyncPatientId,
  pollClinicalEventSync,
  saveClinicalEventSyncCursor,
} from "@/lib/shared/clinical-event-sync";

const POLL_MS = 4000;

function applySyncEnvelope(envelope: Parameters<typeof upsertPatientPrescriptionFromSync>[0], isNew: boolean) {
  const record = upsertPatientPrescriptionFromSync(envelope);
  if (isNew) {
    notifyNewPrescription({
      rxNumber: record.rx_number,
      doctorName: record.doctor_name,
      diagnosis: record.draft.diagnosis,
    });
  }
  return record;
}

/** Mount in patient AppShell — polls Rx inbox + med reminders */
export function PatientSyncProvider({ patientId }: { patientId?: string }) {
  const pid = patientId ?? defaultSyncPatientId();

  useEffect(() => {
    let cancelled = false;

    const pullRx = async () => {
      try {
        const { messages, latestSeq } = await pollPatientRxSync(pid);
        if (cancelled || messages.length === 0) return;
        for (const msg of messages) {
          applySyncEnvelope(msg, true);
        }
        saveSyncCursor(pid, latestSeq);
      } catch {
        /* server offline */
      }
    };

    const pullClinical = async () => {
      try {
        const clinicalPid = defaultClinicalSyncPatientId();
        const { events, latestSeq } = await pollClinicalEventSync(clinicalPid);
        if (cancelled || events.length === 0) return;
        for (const event of events) {
          upsertClinicalEventFromSync(event);
        }
        saveClinicalEventSyncCursor(clinicalPid, latestSeq);
      } catch {
        /* server offline */
      }
    };

    const pull = async () => {
      await pullRx();
      await pullClinical();
    };

    void pull();
    const interval = setInterval(() => void pull(), POLL_MS);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(PATIENT_RX_SYNC_CHANNEL);
      channel.onmessage = (ev: MessageEvent<{ type: string; envelope: Parameters<typeof upsertPatientPrescriptionFromSync>[0] }>) => {
        if (ev.data?.type === "rx" && ev.data.envelope?.patientId === pid) {
          applySyncEnvelope(ev.data.envelope, false);
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes("medora_patient_prescriptions")) {
        window.dispatchEvent(new CustomEvent(PATIENT_RX_EVENT));
      }
    };
    window.addEventListener("storage", onStorage);

    if (typeof localStorage !== "undefined" && localStorage.getItem("medora-patient-med-reminders") === null) {
      setMedRemindersEnabled(true);
    }

    const stopReminders = startPatientMedReminders();

    void requestPatientNotificationPermission().then((ok) => {
      if (ok) setMedRemindersEnabled(true);
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      channel?.close();
      window.removeEventListener("storage", onStorage);
      stopReminders();
    };
  }, [pid]);

  return null;
}

/** Re-export for doctor-side publish after local push */
export async function syncPatientRxRecord(record: PatientRxRecord) {
  const envelope = rxRecordToSyncEnvelope(record);
  await publishPatientRxSync(envelope);
}
