import { Link } from "@tanstack/react-router";
import { ChevronRight, Radio, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useClinicalDietProfile } from "@/hooks/useClinicalDietProfile";
import { BUDGET_LABELS } from "@/lib/diet-ai-types";
import type { DietMeal } from "@/lib/diet-mock-data";
import {
  getAllTierRecoveryPicks,
  getCurrentMealSlotLabel,
  type DietBudget,
  type RecoveryPick,
} from "@/lib/diet-recovery-picks";
import { formatMacroSummary, getMealNutrition } from "@/lib/diet-nutrition";
import { cn } from "@/lib/utils";

const HIDE_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

type Props = {
  meals: DietMeal[];
  activeBudget?: DietBudget;
  lactoseFreeOnly?: boolean;
  compact?: boolean;
  /** When false, only shows picks for activeBudget (e.g. Chef chat). */
  showAllTiers?: boolean;
  className?: string;
};

const RANK_STYLES = [
  "bg-amber-500 text-white",
  "bg-[#C4B5A0] text-white",
  "bg-[#D4CFC8] text-ink",
] as const;

function RecoveryPickCard({ pick, compact }: { pick: RecoveryPick; compact?: boolean }) {
  const n = getMealNutrition(pick.meal);

  return (
    <Link
      to="/diet/$mealId"
      params={{ mealId: pick.meal.id }}
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
        {pick.meal.name}
      </p>
      <p className="mt-1 text-[10px] capitalize text-ink-muted">{pick.meal.mealType}</p>

      <p className="mt-2 text-[11px] font-medium tabular-nums text-ink">
        {n.calories} kcal
        <span className="ml-1.5 font-normal text-ink-muted">{formatMacroSummary(n)}</span>
      </p>

      {!compact ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-clay">
          Open recipe
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </Link>
  );
}

function TierRow({
  budget,
  picks,
  highlighted,
  compact,
}: {
  budget: DietBudget;
  picks: RecoveryPick[];
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
            {BUDGET_LABELS[budget].label}
          </p>
          <p className="text-[11px] text-ink-muted">{BUDGET_LABELS[budget].subtitle}</p>
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
          <RecoveryPickCard key={pick.meal.id} pick={pick} compact={compact} />
        ))}
      </div>
    </div>
  );
}

export function DietRecoveryPicks({
  meals,
  activeBudget = "balanced",
  lactoseFreeOnly = false,
  compact = false,
  showAllTiers = true,
  className,
}: Props) {
  const { profile: ctx } = useClinicalDietProfile();
  const picks = useMemo(
    () => getAllTierRecoveryPicks(meals, ctx, { lactoseFreeOnly, limitPerTier: 3 }),
    [meals, ctx, lactoseFreeOnly],
  );
  const slotLabel = getCurrentMealSlotLabel();
  const tiers = showAllTiers ? (["essential", "balanced", "elite"] as const) : [activeBudget];

  return (
    <section className={cn("mb-5 sm:mb-6", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-clay" strokeWidth={1.75} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Real-time recovery food
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-sm text-ink-muted">
            {showAllTiers
              ? `Top 3 per tier for faster recovery — synced to your meds · prioritizing ${slotLabel.toLowerCase()}`
              : `Top 3 ${BUDGET_LABELS[activeBudget].label.toLowerCase()} picks for ${slotLabel.toLowerCase()}`}
          </p>
        </div>
      </div>

      <div className={cn("flex flex-col gap-3", compact && "gap-2.5")}>
        {tiers.map((tier) => (
          <TierRow
            key={tier}
            budget={tier}
            picks={picks[tier]}
            highlighted={tier === activeBudget}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}
