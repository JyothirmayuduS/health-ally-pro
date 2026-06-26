/* Medora — Apothecary Clay color palette
 * oklch values from the web converted to hex for React Native
 */

export const lightColors = {
  background: "#F4F1ED",
  foreground: "#1E3A32",
  surface: "#FCFAF8",
  surface2: "#EDE8E1",
  ink: "#1E3A32",
  inkMuted: "#64746B",
  clay: "#B6785C",
  claySoft: "#EBDCD5",
  card: "#FCFAF8",
  cardForeground: "#1E3A32",
  primary: "#1E3A32",
  primaryForeground: "#FCFAF8",
  secondary: "#EDE8E1",
  secondaryForeground: "#1E3A32",
  muted: "#EDE8E1",
  mutedForeground: "#64746B",
  accent: "#B6785C",
  accentForeground: "#FCFAF8",
  destructive: "#C4391A",
  destructiveForeground: "#FCFAF8",
  border: "#E6E1DA",
  input: "#E6E1DA",
  ring: "#B6785C",
} as const;

export const darkColors = {
  background: "#1A2E28",
  foreground: "#F4F1ED",
  surface: "#223830",
  surface2: "#2A4038",
  ink: "#F4F1ED",
  inkMuted: "#8FA89E",
  clay: "#C98B6F",
  claySoft: "#3A2E28",
  card: "#223830",
  cardForeground: "#F4F1ED",
  primary: "#F4F1ED",
  primaryForeground: "#223830",
  secondary: "#2A4038",
  secondaryForeground: "#F4F1ED",
  muted: "#2A4038",
  mutedForeground: "#8FA89E",
  accent: "#C98B6F",
  accentForeground: "#1A2E28",
  destructive: "#E05535",
  destructiveForeground: "#F4F1ED",
  border: "rgba(255,255,255,0.1)",
  input: "rgba(255,255,255,0.12)",
  ring: "#C98B6F",
} as const;

export type ThemeColors = typeof lightColors;
