import { cn } from "@/lib/utils";

type Props = {
  pct?: number;
  className?: string;
};

/** Matches medications hub “OVERALL ADHERENCE” card from patient UI spec. */
export function OverallAdherenceCard({ pct = 0, className }: Props) {
  return (
    <div
      className={cn(
        "flex min-h-[132px] flex-col rounded-[20px] border border-[#EDEAE6] bg-white p-[18px]",
        "shadow-[0_4px_12px_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8F8C]">
        OVERALL ADHERENCE
      </p>
      <p className="mt-1 font-serif text-[36px] font-normal leading-none tracking-tight text-ink">
        {pct}%
      </p>
      <div className="mt-auto pt-3">
        <div className="h-1 overflow-hidden rounded-full bg-[#EDEAE6]">
          <div
            className="h-full rounded-full bg-clay transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
