import type { PatientExerciseContext } from "@/lib/exercise-ai-client";
import type { ExerciseRoutine } from "@/lib/exercise-mock-data";

export type ExercisePick = {
  routine: ExerciseRoutine;
  rank: number;
  score: number;
  recoveryTag: string;
};

const PICK_TAGS: Record<string, string> = {
  "ex-walk-am": "Morning energy",
  "ex-neck": "Neck relief",
  "ex-breath": "Stress reset",
  "ex-sunwalk": "Vitamin D boost",
  "ex-evening-stretch": "Sleep prep",
  "ex-low-impact": "Metabolic lift",
  "ex-ankle": "Circulation",
  "ex-core-gentle": "Core support",
  "ex-balance": "Stability",
  "ex-relax": "Deep recovery",
};

export function getCurrentTimeSlot(): ExerciseRoutine["bestTime"] {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 17) return "midday";
  if (h < 21) return "evening";
  return "evening";
}

function scoreRoutine(
  routine: ExerciseRoutine,
  ctx: PatientExerciseContext,
  slot: ExerciseRoutine["bestTime"],
): number {
  let score = 0;

  if (ctx.takesThyroidMeds && routine.syncedMeds.some((m) => /levothyroxine/i.test(m))) {
    score += 22;
  }
  if (ctx.needsVitaminD && routine.syncedMeds.some((m) => /vitamin d/i.test(m))) {
    score += 20;
  }
  if (ctx.needsMagnesiumRecovery && routine.syncedMeds.some((m) => /magnesium/i.test(m))) {
    score += 18;
  }

  for (const cond of ctx.conditions) {
    const lower = cond.toLowerCase();
    if (routine.targetConditions.some((t) => lower.includes(t.toLowerCase().split(" ")[0]))) {
      score += 15;
    }
    if (/hypothyroid|thyroid/.test(lower) && /thyroid|hypothyroid/i.test(routine.clinicalRationale)) {
      score += 12;
    }
    if (/sleep|muscle/.test(lower) && routine.category === "recovery") score += 14;
    if (/vitamin d/.test(lower) && routine.id === "ex-sunwalk") score += 25;
  }

  if (routine.bestTime === slot || routine.bestTime === "anytime") score += 14;
  if (routine.intensity === "gentle") score += 8;
  if (routine.durationMinutes <= 10) score += 6;

  if (routine.bodyEffects.length >= 3) score += 5;

  return Math.round(score * 10) / 10;
}

export function getTopExercisePicks(
  routines: ExerciseRoutine[],
  ctx: PatientExerciseContext,
  limit = 5,
): ExercisePick[] {
  return getTopExercisePicksForSlot(routines, ctx, getCurrentTimeSlot(), limit);
}

export function getTopExercisePicksForSlot(
  routines: ExerciseRoutine[],
  ctx: PatientExerciseContext,
  slot: ExerciseRoutine["bestTime"],
  limit = 3,
): ExercisePick[] {
  const pool = routines.filter((r) => r.bestTime === slot || r.bestTime === "anytime");

  return pool
    .map((routine) => ({
      routine,
      score: scoreRoutine(routine, ctx, slot),
      recoveryTag: PICK_TAGS[routine.id] ?? "Recovery",
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((pick, i) => ({ ...pick, rank: i + 1 }));
}

export type ExerciseTimeSlot = "morning" | "midday" | "evening";

export function getAllSlotRecoveryPicks(
  routines: ExerciseRoutine[],
  ctx: PatientExerciseContext,
  limitPerSlot = 3,
): Record<ExerciseTimeSlot, ExercisePick[]> {
  return {
    morning: getTopExercisePicksForSlot(routines, ctx, "morning", limitPerSlot),
    midday: getTopExercisePicksForSlot(routines, ctx, "midday", limitPerSlot),
    evening: getTopExercisePicksForSlot(routines, ctx, "evening", limitPerSlot),
  };
}

export function getCurrentExerciseSlotLabel(): string {
  const slot = getCurrentTimeSlot();
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export function groupRoutinesByTimeSlot(
  routines: ExerciseRoutine[],
): { slot: ExerciseRoutine["bestTime"]; label: string; routines: ExerciseRoutine[] }[] {
  const slots: { slot: ExerciseRoutine["bestTime"]; label: string }[] = [
    { slot: "morning", label: "Morning" },
    { slot: "midday", label: "Midday" },
    { slot: "evening", label: "Evening" },
    { slot: "anytime", label: "Anytime" },
  ];

  return slots
    .map(({ slot, label }) => ({
      slot,
      label,
      routines: routines.filter((r) => r.bestTime === slot),
    }))
    .filter((g) => g.routines.length > 0);
}
