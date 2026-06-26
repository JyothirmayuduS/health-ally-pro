import type { DietMeal } from "@/lib/diet-mock-data";
import {
  CLINICAL_MICRO_LABELS,
  DAILY_VALUES,
  formatMacroSummary,
  getMealNutrition,
  listClinicalMicros,
  pctDaily,
  type ClinicalMicroKey,
} from "@/lib/diet-nutrition";
import { cn } from "@/lib/utils";

type Props = {
  meal: DietMeal;
  variant?: "card" | "full";
  className?: string;
};

const MACRO_STYLES = {
  protein: "bg-emerald-500/12 text-emerald-800 border-emerald-500/20",
  carbs: "bg-amber-500/12 text-amber-900 border-amber-500/20",
  fat: "bg-sky-500/12 text-sky-900 border-sky-500/20",
  fiber: "bg-violet-500/12 text-violet-900 border-violet-500/20",
} as const;

function MacroPill({
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
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold tabular-nums",
        style,
      )}
    >
      <span className="text-[9px] font-semibold uppercase opacity-70">{label}</span>
      {value}
      {unit}
    </span>
  );
}

function DvBar({ label, value, unit, pct }: { label: string; value: number; unit: string; pct: number | null }) {
  const width = pct != null ? Math.min(100, pct) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular-nums text-ink-muted">
          {value}
          {unit}
          {pct != null ? <span className="ml-1 text-[10px]">({pct}% DV)</span> : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#EDEAE6]">
        <div
          className="h-full rounded-full bg-clay transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ClinicalMicroChip({ microKey, value }: { microKey: ClinicalMicroKey; value: number }) {
  const meta = CLINICAL_MICRO_LABELS[microKey];
  const pct = pctDaily(value, meta.daily);
  return (
    <span className="inline-flex flex-col rounded-xl border border-clay/20 bg-clay/5 px-2.5 py-1.5">
      <span className="text-[9px] font-bold uppercase tracking-wide text-clay">{meta.label}</span>
      <span className="text-xs font-bold tabular-nums text-ink">
        {value}
        {meta.unit}
        {pct != null ? <span className="ml-0.5 text-[10px] font-medium text-ink-muted">· {pct}% DV</span> : null}
      </span>
    </span>
  );
}

export function DietNutritionPanel({ meal, variant = "card", className }: Props) {
  const n = getMealNutrition(meal);
  const clinicalMicros = listClinicalMicros(n);
  const sodiumPct = pctDaily(n.sodiumMg, DAILY_VALUES.sodiumMg);
  const fiberPct = pctDaily(n.fiberG, DAILY_VALUES.fiberG);

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[#EDEAE6] bg-[#F9F7F2]/60 p-3",
          className,
        )}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Nutrition per serving
          </p>
          <span className="text-[10px] font-medium text-ink-muted">{n.servingSize}</span>
        </div>

        <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
          <span className="font-serif text-2xl tabular-nums text-ink">{n.calories}</span>
          <span className="text-sm font-medium text-ink-muted">kcal</span>
          {meal.servings && meal.servings > 1 ? (
            <span className="text-[10px] text-ink-muted">· {meal.servings} servings total</span>
          ) : null}
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          <MacroPill label="Protein" value={n.proteinG} style={MACRO_STYLES.protein} />
          <MacroPill label="Carbs" value={n.carbsG} style={MACRO_STYLES.carbs} />
          <MacroPill label="Fat" value={n.fatG} style={MACRO_STYLES.fat} />
          <MacroPill label="Fiber" value={n.fiberG} style={MACRO_STYLES.fiber} />
        </div>

        <p className="text-[11px] text-ink-muted">
          {formatMacroSummary(n)}
          {" · "}
          {n.sodiumMg}mg sodium
          {sodiumPct != null ? ` (${sodiumPct}% DV)` : ""}
          {" · "}
          {n.sugarG}g sugar
        </p>

        {clinicalMicros.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {clinicalMicros.map(({ key, value }) => (
              <ClinicalMicroChip key={key} microKey={key} value={value} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Per serving
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink">{n.servingSize}</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-3xl tabular-nums text-ink">{n.calories}</p>
            <p className="text-xs font-medium text-ink-muted">calories</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Protein", value: n.proteinG, unit: "g", daily: DAILY_VALUES.proteinG },
            { label: "Carbs", value: n.carbsG, unit: "g", daily: DAILY_VALUES.carbsG },
            { label: "Fat", value: n.fatG, unit: "g", daily: DAILY_VALUES.fatG },
            { label: "Fiber", value: n.fiberG, unit: "g", daily: DAILY_VALUES.fiberG },
          ].map(({ label, value, unit, daily }) => (
            <div
              key={label}
              className="rounded-xl border border-[#EDEAE6] bg-[#F9F7F2]/50 px-3 py-2.5 text-center"
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                {value}
                <span className="text-xs font-medium text-ink-muted">{unit}</span>
              </p>
              {pctDaily(value, daily) != null ? (
                <p className="text-[10px] text-ink-muted">{pctDaily(value, daily)}% DV</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Detailed breakdown
        </p>
        <div className="space-y-3">
          <DvBar label="Saturated fat" value={n.saturatedFatG} unit="g" pct={pctDaily(n.saturatedFatG, DAILY_VALUES.saturatedFatG)} />
          <DvBar label="Sodium" value={n.sodiumMg} unit="mg" pct={sodiumPct} />
          <DvBar label="Fiber" value={n.fiberG} unit="g" pct={fiberPct} />
          <DvBar label="Sugar" value={n.sugarG} unit="g" pct={pctDaily(n.sugarG, DAILY_VALUES.sugarG)} />
        </div>
      </div>

      {clinicalMicros.length > 0 ? (
        <div className="rounded-[20px] border border-clay/20 bg-clay/5 p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-clay">
            Thyroid-relevant micronutrients
          </p>
          <p className="mb-3 text-xs text-ink-muted">
            Synced to your medication plan — iodine, selenium, zinc, and co-factors for hormone synthesis.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {clinicalMicros.map(({ key, value, pct }) => {
              const meta = CLINICAL_MICRO_LABELS[key];
              return (
                <DvBar
                  key={key}
                  label={meta.label}
                  value={value}
                  unit={meta.unit}
                  pct={pct}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {meal.nutrients.length > 0 ? (
        <p className="text-xs text-ink-muted">
          <span className="font-semibold text-ink">Tagged nutrients:</span> {meal.nutrients.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
