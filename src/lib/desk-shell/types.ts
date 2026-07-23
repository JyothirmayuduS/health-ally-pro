import type { LucideIcon } from "lucide-react";

export type DeskNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  dot?: string;
  badge?: number;
  /** When set, link hidden unless license includes this module */
  moduleId?: string;
};

export type DeskNavSection = {
  title: string;
  items: DeskNavLink[];
};

export type DeskPortalTheme = {
  /** Active nav */
  activeBg: string;
  activeText: string;
  activeBar: string;
  /** Brand block in sidebar */
  brandIconBg: string;
  brandIconFg: string;
  avatarBg: string;
  avatarText: string;
  /** Search focus */
  searchRing: string;
};

export type DeskStaffProfile = {
  name: string;
  role: string;
  initials: string;
};

export type DeskPortalConfig = {
  id: string;
  portalLabel: string;
  version: string;
  hospitalName: string;
  /** Optional white-label logo URL / data URL */
  logoUrl?: string;
  wrapperClass: string;
  theme: DeskPortalTheme;
  sections: DeskNavSection[];
  searchPlaceholder: string;
  titleFromPath: (pathname: string) => { eyebrow: string; title: string };
  staff: DeskStaffProfile;
};
