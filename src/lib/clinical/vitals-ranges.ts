export type VitalFlag = "normal" | "warning" | "critical";

export function parseBp(bp: string): { systolic: number; diastolic: number } | null {
  const match = bp.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return null;
  return { systolic: Number(match[1]), diastolic: Number(match[2]) };
}

export function flagBp(bp: string): VitalFlag {
  const parsed = parseBp(bp);
  if (!parsed) return "normal";
  const { systolic, diastolic } = parsed;
  if (systolic >= 180 || diastolic >= 120 || systolic < 90 || diastolic < 60) return "critical";
  if (systolic >= 140 || diastolic >= 90) return "warning";
  return "normal";
}

export function flagHr(hr: number): VitalFlag {
  if (hr < 50 || hr > 120) return "critical";
  if (hr < 60 || hr > 100) return "warning";
  return "normal";
}

export function flagTemp(temp: string): VitalFlag {
  const n = Number.parseFloat(temp.replace(/[^\d.]/g, ""));
  if (Number.isNaN(n)) return "normal";
  if (n >= 39 || n < 35) return "critical";
  if (n >= 38 || n < 36) return "warning";
  return "normal";
}

export function flagSpo2(spo2: number): VitalFlag {
  if (spo2 < 90) return "critical";
  if (spo2 < 95) return "warning";
  return "normal";
}

export const VITAL_FLAG_STYLE: Record<VitalFlag, string> = {
  normal: "border-[#E8E4DF] bg-white",
  warning: "border-[#F5E6B8] bg-[#FFFBF0]",
  critical: "border-[#F5C4BC] bg-[#FCE8E6]",
};

export const VITAL_FLAG_BADGE: Record<VitalFlag, string> = {
  normal: "bg-[#E8EFE6] text-[#1B3B2E]",
  warning: "bg-[#F5E6B8] text-[#5C4A1E]",
  critical: "bg-[#FCE8E6] text-[#C45C4A]",
};
