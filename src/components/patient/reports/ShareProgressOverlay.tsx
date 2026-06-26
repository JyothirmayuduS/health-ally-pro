import { Clock, Stethoscope, User } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ShareProgressPhase = "preparing" | "encrypting" | "transmitting";

const PHASES: {
  id: ShareProgressPhase;
  title: string;
  subtitle: string;
  progress: number;
  activeIcon: typeof User;
}[] = [
  {
    id: "preparing",
    title: "Preparing…",
    subtitle: "Accessing clinical records",
    progress: 28,
    activeIcon: User,
  },
  {
    id: "encrypting",
    title: "Encrypting…",
    subtitle: "Establishing secure tunnel",
    progress: 58,
    activeIcon: Clock,
  },
  {
    id: "transmitting",
    title: "Transmitting…",
    subtitle: "Sending to selected providers",
    progress: 88,
    activeIcon: Stethoscope,
  },
];

type Props = {
  open: boolean;
  onComplete: () => void;
};

export function ShareProgressOverlay({ open, onComplete }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhaseIndex(0);
      return;
    }

    const timers = [
      window.setTimeout(() => setPhaseIndex(1), 900),
      window.setTimeout(() => setPhaseIndex(2), 1800),
      window.setTimeout(() => onComplete(), 2800),
    ];

    return () => timers.forEach(clearTimeout);
  }, [open, onComplete]);

  if (!open) return null;

  const phase = PHASES[phaseIndex] ?? PHASES[0]!;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/92 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          {PHASES.map((step, i) => {
            const Icon = step.activeIcon;
            const active = i === phaseIndex;
            const done = i < phaseIndex;
            return (
              <div key={step.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-2xl border bg-white",
                    active && "border-clay",
                    done && "border-clay/40",
                    !active && !done && "border-[#E8E4DF]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-clay" : done ? "text-clay/60" : "text-ink-muted",
                    )}
                    strokeWidth={1.75}
                  />
                </span>
                {i < PHASES.length - 1 ? (
                  <span
                    className={cn(
                      "h-px w-8 sm:w-12",
                      i < phaseIndex ? "bg-clay" : "bg-[#E8E4DF]",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        <h2 className="font-serif text-3xl text-ink">{phase.title}</h2>
        <p className="mt-2 text-sm text-ink-muted">{phase.subtitle}</p>

        <div className="mx-auto mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#EDEAE6]">
          <div
            className="h-full rounded-full bg-clay transition-all duration-700 ease-out"
            style={{ width: `${phase.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
