import type { PhiReadAuth } from "@/server/phi-reads";
import type { UserRole } from "@/lib/supabase/types";

const DOCTOR_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
]);
const CLINICAL_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
]);

export type DoctorWorkspaceAction =
  | "read_board"
  | "start_consultation"
  | "complete_consultation"
  | "order_rx"
  | "order_lab"
  | "order_radiology"
  | "create_referral"
  | "manage_tasks"
  | "schedule_follow_up";

export async function loadDoctorWorkspaceRoles(
  auth: PhiReadAuth,
): Promise<UserRole[]> {
  if (!auth.isStaff) return [];
  if (auth.userId === "demo-staff") {
    return ["hospital_admin", "doctor", "nurse"];
  }
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("hospital_memberships")
    .select("role")
    .eq("profile_id", auth.userId)
    .eq("hospital_id", auth.hospitalId)
    .eq("is_active", true);
  return (data ?? []).map((r) => r.role as UserRole);
}

export function canPerformDoctorWorkspace(
  action: DoctorWorkspaceAction,
  auth: PhiReadAuth,
  roles: UserRole[],
): boolean {
  if (!auth.isStaff) return false;
  const has = (set: Set<UserRole>) => roles.some((r) => set.has(r));
  switch (action) {
    case "read_board":
    case "manage_tasks":
    case "order_lab":
    case "order_radiology":
      return has(CLINICAL_ROLES);
    case "start_consultation":
    case "complete_consultation":
    case "order_rx":
    case "create_referral":
    case "schedule_follow_up":
      return has(DOCTOR_ROLES);
    default:
      return false;
  }
}
