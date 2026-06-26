import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { medsAdherenceSummary } from "@/lib/patient-meds-store";
import { getTodayAdherence } from "@/lib/exercise-session-store";
import { getPatientExerciseContext } from "@/lib/exercise-ai-client";
import { exerciseRoutines } from "@/lib/exercise-mock-data";
import { getTopExercisePicks } from "@/lib/exercise-recovery-picks";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  visitsDone?: number;
};

/** One-line daily progress summary for home and Health hub. */
export function PatientProgressStrip({ className, visitsDone = 0 }: Props) {
  const { taken, total, pct } = medsAdherenceSummary();
  const exercisePicks = getTopExercisePicks(
    exerciseRoutines,
    getPatientExerciseContext(),
    3,
  );
  const exercise = getTodayAdherence(exercisePicks.length);

  return (
    <Link
      to="/health"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-colors active:bg-[#F9F7F2]",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-ink">
          Meds <span className="tabular-nums text-clay">{taken}/{total}</span>
        </span>
        <span className="hidden text-ink-muted sm:inline" aria-hidden>
          ·
        </span>
        <span className="text-ink-muted">
          Move <span className="font-medium tabular-nums text-ink">{exercise.pct}%</span>
        </span>
        <span className="hidden text-ink-muted sm:inline" aria-hidden>
          ·
        </span>
        <span className="text-ink-muted">
          Adherence <span className="font-medium tabular-nums text-ink">{pct}%</span>
        </span>
        {visitsDone > 0 ? (
          <>
            <span className="hidden text-ink-muted md:inline" aria-hidden>
              ·
            </span>
            <span className="hidden text-ink-muted md:inline">
              {visitsDone} visit{visitsDone === 1 ? "" : "s"} done
            </span>
          </>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
    </Link>
  );
}
