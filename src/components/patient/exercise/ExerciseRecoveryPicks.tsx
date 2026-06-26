import { Link } from "@tanstack/react-router";
import { ChevronRight, Radio, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { getPatientExerciseContext } from "@/lib/exercise-ai-client";
import type { ExerciseRoutine } from "@/lib/exercise-mock-data";
import {
  getAllSlotRecoveryPicks,
  getCurrentExerciseSlotLabel,
  type ExercisePick,
  type ExerciseTimeSlot,
} from "@/lib/exercise-recovery-picks";
import { cn } from "@/lib/utils";

const HIDE_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const EXERCISE_SLOT_LABELS: Record<
  ExerciseTimeSlot,
  { label: string; subtitle: string }
> = {
  morning: { label: "Morning", subtitle: "After meds" },
  midday: { label: "Midday", subtitle: "Active window" },
  evening: { label: "Evening", subtitle: "Recovery focus" },
};

type Props = {
  routines: ExerciseRoutine[];
  activeSlot?: ExerciseTimeSlot;
  compact?: boolean;
  showAllSlots?: boolean;
  className?: string;
};

const RANK_STYLES = [
  "bg-amber-500 text-white",
  "bg-[#C4B5A0] text-white",
  "bg-[#D4CFC8] text-ink",
] as const;

function RecoveryPickCard({ pick, compact }: { pick: ExercisePick; compact?: boolean }) {
  const effect = pick.routine.bodyEffects[0];

  return (
    <Link
      to="/exercise/$routineId"
      params={{ routineId: pick.routine.id }}
      className={cn(
        "group flex shrink-0 flex-col rounded-[18px] border border-[#EDEAE6] bg-white transition-all",
        "hover:border-clay/30 hover:shadow-[0_6px_20px_rgba(27,59,46,0.07)]",
        compact ? "w-[min(72vw,240px)] p-3" : "w-full p-4",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
            RANK_STYLES[pick.rank - 1] ?? RANK_STYLES[2],
          )}
        >
          #{pick.rank}
        </span>
        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-700">
          {pick.recoveryTag}
        </span>
      </div>

      <p className={cn("font-semibold text-ink", compact ? "text-sm leading-snug" : "text-base")}>
        {pick.routine.name}
      </p>
      <p className="mt-1 text-[10px] capitalize text-ink-muted">{pick.routine.category}</p>

      <p className="mt-2 text-[11px] font-medium tabular-nums text-ink">
        {pick.routine.durationMinutes} min
        <span className="ml-1.5 font-normal text-ink-muted">
          · {pick.routine.intensity}
          {effect ? ` · ${effect.effect}` : ""}
        </span>
      </p>

      {!compact ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-clay">
          Open routine
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </Link>
  );
}

function SlotRow({
  slot,
  picks,
  highlighted,
  compact,
}: {
  slot: ExerciseTimeSlot;
  picks: ExercisePick[];
  highlighted?: boolean;
  compact?: boolean;
}) {
  if (!picks.length) return null;

  return (
    <div
      className={cn(
        "rounded-[20px] border p-3 sm:p-4",
        highlighted ? "border-clay/30 bg-clay/5" : "border-[#EDEAE6] bg-white",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {EXERCISE_SLOT_LABELS[slot].label}
          </p>
          <p className="text-[11px] text-ink-muted">{EXERCISE_SLOT_LABELS[slot].subtitle}</p>
        </div>
        {highlighted ? (
          <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[9px] font-bold uppercase text-clay">
            Selected
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          compact
            ? cn("flex gap-2.5 overflow-x-auto pb-0.5", HIDE_SCROLLBAR)
            : "grid gap-2.5 sm:grid-cols-3",
        )}
      >
        {picks.map((pick) => (
          <RecoveryPickCard key={pick.routine.id} pick={pick} compact={compact} />
        ))}
      </div>
    </div>
  );
}

export function ExerciseRecoveryPicks({
  routines,
  activeSlot = "evening",
  compact = false,
  showAllSlots = true,
  className,
}: Props) {
  const ctx = useMemo(() => getPatientExerciseContext(), []);
  const picks = useMemo(() => getAllSlotRecoveryPicks(routines, ctx, 3), [routines, ctx]);
  const slotLabel = getCurrentExerciseSlotLabel();
  const slots = showAllSlots ? (["morning", "midday", "evening"] as const) : [activeSlot];

  return (
    <section className={cn("mb-5 sm:mb-6", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-clay" strokeWidth={1.75} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Real-time recovery movement
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
              <Radio className="h-2.5 w-2.5" />
              Live
            </span>
          </div>
          <p className="text-sm text-ink-muted">
            {showAllSlots
              ? `Top 3 per time slot for faster recovery — synced to your meds · prioritizing ${slotLabel.toLowerCase()}`
              : `Top 3 ${EXERCISE_SLOT_LABELS[activeSlot].label.toLowerCase()} picks for recovery`}
          </p>
        </div>
      </div>

      <div className={cn("flex flex-col gap-3", compact && "gap-2.5")}>
        {slots.map((slot) => (
          <SlotRow
            key={slot}
            slot={slot}
            picks={picks[slot]}
            highlighted={slot === activeSlot}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}
