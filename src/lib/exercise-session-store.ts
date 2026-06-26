import type { ExerciseTimeSlot } from "@/lib/exercise-recovery-picks";
import { appendClinicalEvent, demoPanelPatientId } from "@/lib/shared/clinical-event-log";

export const EXERCISE_SESSION_EVENT = "medora-exercise-session-updated";

export type ExerciseDifficulty = "easy" | "ok" | "hard";

export type ExerciseCompletion = {
  routineId: string;
  routineName: string;
  completedAt: string;
  slot: ExerciseTimeSlot;
  painLevel: number;
  difficulty: ExerciseDifficulty;
  durationSeconds: number;
};

type DailyLog = {
  date: string;
  completions: ExerciseCompletion[];
};

const STORAGE_KEY = "medora_exercise_completions_v1";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readLogs(): DailyLog[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyLog[]) : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: DailyLog[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new CustomEvent(EXERCISE_SESSION_EVENT));
}

function getOrCreateToday(): DailyLog {
  const key = todayKey();
  const logs = readLogs();
  let today = logs.find((l) => l.date === key);
  if (!today) {
    today = { date: key, completions: [] };
    logs.push(today);
    writeLogs(logs);
  }
  return today;
}

export function getTodayCompletions(): ExerciseCompletion[] {
  const key = todayKey();
  return readLogs().find((l) => l.date === key)?.completions ?? [];
}

export function isRoutineCompletedToday(routineId: string): boolean {
  return getTodayCompletions().some((c) => c.routineId === routineId);
}

export function getSlotCompletions(slot: ExerciseTimeSlot): ExerciseCompletion[] {
  return getTodayCompletions().filter((c) => c.slot === slot);
}

export function recordExerciseCompletion(entry: Omit<ExerciseCompletion, "completedAt">) {
  const logs = readLogs();
  const key = todayKey();
  let today = logs.find((l) => l.date === key);
  if (!today) {
    today = { date: key, completions: [] };
    logs.push(today);
  }
  today.completions = today.completions.filter((c) => c.routineId !== entry.routineId);
  today.completions.push({ ...entry, completedAt: new Date().toISOString() });
  writeLogs(logs);
  appendClinicalEvent({
    kind: "exercise_adherence",
    patientId: demoPanelPatientId(),
    panelPatientId: demoPanelPatientId(),
    title: `${entry.routineName} completed`,
    detail: `${Math.round(entry.durationSeconds / 60)} min · pain ${entry.painLevel}/10`,
    severity: entry.painLevel >= 7 ? "warning" : "info",
    meta: { routineId: entry.routineId, slot: entry.slot },
  });
}

export function getExerciseStreak(): number {
  const logs = readLogs().sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const cursor = new Date();

  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const day = logs.find((l) => l.date === key);
    if (day && day.completions.length > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getTodayAdherence(prescribedCount: number): {
  completed: number;
  prescribed: number;
  pct: number;
  minutesDone: number;
} {
  const completions = getTodayCompletions();
  const completed = completions.length;
  const prescribed = Math.max(prescribedCount, 1);
  const pct = Math.min(100, Math.round((completed / prescribed) * 100));
  const minutesDone = completions.reduce((s, c) => s + Math.round(c.durationSeconds / 60), 0);
  return { completed, prescribed, pct, minutesDone };
}

/** Toggle immersive session chrome (hide bottom nav, etc.) */
export const EXERCISE_ACTIVE_SESSION_EVENT = "medora-exercise-active-session";

export function setExerciseSessionActive(active: boolean) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("exercise-session-active", active);
  }
  window.dispatchEvent(
    new CustomEvent(EXERCISE_ACTIVE_SESSION_EVENT, { detail: { active } }),
  );
}
