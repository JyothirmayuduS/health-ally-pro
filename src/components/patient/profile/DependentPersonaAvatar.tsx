import { QueuePersonaIcon } from "@/components/patient/QueuePersonaIcon";
import type { Dependent } from "@/lib/patient-profile-data";
import { cn } from "@/lib/utils";

const ACCENT: Record<string, { stroke: string; track: string }> = {
  mila: { stroke: "#5B8DB8", track: "rgba(91, 141, 184, 0.22)" },
  arthur: { stroke: "#8B6BB8", track: "rgba(139, 107, 184, 0.22)" },
};

function accentFor(dep: Dependent) {
  return ACCENT[dep.id] ?? { stroke: "#6B8F71", track: "rgba(107, 143, 113, 0.22)" };
}

type Props = {
  dep: Dependent;
  size?: "sm" | "md" | "lg";
  showAdherence?: boolean;
  className?: string;
};

const PERSONA_SIZE = { sm: "sm" as const, md: "md" as const, lg: "md" as const };
const RING_SIZE = { sm: 48, md: 56, lg: 72 };

export function DependentPersonaAvatar({
  dep,
  size = "md",
  showAdherence = false,
  className,
}: Props) {
  const { stroke, track } = accentFor(dep);
  const ringSize = RING_SIZE[size];
  const personaSize = PERSONA_SIZE[size];

  if (!showAdherence) {
    return (
      <QueuePersonaIcon
        persona={dep.persona}
        kind="you"
        size={personaSize}
        plain
        className={className}
      />
    );
  }

  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset =
    circumference - (Math.min(100, Math.max(0, dep.adherence)) / 100) * circumference;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: ringSize, height: ringSize }}
      aria-label={`${dep.adherence}% care plan adherence`}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 44 44"
        aria-hidden
      >
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="3" stroke={track} />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <QueuePersonaIcon persona={dep.persona} kind="you" size={personaSize} plain />
      </div>
    </div>
  );
}

export function dependentAccent(dep: Dependent) {
  return accentFor(dep);
}
