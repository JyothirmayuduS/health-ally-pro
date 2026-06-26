import AsyncStorage from "@react-native-async-storage/async-storage";
import { patient } from "@/lib/mock-data";

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

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeClinicalEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function readAll(): Promise<ClinicalEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClinicalEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(events: ClinicalEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 500)));
  notify();
}

export function demoPanelPatientId(): string {
  return "p1";
}

export function defaultClinicalPatientId(): string {
  return patient.syncPatientId ?? "MRN-100231";
}

export async function appendClinicalEvent(
  input: Omit<ClinicalEvent, "id" | "at"> & { id?: string; at?: string },
): Promise<ClinicalEvent> {
  const event: ClinicalEvent = {
    ...input,
    id: input.id ?? `ce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId: input.patientId || defaultClinicalPatientId(),
    at: input.at ?? new Date().toISOString(),
  };
  const items = await readAll();
  items.unshift(event);
  await writeAll(items);

  void import("@/lib/clinical-event-sync").then(({ publishClinicalEventSync }) =>
    publishClinicalEventSync(event),
  );

  return event;
}

export async function listClinicalEvents(limit = 50): Promise<ClinicalEvent[]> {
  const items = await readAll();
  return items.slice(0, limit);
}

export async function upsertClinicalEventFromSync(event: ClinicalEvent): Promise<void> {
  const items = await readAll();
  if (items.some((e) => e.id === event.id)) return;
  items.unshift(event);
  await writeAll(items);
}
