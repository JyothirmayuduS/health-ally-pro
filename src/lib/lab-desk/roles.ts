import { redirect } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Inbox,
  Droplets,
  TestTube2,
  CheckCircle,
  BookOpen,
  BarChart3,
  Settings2,
  Users2,
  Send,
  Lock,
  Scan,
} from "lucide-react";
import { getAuthSession } from "@/lib/supabase/auth";
import { requirePortalAccess } from "@/lib/supabase/rbac";
import type { UserRole } from "@/lib/supabase/types";

export type LabCountKey =
  | "orders"
  | "validation"
  | "bench"
  | "submissions"
  | "collection"
  | "processing";

export type LabNavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  countKey?: LabCountKey;
  /** Red badge for urgent queues (validation, bench alerts) */
  urgentBadge?: boolean;
};

export type LabNavLocked = {
  label: string;
  icon: LucideIcon;
};

export type LabNavSection = {
  title: string;
  items: LabNavLink[];
};

export type LabNavConfig = {
  sections: LabNavSection[];
  locked: LabNavLocked[];
};

/** Supervisor — control desk, oversight, management */
export const SUPERVISOR_NAV: LabNavConfig = {
  sections: [
    {
      title: "Overview",
      items: [
        { to: "/lab", label: "Control desk", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: "Oversight",
      items: [
        { to: "/lab/orders", label: "Orders inbox", icon: Inbox, countKey: "orders" },
        {
          to: "/lab/validation",
          label: "Validation",
          icon: CheckCircle,
          countKey: "validation",
          urgentBadge: true,
        },
        { to: "/lab/samples", label: "All samples", icon: Droplets },
        { to: "/lab/radiology", label: "Radiology", icon: Scan },
      ],
    },
    {
      title: "Management",
      items: [
        { to: "/lab/reports", label: "Analytics", icon: BarChart3 },
        { to: "/lab/team", label: "Team & roles", icon: Users2 },
        { to: "/lab/settings", label: "Lab settings", icon: Settings2 },
      ],
    },
  ],
  locked: [
    { label: "Collection", icon: Lock },
    { label: "Processing", icon: Lock },
  ],
};

/** Technician — bench work, personal records, reference */
export const TECHNICIAN_NAV: LabNavConfig = {
  sections: [
    {
      title: "Overview",
      items: [
        { to: "/lab", label: "My bench", icon: LayoutDashboard, exact: true, countKey: "bench", urgentBadge: true },
      ],
    },
    {
      title: "Bench work",
      items: [
        { to: "/lab/collection", label: "Collection", icon: Droplets, countKey: "collection" },
        { to: "/lab/processing", label: "Processing", icon: TestTube2, countKey: "processing" },
      ],
    },
    {
      title: "My records",
      items: [
        { to: "/lab/my-submissions", label: "My submissions", icon: Send, countKey: "submissions" },
        { to: "/lab/samples", label: "My samples", icon: Droplets },
      ],
    },
    {
      title: "Reference",
      items: [{ to: "/lab/catalog", label: "Test catalog", icon: BookOpen }],
    },
  ],
  locked: [
    { label: "Validation", icon: Lock },
    { label: "Analytics", icon: Lock },
  ],
};

const SUPERVISOR_ONLY_PREFIXES = [
  "/lab/orders",
  "/lab/validation",
  "/lab/reports",
  "/lab/radiology",
  "/lab/team",
  "/lab/settings",
  "/lab/walk-in",
];

const TECHNICIAN_ONLY_PREFIXES = ["/lab/collection", "/lab/processing", "/lab/my-submissions"];

export function isLabSupervisor(roles: UserRole[]) {
  return roles.includes("lab_supervisor");
}

export function isLabTechnician(roles: UserRole[]) {
  return roles.includes("lab_technician");
}

export function labNavForRole(roles: UserRole[]): LabNavConfig {
  if (isLabSupervisor(roles)) return SUPERVISOR_NAV;
  return TECHNICIAN_NAV;
}

export function labRoleLabel(roles: UserRole[]) {
  if (isLabSupervisor(roles)) return "Lab supervisor";
  if (isLabTechnician(roles)) return "Lab technician";
  return "Lab staff";
}

export async function requireLabSupervisor() {
  const session = await requirePortalAccess("lab");
  if (!isLabSupervisor(session.roles)) {
    throw redirect({ to: "/lab", search: { denied: "supervisor" } });
  }
  return session;
}

export async function requireLabTechnician() {
  const session = await requirePortalAccess("lab");
  if (isLabSupervisor(session.roles)) {
    throw redirect({ to: "/lab", search: { denied: "technician" } });
  }
  if (!isLabTechnician(session.roles)) {
    throw redirect({ to: "/login", search: { error: "unauthorized" } });
  }
  return session;
}

export function canAccessLabPath(roles: UserRole[], pathname: string) {
  if (isLabSupervisor(roles)) {
    return !TECHNICIAN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  }
  if (isLabTechnician(roles)) {
    return !SUPERVISOR_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  }
  return true;
}

export { getAuthSession };
