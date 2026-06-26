import { apk } from "@/components/doctor/apk/theme";

/** Medora Doctor Portal — cream / terracotta / forest palette */
export const doctorTheme = {
  bg: "#F7F5F2",
  splash: apk.bg,
  surface: apk.surface,
  accent: apk.clay,
  accentSoft: apk.claySoft,
  accentPanel: apk.bg,
  primary: apk.forest,
  text: apk.text,
  textSecondary: apk.textMuted,
  textMuted: apk.textMuted,
  pill: apk.border,
  border: apk.border,
  shadow: "0 4px 20px rgba(27, 59, 46, 0.06)",
  shadowLg: "0 8px 32px rgba(27, 59, 46, 0.06)",
  radiusXl: "28px",
  radiusLg: "22px",
  radiusMd: "20px",
} as const;
