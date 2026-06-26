export type BottleColor = "yellow" | "brown" | "green" | "red" | "blue";
type BottleVariant = "jar" | "dropper" | "tube" | "capsule";

const caps: Record<BottleColor, string> = {
  yellow: "#F5C842",
  brown: "#8B6914",
  green: "#B8735D",
  red: "#E85D5D",
  blue: "#5B9BD5",
};

const bodies: Record<BottleColor, string> = {
  yellow: "#FFF8E1",
  brown: "#F5E6D3",
  green: "#F0DDD6",
  red: "#FFF5F5",
  blue: "#E8F4FC",
};

export function SupplementBottle({
  variant = "jar",
  color = "yellow",
}: {
  variant?: BottleVariant;
  color?: BottleColor;
}) {
  const cap = caps[color];
  const body = bodies[color];

  if (variant === "dropper") {
    return (
      <svg viewBox="0 0 48 72" className="h-[72px] w-11" aria-hidden>
        <ellipse cx="24" cy="66" rx="10" ry="3" fill="#E8ECED" />
        <rect x="19" y="6" width="10" height="10" rx="2" fill="#6B5344" />
        <rect x="21" y="14" width="6" height="8" fill="#8B7355" />
        <path d="M15 22h18l-3 42H18L15 22z" fill={body} stroke="#D4C4B0" strokeWidth="1" />
        <rect x="18" y="34" width="12" height="18" rx="1" fill={cap} opacity="0.55" />
      </svg>
    );
  }

  if (variant === "tube") {
    return (
      <svg viewBox="0 0 48 72" className="h-[72px] w-11" aria-hidden>
        <ellipse cx="24" cy="66" rx="12" ry="4" fill="#E8ECED" />
        <path d="M13 24h22v40H13V24z" fill={body} stroke="#E0D5C8" strokeWidth="1" />
        <rect x="13" y="16" width="22" height="10" rx="3" fill={cap} />
        <rect x="17" y="34" width="14" height="22" rx="2" fill={cap} opacity="0.35" />
      </svg>
    );
  }

  if (variant === "capsule") {
    return (
      <svg viewBox="0 0 48 72" className="h-[72px] w-11" aria-hidden>
        <ellipse cx="24" cy="66" rx="11" ry="3.5" fill="#E8ECED" />
        <path d="M16 22h16l2 42H14l2-42z" fill={body} stroke="#E0E0E0" strokeWidth="1" />
        <rect x="16" y="12" width="16" height="12" rx="4" fill={cap} />
        <rect x="18" y="36" width="12" height="16" rx="2" fill={cap} opacity="0.4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 72" className="h-[72px] w-11" aria-hidden>
      <ellipse cx="24" cy="66" rx="13" ry="4" fill="#E8ECED" />
      <path d="M14 26h20l3 38H11l3-38z" fill={body} stroke="#E5E0D0" strokeWidth="1" />
      <rect x="14" y="14" width="20" height="14" rx="4" fill={cap} />
      <rect x="17" y="38" width="14" height="20" rx="2" fill={cap} opacity="0.35" />
      <rect x="20" y="10" width="8" height="6" rx="2" fill="#1B3B2E" />
    </svg>
  );
}
