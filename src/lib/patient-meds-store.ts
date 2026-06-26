import type { PatientMedication } from "@/lib/mock-data";
import { patientMedications } from "@/lib/mock-data";
import { markMedTakenToday } from "@/lib/patient-med-reminders";
import { appendClinicalEvent, demoPanelPatientId } from "@/lib/shared/clinical-event-log";

const STORAGE_KEY = "medora-patient-meds-v1";
export const PATIENT_MEDS_EVENT = "medora-patient-meds-changed";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type StoredMeds = {
  date: string;
  takenIds: string[];
};

function readStored(): StoredMeds {
  if (typeof localStorage === "undefined") {
    return { date: todayKey(), takenIds: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

function writeStored(data: StoredMeds) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PATIENT_MEDS_EVENT));
  }
}

function seedTakenIds(): string[] {
  return patientMedications
    .filter((m) => m.status !== "past" && m.taken)
    .map((m) => m.id);
}

export function listActiveMedications(): PatientMedication[] {
  const stored = readStored();
  const takenSet = new Set(
    stored.takenIds.length ? stored.takenIds : seedTakenIds(),
  );
  return patientMedications
    .filter((m) => m.status !== "past")
    .map((m) => ({ ...m, taken: takenSet.has(m.id) }));
}

export function toggleMedicationTaken(medId: string): PatientMedication[] {
  const meds = listActiveMedications();
  const med = meds.find((m) => m.id === medId);
  if (!med) return meds;

  const nextTaken = !med.taken;
  const takenIds = meds
    .map((m) => (m.id === medId ? { ...m, taken: nextTaken } : m))
    .filter((m) => m.taken)
    .map((m) => m.id);

  writeStored({ date: todayKey(), takenIds });
  appendClinicalEvent({
    kind: "med_adherence",
    patientId: demoPanelPatientId(),
    panelPatientId: demoPanelPatientId(),
    title: nextTaken ? `${med.name} marked taken` : `${med.name} marked not taken`,
    detail: med.dosage,
    severity: nextTaken ? "info" : "warning",
    meta: { medId, taken: nextTaken },
  });
  if (nextTaken) markMedTakenToday(medId);

  return listActiveMedications();
}

export function medsAdherenceSummary() {
  const meds = listActiveMedications();
  const taken = meds.filter((m) => m.taken).length;
  const total = meds.length;
  const pct = total ? Math.round((taken / total) * 100) : 0;
  return { meds, taken, total, pct };
}

export function nextDueMedication(): PatientMedication | undefined {
  return listActiveMedications().find((m) => !m.taken);
}
