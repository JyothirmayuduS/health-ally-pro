import type { PhiReadAuth } from "@/server/phi-reads";
import type { UserRole } from "@/lib/supabase/types";

const CLINICAL_READ = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
]);
const CLINICAL_WRITE = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
]);
const NOTE_SIGN = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
]);
const ATTACHMENT_WRITE = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
]);
const AUDIT_READ = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
]);

export type EmrAction =
  | "read_chart"
  | "open_encounter"
  | "save_soap"
  | "sign_note"
  | "record_vitals"
  | "manage_diagnoses"
  | "manage_procedures"
  | "manage_allergies"
  | "manage_immunizations"
  | "manage_history"
  | "manage_attachments"
  | "read_audit";

export async function loadEmrRoles(auth: PhiReadAuth): Promise<UserRole[]> {
  if (!auth.isStaff) return [];
  if (auth.userId === "demo-staff") {
    return ["hospital_admin", "receptionist", "doctor", "nurse"];
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

export function canPerformEmr(
  action: EmrAction,
  auth: PhiReadAuth,
  roles: UserRole[],
  opts?: { isOwnPatient?: boolean; hasGrant?: boolean },
): boolean {
  const has = (set: Set<UserRole>) => roles.some((r) => set.has(r));

  if (auth.isStaff) {
    switch (action) {
      case "read_chart":
        return has(CLINICAL_READ);
      case "open_encounter":
      case "save_soap":
      case "record_vitals":
      case "manage_diagnoses":
      case "manage_procedures":
      case "manage_allergies":
      case "manage_immunizations":
      case "manage_history":
        return has(CLINICAL_WRITE);
      case "sign_note":
        return has(NOTE_SIGN);
      case "manage_attachments":
        return has(ATTACHMENT_WRITE);
      case "read_audit":
        return has(AUDIT_READ);
      default:
        return false;
    }
  }

  const own = Boolean(opts?.isOwnPatient);
  const grant = Boolean(opts?.hasGrant);
  switch (action) {
    case "read_chart":
    case "manage_attachments":
      return own || grant;
    default:
      return false;
  }
}
