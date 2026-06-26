import type { ClinicalEvent } from "@/lib/shared/clinical-event-log";
import { PORTAL_DEMO_PATIENT_ID } from "@/lib/shared/patient-registry";

export type ClinicalEventPollResponse = {
  events: Array<ClinicalEvent & { seq: number }>;
  latestSeq: number;
};

const SYNC_CURSOR_KEY = "medora-clinical-event-sync-cursor";

function apiBase(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.EXPO_PUBLIC_MEDORA_API_URL ?? "http://localhost:3000";
}

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

export function saveClinicalEventSyncCursor(patientId: string, seq: number) {
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

export async function publishClinicalEventSync(event: ClinicalEvent): Promise<void> {
  try {
    await fetch(`${apiBase()}/api/patient/clinical-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    /* offline / dev */
  }
}

export async function pollClinicalEventSync(
  patientId: string,
  since?: number,
): Promise<ClinicalEventPollResponse> {
  const cursor = since ?? readCursor(patientId);
  try {
    const res = await fetch(
      `${apiBase()}/api/patient/clinical-events?patientId=${encodeURIComponent(patientId)}&since=${cursor}`,
    );
    if (!res.ok) return { events: [], latestSeq: cursor };
    return (await res.json()) as ClinicalEventPollResponse;
  } catch {
    return { events: [], latestSeq: cursor };
  }
}

export function defaultClinicalSyncPatientId() {
  return PORTAL_DEMO_PATIENT_ID;
}
