import { getPatientExerciseContext } from "@/lib/exercise-ai-client";
import type { ExerciseRoutine } from "@/lib/exercise-mock-data";
import { patientMedications } from "@/lib/mock-data";

export type MedSafetyStatus = {
  blocked: boolean;
  reason?: string;
  waitMinutes?: number;
  safeAlternativeId?: string;
};

function parseMedTime(timeStr: string): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function checkMedSafetyGate(routine: ExerciseRoutine): MedSafetyStatus {
  const ctx = getPatientExerciseContext();
  if (!ctx.takesThyroidMeds) return { blocked: false };

  const needsGap =
    routine.syncedMeds.some((m) => /levothyroxine/i.test(m)) &&
    (routine.medGapNote?.includes("60") ||
      routine.intensity !== "gentle" ||
      routine.category === "cardio");

  if (!needsGap) return { blocked: false };

  const thyroidMed = patientMedications.find((m) => /levothyroxine/i.test(m.name));
  if (!thyroidMed) return { blocked: false };

  const medTime = parseMedTime(thyroidMed.time);
  if (!medTime) return { blocked: false };

  const now = new Date();
  const minutesSinceMed = Math.floor((now.getTime() - medTime.getTime()) / 60_000);
  const requiredWait = 60;

  if (minutesSinceMed >= requiredWait) return { blocked: false };

  const waitMinutes = requiredWait - Math.max(0, minutesSinceMed);

  return {
    blocked: waitMinutes > 0,
    reason: `Wait ${requiredWait} minutes after levothyroxine before this routine. Your dose was at ${thyroidMed.time}.`,
    waitMinutes,
    safeAlternativeId: "ex-breath",
  };
}
