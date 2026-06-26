import { Link } from "@tanstack/react-router";
import { Clock4, Moon, Pill, UtensilsCrossed } from "lucide-react";
import type { PatientMedication } from "@/lib/mock-data";
import { timeBadgeColors } from "@/components/patient/medications/patient-med-utils";
import { cn } from "@/lib/utils";

function InstructionChip({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const Icon = lower.includes("food")
    ? UtensilsCrossed
    : lower.includes("bed")
      ? Moon
      : Pill;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[#B8735D]/10 px-2 py-1 text-[10px] font-medium text-[#B8735D]">
      <Icon className="h-3 w-3" strokeWidth={2} />
      {label}
    </span>
  );
}

type Props = {
  med: PatientMedication;
  onToggle?: (id: string) => void;
  className?: string;
};

export function HomeMedCard({ med, onToggle, className }: Props) {
  const badge = timeBadgeColors(med.time);
  const tag = med.instructionTag ?? med.reason;
  const takenLabel = med.taken ? `Mark ${med.name} as not taken` : `Mark ${med.name} as taken`;

  return (
    <div
      className={cn(
        "group relative flex h-[185px] w-[185px] shrink-0 flex-col rounded-[28px] border bg-white p-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md sm:w-[200px]",
        "sm:h-auto sm:min-h-[185px] sm:w-full sm:shrink",
        med.taken ? "border-[#E8E4DF] opacity-90" : "border-[#EDEAE6]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className="rounded-xl px-3 py-1.5 text-[11px] font-semibold tracking-wide"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {med.time}
        </span>
        <button
          type="button"
          onClick={() => onToggle?.(med.id)}
          aria-label={takenLabel}
          aria-pressed={med.taken}
          className={cn(
            "grid min-h-[48px] min-w-[48px] place-items-center rounded-full transition-colors",
            med.taken ? "border-[#B8735D] bg-[#B8735D]/15" : "border-[#E5E1DC] bg-white",
          )}
        >
          <span
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full border-[1.5px]",
              med.taken ? "border-[#B8735D] bg-[#B8735D] text-[10px] font-bold text-white" : "border-[#E5E1DC]",
            )}
          >
            {med.taken ? "✓" : null}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onToggle?.(med.id)}
        aria-label={takenLabel}
        className="mt-3.5 flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      >
        <Pill
          className={cn("mb-1.5 h-[18px] w-[18px]", med.taken ? "text-ink-muted" : "text-clay")}
          strokeWidth={1.75}
        />
        <p
          className={cn(
            "text-base font-semibold leading-tight tracking-tight",
            med.taken ? "text-ink-muted line-through opacity-60" : "text-ink",
          )}
        >
          {med.name}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[13px]",
            med.taken ? "text-ink-muted/50 line-through" : "text-ink-muted/80",
          )}
        >
          {med.dosage}
        </p>
      </button>

      <div className="border-t border-black/[0.04] pt-3">
        <p
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            med.taken ? "text-ink-muted/50 line-through" : "text-ink-muted/80",
          )}
        >
          <Clock4 className="h-3 w-3" strokeWidth={1.75} />
          Take at {med.time}
        </p>
        <div className="mt-2">
          <InstructionChip label={tag} />
        </div>
      </div>

      <Link
        to="/medications/$medId"
        params={{ medId: med.id }}
        aria-label={`Open ${med.name} details`}
        className="absolute inset-x-0 bottom-0 h-12 rounded-b-[28px] opacity-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"
      />
    </div>
  );
}

export function HomeMedsProgressCard({
  taken,
  total,
  pct,
}: {
  taken: number;
  total: number;
  pct: number;
}) {
  return (
    <div className="rounded-[24px] border border-[#EDEAE6] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">
          {taken} of {total} taken today
        </p>
        <p className="font-serif text-lg tabular-nums text-ink">{pct}%</p>
      </div>
      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[#EDEAE6]">
        <div
          className="h-full rounded-full bg-clay transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
