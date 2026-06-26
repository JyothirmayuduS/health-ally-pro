import { PORTAL_DEMO_PATIENT_ID } from "@/lib/shared/patient-registry";
import { resolvePatientId } from "@/lib/shared/patients";

export type ClinicalEventKind =
  | "appointment_booked"
  | "appointment_queue"
  | "rx_sent"
  | "rx_cancelled"
  | "rx_amended"
  | "vitals_recorded"
  | "med_adherence"
  | "exercise_adherence";

export type ClinicalEvent = {
  id: string;
  kind: ClinicalEventKind;
  patientId: string;
  panelPatientId?: string;
  title: string;
  detail?: string;
  severity?: "info" | "warning" | "critical";
  at: string;
  meta?: Record<string, string | number | boolean>;
};

const STORAGE_KEY = "medora-clinical-event-log-v1";
export const CLINICAL_EVENT_LOG_EVENT = "medora-clinical-event-log-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLINICAL_EVENT_LOG_EVENT));
  }
}

function readAll(): ClinicalEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClinicalEvent[]) : [];
  } catch {
    return [];
  }
}

function writeAll(events: ClinicalEvent[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 500)));
  emit();
}

export function appendClinicalEvent(
  input: Omit<ClinicalEvent, "id" | "at"> & { id?: string; at?: string },
): ClinicalEvent {
  const event: ClinicalEvent = {
    ...input,
    id: input.id ?? `ce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId: resolvePatientId(input.patientId),
    at: input.at ?? new Date().toISOString(),
  };
  const next = [event, ...readAll()];
  writeAll(next);

  if (typeof window !== "undefined") {
    void import("@/lib/shared/clinical-event-sync").then(({ publishClinicalEventSync }) =>
      publishClinicalEventSync(event),
    );
  }

  return event;
}

/** Merge remote clinical events (native / other tabs) into local log. */
export function upsertClinicalEventFromSync(event: ClinicalEvent): ClinicalEvent {
  const items = readAll();
  if (items.some((e) => e.id === event.id)) return event;
  const next = [event, ...items];
  writeAll(next);
  return event;
}

export function listClinicalEvents(patientId?: string, limit = 50): ClinicalEvent[] {
  const canonical = patientId ? resolvePatientId(patientId) : undefined;
  let events = readAll();
  if (canonical) {
    events = events.filter(
      (e) =>
        e.patientId === canonical ||
        e.panelPatientId === patientId ||
        e.panelPatientId === canonical,
    );
  }
  return events.slice(0, limit);
}

export function subscribeClinicalEvents(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CLINICAL_EVENT_LOG_EVENT, onChange);
  return () => window.removeEventListener(CLINICAL_EVENT_LOG_EVENT, onChange);
}

/** Demo portal patient maps to panel id p1 (Anjali Krishnan). */
export function demoPanelPatientId(): string {
  return "p1";
}

export function defaultClinicalPatientId(): string {
  return PORTAL_DEMO_PATIENT_ID;
}
