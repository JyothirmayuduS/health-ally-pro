import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import type { PatientRxRecord } from "@/lib/patient-prescription-store";
import type { PatientRxInboxPollResponse, PatientRxSyncEnvelope } from "@/lib/shared/patient-rx-sync-types";
import { PATIENT_RX_SYNC_CHANNEL } from "@/lib/shared/patient-rx-sync-types";
import { PORTAL_DEMO_PATIENT_ID } from "@/lib/shared/patient-registry";

export function rxRecordToSyncEnvelope(record: PatientRxRecord): PatientRxSyncEnvelope {
  return {
    id: record.id,
    rx_number: record.rx_number,
    patientId: record.patientId,
    patientRef: record.patientSnapshot.patientRef,
    patientName: record.patientSnapshot.name,
    diagnosis: record.draft.diagnosis,
    diagnosisIcd: record.draft.diagnosisIcd,
    lines: record.draft.lines.map((line) => {
      const drug = DRUGS.find((d) => d.id === line.drug_id);
      return {
        drug_id: line.drug_id,
        drug_name: drug?.generic_name ?? line.drug_id,
        strength: drug?.strength ?? "",
        sig: line.sig,
        qty_prescribed: line.qty_prescribed,
        days_supply: line.days_supply,
      };
    }),
    doctor_name: record.doctor_name,
    doctor_specialty: record.doctor_specialty,
    patientInstructions: record.draft.patientInstructions,
    sent_at: record.sent_at,
    status: record.status,
  };
}

function apiBase(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.EXPO_PUBLIC_MEDORA_API_URL ?? "http://localhost:3000";
}

export async function publishPatientRxSync(envelope: PatientRxSyncEnvelope): Promise<void> {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const ch = new BroadcastChannel(PATIENT_RX_SYNC_CHANNEL);
      ch.postMessage({ type: "rx", envelope });
      ch.close();
    } catch {
      /* noop */
    }
  }

  try {
    await fetch(`${apiBase()}/api/patient/rx-inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    });
  } catch {
    /* offline / dev */
  }
}

const SYNC_CURSOR_KEY = "medora-patient-rx-sync-cursor";

function readCursor(patientId: string): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(SYNC_CURSOR_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map[patientId] ?? 0;
  } catch {
    return 0;
  }
}

function writeCursor(patientId: string, seq: number) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(SYNC_CURSOR_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[patientId] = seq;
    localStorage.setItem(SYNC_CURSOR_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

export async function pollPatientRxSync(
  patientId: string,
  since?: number,
): Promise<PatientRxInboxPollResponse> {
  const cursor = since ?? readCursor(patientId);
  const res = await fetch(
    `${apiBase()}/api/patient/rx-inbox?patientId=${encodeURIComponent(patientId)}&since=${cursor}`,
  );
  if (!res.ok) return { messages: [], latestSeq: cursor };
  return (await res.json()) as PatientRxInboxPollResponse;
}

export function saveSyncCursor(patientId: string, seq: number) {
  writeCursor(patientId, seq);
}

export function defaultSyncPatientId() {
  return PORTAL_DEMO_PATIENT_ID;
}
