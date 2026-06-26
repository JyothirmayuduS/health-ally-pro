import { redirect } from "@tanstack/react-router";
import type { UserRole } from "./types";
import { getAuthSession } from "./auth";

export type PortalKey =
  | "admin"
  | "reception"
  | "doctor"
  | "lab"
  | "pharmacy"
  | "billing"
  | "nursing";

export const ROLE_HOME_PATH: Record<PortalKey, UserRole[]> = {
  admin: ["super_admin", "hospital_admin"],
  reception: ["receptionist"],
  doctor: ["doctor"],
  lab: ["lab_technician", "lab_supervisor"],
  pharmacy: ["pharmacist"],
  billing: ["billing_staff"],
  nursing: ["nurse"],
};

export const PORTAL_LABELS: Record<PortalKey, string> = {
  admin: "Admin",
  reception: "Reception",
  doctor: "Doctor",
  lab: "Laboratory",
  pharmacy: "Pharmacy",
  billing: "Billing",
  nursing: "Nursing",
};

export function canAccessPortal(portal: PortalKey, roles: UserRole[]) {
  const allowed = ROLE_HOME_PATH[portal];
  return roles.some((r) => allowed.includes(r));
}

export async function requirePortalAccess(portal: PortalKey) {
  const session = await getAuthSession();
  if (!session) {
    throw redirect({ to: "/login", search: { redirect: `/${portal}` } });
  }
  if (!canAccessPortal(portal, session.roles)) {
    throw redirect({ to: "/login", search: { error: "unauthorized" } });
  }
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    throw redirect({ to: "/login" });
  }
  return session;
}

export function redirectPathForRoles(roles: UserRole[]): string {
  if (roles.includes("patient") || roles.includes("caregiver")) {
    return "/";
  }
  for (const [portal, allowed] of Object.entries(ROLE_HOME_PATH) as [PortalKey, UserRole[]][]) {
    if (roles.some((r) => allowed.includes(r))) {
      return `/${portal}`;
    }
  }
  return "/";
}
