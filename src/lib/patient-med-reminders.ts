import { notifyPatientMedicationDue } from "@/lib/patient-notifications";

export type PatientMedReminder = {
  id: string;
  name: string;
  dosage: string;
  timeLabel: string;
  hour: number;
  minute: number;
  instruction?: string;
};

const ENABLED_KEY = "medora-patient-med-reminders";
const TAKEN_KEY = "medora-patient-med-taken-today";

/** Demo schedule aligned with native mock meds */
export const PATIENT_DEMO_MEDS: PatientMedReminder[] = [
  { id: "m1", name: "Levothyroxine", dosage: "50mcg", timeLabel: "8:00 AM", hour: 8, minute: 0, instruction: "Empty stomach" },
  { id: "m2", name: "Vitamin D3", dosage: "2000 IU", timeLabel: "8:00 AM", hour: 8, minute: 0, instruction: "With food" },
  { id: "m3", name: "Magnesium Glycinate", dosage: "200mg", timeLabel: "9:00 PM", hour: 21, minute: 0, instruction: "At bedtime" },
];

export function medRemindersEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

export function setMedRemindersEnabled(on: boolean) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readTakenToday(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(TAKEN_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return new Set(map[todayKey()] ?? []);
  } catch {
    return new Set();
  }
}

export function markMedTakenToday(medId: string) {
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(TAKEN_KEY);
  const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  const day = todayKey();
  const ids = new Set(map[day] ?? []);
  ids.add(medId);
  map[day] = [...ids];
  localStorage.setItem(TAKEN_KEY, JSON.stringify(map));
}

let reminderTimer: ReturnType<typeof setInterval> | null = null;
const firedThisMinute = new Set<string>();

export function startPatientMedReminders() {
  if (typeof window === "undefined") return () => {};
  if (!medRemindersEnabled()) return () => {};

  const tick = () => {
    const now = new Date();
    const key = `${todayKey()}-${now.getHours()}:${now.getMinutes()}`;
    if (firedThisMinute.has(key)) return;

    const taken = readTakenToday();
    const due = PATIENT_DEMO_MEDS.filter(
      (m) => m.hour === now.getHours() && m.minute === now.getMinutes() && !taken.has(m.id),
    );

    if (due.length > 0) {
      firedThisMinute.add(key);
      for (const med of due) {
        notifyPatientMedicationDue(med);
      }
    }
  };

  tick();
  reminderTimer = setInterval(tick, 30_000);

  return () => {
    if (reminderTimer) clearInterval(reminderTimer);
    reminderTimer = null;
  };
}
