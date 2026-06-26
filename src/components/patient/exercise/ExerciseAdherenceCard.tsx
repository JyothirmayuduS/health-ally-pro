import { cn } from "@/lib/utils";

type Props = {
  completed: number;
  prescribed: number;
  pct: number;
  minutesDone?: number;
  streak?: number;
  className?: string;
  size?: "sm" | "md";
};

export function ExerciseAdherenceCard({
  completed,
  prescribed,
  pct,
  minutesDone = 0,
  streak = 0,
  className,
  size = "md",
}: Props) {
  const ringSize = size === "sm" ? 56 : 72;
  const stroke = size === "sm" ? 5 : 6;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#EDEAE6] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)]",
        size === "sm" ? "px-4 py-3.5" : "p-5",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90" aria-hidden>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="#EDEAE6"
              strokeWidth={stroke}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--clay, #b85c38)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 grid place-items-center font-serif tabular-nums text-ink",
              size === "sm" ? "text-sm" : "text-lg",
            )}
          >
            {pct}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {completed} of {prescribed} routines today
          </p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {minutesDone > 0 ? `${minutesDone} min completed` : "Start your prescription"}
          </p>
          {streak > 0 ? (
            <p className="mt-1.5 text-xs font-medium text-clay">
              {streak}-day streak · keep it up
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[#EDEAE6]">
        <div
          className="h-full rounded-full bg-clay transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
