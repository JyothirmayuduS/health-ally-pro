/** Medora staff portal — design tokens (reference UI) */
export const t = {
  bg: "#F5F7F8",
  surface: "#FFFFFF",
  lime: "#D4F064",
  limeSoft: "#E8F5C8",
  limePanel: "#EEF6D4",
  limeGradient: "linear-gradient(180deg, #D8EBA4 0%, #EEF6D4 100%)",
  navy: "#1C2A2E",
  text: "#1C2A2E",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  pill: "#E0E7EB",
  border: "#E2E8F0",
  shadowSm: "0 2px 8px rgba(28, 42, 46, 0.04)",
  shadowMd: "0 8px 24px rgba(28, 42, 46, 0.06)",
  shadowLg: "0 12px 40px rgba(28, 42, 46, 0.08)",
  radiusXl: "32px",
  radiusLg: "24px",
  radiusMd: "20px",
  radiusSm: "16px",
  radiusPill: "9999px",
} as const;

export const type = {
  display: "text-[2rem] font-bold tracking-tight text-[#1C2A2E] md:text-[2.5rem] md:leading-[1.15]",
  h2: "text-lg font-bold tracking-tight text-[#1C2A2E]",
  h3: "text-xl font-bold tracking-tight text-[#1C2A2E]",
  body: "text-sm text-[#64748B]",
  caption: "text-xs text-[#94A3B8]",
  metric: "text-2xl font-bold tracking-tight text-[#1C2A2E]",
} as const;
