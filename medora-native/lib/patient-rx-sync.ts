import Constants from "expo-constants";
import type { PatientRxSyncEnvelope } from "./patient-rx-sync-types";
import {
  getPatientPrescription,
  importPatientPrescriptionFromSync,
  listPatientPrescriptions,
} from "./patient-prescription-store";
import { notifyNewPrescription } from "./notifications";
import { patient } from "./mock-data";

export type { PatientRxSyncEnvelope } from "./patient-rx-sync-types";

const POLL_MS = 5000;
let lastSeq = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function apiBase(): string {
  return (
    process.env.EXPO_PUBLIC_MEDORA_API_URL ??
    (Constants.expoConfig?.extra as { medoraApiUrl?: string } | undefined)?.medoraApiUrl ??
    "http://localhost:3000"
  );
}

export function syncPatientId(): string {
  return patient.syncPatientId ?? "MRN-100231";
}

async function pollOnce(): Promise<void> {
  const patientId = syncPatientId();
  try {
    const res = await fetch(
      `${apiBase()}/api/patient/rx-inbox?patientId=${encodeURIComponent(patientId)}&since=${lastSeq}`,
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      messages: Array<PatientRxSyncEnvelope & { seq: number }>;
      latestSeq: number;
    };

    for (const msg of data.messages) {
      const existed = Boolean(getPatientPrescription(msg.rx_number));
      importPatientPrescriptionFromSync(msg);
      if (!existed) {
        await notifyNewPrescription({
          rxNumber: msg.rx_number,
          doctorName: msg.doctor_name,
          diagnosis: msg.diagnosis,
        });
      }
    }

    if (data.latestSeq > lastSeq) {
      lastSeq = data.latestSeq;
    }
  } catch {
    /* server unreachable — demo seeds still work */
  }
}

export function startPatientRxSync(): () => void {
  if (pollTimer) return () => {};

  void pollOnce();
  pollTimer = setInterval(() => void pollOnce(), POLL_MS);

  return () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };
}

export function listKnownRxNumbers(): string[] {
  return listPatientPrescriptions().map((r) => r.rx_number);
}
