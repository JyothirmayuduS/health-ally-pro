import type { DietMeal } from "@/lib/diet-mock-data";
import {
  formatMacroSummary,
  getMealNutrition,
  pctDaily,
  DAILY_VALUES,
} from "@/lib/diet-nutrition";
import { cn } from "@/lib/utils";

type Props = {
  meal: DietMeal;
  className?: string;
  /** Show serving size label (default true) */
  showServing?: boolean;
  /** Compact single-line macros (default true) */
  compact?: boolean;
};

const MACRO_STYLES = {
  P: "bg-emerald-500/12 text-emerald-800",
  C: "bg-amber-500/12 text-amber-900",
  F: "bg-sky-500/12 text-sky-900",
  Fi: "bg-violet-500/12 text-violet-900",
} as const;

function MacroChip({
  label,
  value,
  unit = "g",
  style,
}: {
  label: string;
  value: number;
  unit?: string;
  style: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        style,
      )}
    >
      <span className="opacity-70">{label}</span>
      {value}
      {unit}
    </span>
  );
}

export function DietMealNutritionStrip({
  meal,
  className,
  showServing = true,
  compact = true,
}: Props) {
  const n = getMealNutrition(meal);
  const fiberPct = pctDaily(n.fiberG, DAILY_VALUES.fiberG);

  if (!compact) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {showServing ? (
          <p className="text-[11px] font-medium text-ink-muted">
            Per serving · {n.servingSize}
          </p>
        ) : null}
        <p className="text-sm font-semibold tabular-nums text-ink">
          {n.calories} kcal
          <span className="ml-2 text-xs font-normal text-ink-muted">
            {formatMacroSummary(n)} · Fiber {n.fiberG}g
            {fiberPct ? ` (${fiberPct}% DV)` : ""}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {showServing ? (
        <span className="text-[10px] font-medium text-ink-muted">{n.servingSize}</span>
      ) : null}
      <span className="text-[11px] font-bold tabular-nums text-ink">{n.calories} kcal</span>
      <MacroChip label="P" value={n.proteinG} style={MACRO_STYLES.P} />
      <MacroChip label="C" value={n.carbsG} style={MACRO_STYLES.C} />
      <MacroChip label="F" value={n.fatG} style={MACRO_STYLES.F} />
      <MacroChip label="Fi" value={n.fiberG} style={MACRO_STYLES.Fi} />
    </div>
  );
}
