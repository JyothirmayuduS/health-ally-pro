import type { UserRole } from "@/lib/supabase/types";
import type { PhiReadAuth } from "@/server/phi-reads";

export type OpdAction =
  | "read"
  | "book"
  | "check_in"
  | "reschedule"
  | "cancel"
  | "manage_queue"
  | "manage_availability";

export type OpdActor = {
  roles: UserRole[];
  staffProfileIds: string[];
};

export async function loadOpdActor(auth: PhiReadAuth): Promise<OpdActor> {
  if (!auth.isStaff) return { roles: [], staffProfileIds: [] };
  if (auth.userId === "demo-staff") {
    return {
      roles: ["hospital_admin", "receptionist", "doctor"],
      staffProfileIds: [],
    };
  }
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdmin();
  if (!admin) return { roles: [], staffProfileIds: [] };
  const { data: memberships } = await admin
    .from("hospital_memberships")
    .select("id, role")
    .eq("profile_id", auth.userId)
    .eq("hospital_id", auth.hospitalId)
    .eq("is_active", true);
  const membershipIds = (memberships ?? []).map((m) => String(m.id));
  let staffQuery = admin
    .from("staff_profiles")
    .select("id")
    .eq("hospital_id", auth.hospitalId);
  staffQuery = membershipIds.length
    ? staffQuery.or(`auth_user_id.eq.${auth.userId},membership_id.in.(${membershipIds.join(",")})`)
    : staffQuery.eq("auth_user_id", auth.userId);
  const { data: staff } = await staffQuery;
  return {
    roles: (memberships ?? []).map((m) => m.role as UserRole),
    staffProfileIds: (staff ?? []).map((s) => String(s.id)),
  };
}

export function canPerformOpd(
  action: OpdAction,
  auth: PhiReadAuth,
  actor: OpdActor,
  doctorId?: string | null,
): boolean {
  if (!auth.isStaff) {
    return (action === "read" || action === "book") && auth.isPatient;
  }
  const has = (...roles: UserRole[]) => actor.roles.some((role) => roles.includes(role));
  const isOwnDoctor = Boolean(doctorId && actor.staffProfileIds.includes(doctorId));
  switch (action) {
    case "read":
      return actor.roles.length > 0;
    case "book":
    case "check_in":
    case "reschedule":
    case "cancel":
      return has("super_admin", "hospital_admin", "receptionist");
    case "manage_queue":
      return has("super_admin", "hospital_admin", "receptionist") || (has("doctor") && isOwnDoctor);
    case "manage_availability":
      return (
        has("super_admin", "hospital_admin", "receptionist") ||
        (has("doctor") && isOwnDoctor)
      );
    default:
      return false;
  }
}
