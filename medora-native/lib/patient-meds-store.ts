import AsyncStorage from "@react-native-async-storage/async-storage";
import { medications, type Medication } from "@/lib/mock-data";
import {
  appendClinicalEvent,
  demoPanelPatientId,
  defaultClinicalPatientId,
} from "@/lib/clinical-event-log";

const STORAGE_KEY = "medora-patient-meds-v1";

type StoredMeds = {
  date: string;
  takenIds: string[];
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribePatientMeds(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((fn) => fn());
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readStored(): Promise<StoredMeds> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), takenIds: [] };
    const parsed = JSON.parse(raw) as StoredMeds;
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), takenIds: [] };
    }
    return parsed;
  } catch {
    return { date: todayKey(), takenIds: [] };
  }
}

async function writeStored(data: StoredMeds): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notify();
}

function seedTakenIds(): string[] {
  return medications
    .filter((m) => m.status !== "past" && m.taken)
    .map((m) => m.id);
}

function activeCatalog(): Medication[] {
  return medications.filter((m) => m.status !== "past");
}

export async function listActiveMedications(): Promise<Medication[]> {
  const stored = await readStored();
  const takenSet = new Set(
    stored.takenIds.length ? stored.takenIds : seedTakenIds(),
  );
  return activeCatalog().map((m) => ({ ...m, taken: takenSet.has(m.id) }));
}

export async function toggleMedicationTaken(medId: string): Promise<Medication[]> {
  const meds = await listActiveMedications();
  const med = meds.find((m) => m.id === medId);
  if (!med) return meds;

  const nextTaken = !med.taken;
  const takenIds = meds
    .map((m) => (m.id === medId ? { ...m, taken: nextTaken } : m))
    .filter((m) => m.taken)
    .map((m) => m.id);

  await writeStored({ date: todayKey(), takenIds });

  await appendClinicalEvent({
    kind: "med_adherence",
    patientId: defaultClinicalPatientId(),
    panelPatientId: demoPanelPatientId(),
    title: nextTaken ? `${med.name} marked taken` : `${med.name} marked not taken`,
    detail: med.dosage,
    severity: nextTaken ? "info" : "warning",
    meta: { medId, taken: nextTaken },
  });

  return listActiveMedications();
}

export async function medsAdherenceSummary() {
  const meds = await listActiveMedications();
  const taken = meds.filter((m) => m.taken).length;
  const total = meds.length;
  const pct = total ? Math.round((taken / total) * 100) : 0;
  return { meds, taken, total, pct };
}

export async function isMedicationTaken(medId: string): Promise<boolean> {
  const meds = await listActiveMedications();
  return meds.find((m) => m.id === medId)?.taken ?? false;
}

export async function clearMedsStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  notify();
}
