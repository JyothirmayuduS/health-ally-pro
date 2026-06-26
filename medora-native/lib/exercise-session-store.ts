import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExerciseTimeSlot = "morning" | "afternoon" | "evening";

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

async function readLogs(): Promise<DailyLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyLog[]) : [];
  } catch {
    return [];
  }
}

async function writeLogs(logs: DailyLog[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export async function getTodayCompletions(): Promise<ExerciseCompletion[]> {
  const key = todayKey();
  const logs = await readLogs();
  return logs.find((l) => l.date === key)?.completions ?? [];
}

export async function isRoutineCompletedToday(routineId: string): Promise<boolean> {
  const completions = await getTodayCompletions();
  return completions.some((c) => c.routineId === routineId);
}

export async function recordExerciseCompletion(
  entry: Omit<ExerciseCompletion, "completedAt">,
): Promise<void> {
  const logs = await readLogs();
  const key = todayKey();
  let today = logs.find((l) => l.date === key);
  if (!today) {
    today = { date: key, completions: [] };
    logs.push(today);
  }
  today.completions = today.completions.filter((c) => c.routineId !== entry.routineId);
  today.completions.push({ ...entry, completedAt: new Date().toISOString() });
  await writeLogs(logs);

  const { appendClinicalEvent, demoPanelPatientId, defaultClinicalPatientId } = await import(
    "@/lib/clinical-event-log"
  );
  await appendClinicalEvent({
    kind: "exercise_adherence",
    patientId: defaultClinicalPatientId(),
    panelPatientId: demoPanelPatientId(),
    title: `${entry.routineName} completed`,
    detail: `${Math.round(entry.durationSeconds / 60)} min · pain ${entry.painLevel}/10`,
    severity: entry.painLevel >= 7 ? "warning" : "info",
    meta: { routineId: entry.routineId, slot: entry.slot },
  });
}

export async function getExerciseStreak(): Promise<number> {
  const logs = (await readLogs()).sort((a, b) => b.date.localeCompare(a.date));
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

export async function getTodayAdherence(prescribedCount: number): Promise<{
  completed: number;
  prescribed: number;
  pct: number;
  minutesDone: number;
}> {
  const completions = await getTodayCompletions();
  const completed = completions.length;
  const prescribed = Math.max(prescribedCount, 1);
  const pct = Math.min(100, Math.round((completed / prescribed) * 100));
  const minutesDone = completions.reduce((s, c) => s + Math.round(c.durationSeconds / 60), 0);
  return { completed, prescribed, pct, minutesDone };
}

export async function clearExerciseLogs(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
