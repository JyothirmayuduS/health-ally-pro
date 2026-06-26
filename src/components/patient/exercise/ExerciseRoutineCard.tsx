import { Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, ChevronRight, Dumbbell, Heart, ShieldCheck, Wind, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import type { ExerciseCategory, ExerciseRoutine } from "@/lib/exercise-mock-data";
import { EXERCISE_SESSION_EVENT, isRoutineCompletedToday } from "@/lib/exercise-session-store";
import { ExerciseRoutineThumbnail } from "@/components/patient/exercise/ExerciseRoutineThumbnail";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<ExerciseCategory, { label: string; icon: typeof Activity }> = {
  mobility: { label: "Mobility", icon: Activity },
  cardio: { label: "Cardio", icon: Heart },
  strength: { label: "Strength", icon: Dumbbell },
  breathing: { label: "Breathing", icon: Wind },
  recovery: { label: "Recovery", icon: ShieldCheck },
};

export function ExerciseRoutineCard({ routine }: { routine: ExerciseRoutine }) {
  const meta = CATEGORY_META[routine.category];
  const Icon = meta.icon;
  const [done, setDone] = useState(() => isRoutineCompletedToday(routine.id));

  useEffect(() => {
    const refresh = () => setDone(isRoutineCompletedToday(routine.id));
    window.addEventListener(EXERCISE_SESSION_EVENT, refresh);
    return () => window.removeEventListener(EXERCISE_SESSION_EVENT, refresh);
  }, [routine.id]);

  return (
    <Link
      to="/exercise/$routineId"
      params={{ routineId: routine.id }}
      className={cn(
        "group flex items-start gap-4 rounded-[24px] border bg-white p-4 transition-all",
        "shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-clay/25 hover:shadow-[0_8px_24px_rgba(27,59,46,0.06)] active:bg-[#F9F7F2]",
        done ? "border-status-doneBorder opacity-90" : "border-[#EDEAE6]",
      )}
    >
      <ExerciseRoutineThumbnail
        routine={routine}
        size="md"
        className="h-14 w-14 shrink-0 rounded-2xl sm:h-16 sm:w-16"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-semibold text-ink", done && "text-ink-muted")}>{routine.name}</p>
          {done ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-status-doneText" aria-label="Completed today" />
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{routine.clinicalRationale}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F9F7F2] px-2 py-1 text-xs font-semibold text-ink-muted">
            <Icon className="h-3 w-3" strokeWidth={1.75} />
            {meta.label}
          </span>
          <span className="rounded-lg bg-[#F9F7F2] px-2 py-1 text-xs font-semibold text-ink-muted">
            {routine.durationMinutes} min
          </span>
          <span className="rounded-lg bg-clay/10 px-2 py-1 text-xs font-semibold capitalize text-clay">
            {routine.intensity}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F9F7F2] px-2 py-1 text-xs font-semibold text-ink-muted">
            <Youtube className="h-3 w-3" />
            Video
          </span>
        </div>
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export { CATEGORY_META };
