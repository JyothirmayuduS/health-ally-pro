import type { ExerciseRoutine } from "@/lib/exercise-mock-data";
import type { ExerciseStepDetail } from "@/lib/exercise-mock-data";

export type { ExerciseStepDetail };

export function buildExerciseSteps(routine: ExerciseRoutine): ExerciseStepDetail[] {
  if (routine.stepDetails?.length) return routine.stepDetails;

  const totalSeconds = routine.durationMinutes * 60;
  const basePerStep = Math.max(30, Math.round(totalSeconds / routine.steps.length));

  return routine.steps.map((instruction) => {
    const repsMatch = instruction.match(/(\d+)\s*(?:reps?|times)/i);
    const holdMatch = instruction.match(/hold\s+(\d+)\s*(?:sec|seconds?)/i);
    const durationMatch = instruction.match(/(\d+)\s*(?:sec|seconds?|min|minutes?)/i);

    let durationSeconds = basePerStep;
    if (holdMatch) {
      durationSeconds = parseInt(holdMatch[1], 10) + 10;
    } else if (durationMatch) {
      const n = parseInt(durationMatch[1], 10);
      durationSeconds = /min/i.test(durationMatch[0]) ? n * 60 : n;
    }

    return {
      instruction,
      durationSeconds,
      reps: repsMatch ? parseInt(repsMatch[1], 10) : undefined,
      holdSeconds: holdMatch ? parseInt(holdMatch[1], 10) : undefined,
    };
  });
}

export function formatStepTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}
