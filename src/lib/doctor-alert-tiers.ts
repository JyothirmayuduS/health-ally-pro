/** Alert severity tiers — P0 critical, P1 urgent, P2 informational */
export type AlertTier = "critical" | "urgent" | "warn" | "info";

export const ALERT_TIER_ORDER: Record<AlertTier, number> = {
  critical: 0,
  urgent: 1,
  warn: 2,
  info: 3,
};

export function alertTierBadgeClass(tier: AlertTier, active = false) {
  if (active) return "bg-white/20 text-white";
  switch (tier) {
    case "critical":
      return "bg-[#C45C4A] text-white";
    case "urgent":
      return "bg-[#C45C4A] text-white";
    case "warn":
      return "bg-[#E9A820] text-[#5C4A1E]";
    default:
      return "bg-[#EDEAE6] text-[#6B6B6B]";
  }
}

export function alertTierBorderClass(tier: AlertTier) {
  switch (tier) {
    case "critical":
      return "border-[#FECACA] bg-[#FEF2F2]/60";
    case "urgent":
      return "border-[#FECACA] bg-white";
    case "warn":
      return "border-[#F5E6B8] bg-white";
    default:
      return "border-[#E8E4DF] bg-white";
  }
}

export function alertTierDotClass(tier: AlertTier) {
  switch (tier) {
    case "critical":
    case "urgent":
      return "bg-[#C45C4A]";
    case "warn":
      return "bg-[#E9A820]";
    default:
      return "bg-[#8A8F8C]";
  }
}

/** Nav tab badges — only P1+ get red; counts alone use neutral */
export function navBadgeClass(urgent: boolean) {
  return urgent
    ? "bg-[#C45C4A] text-white"
    : "bg-[#EDEAE6] text-[#6B6B6B]";
}
