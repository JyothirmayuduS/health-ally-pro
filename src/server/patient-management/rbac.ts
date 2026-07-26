import type { PhiReadAuth } from "@/server/phi-reads";
import type { UserRole } from "@/lib/supabase/types";

const REGISTER_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "receptionist",
]);
const IDENTITY_EDIT_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "receptionist",
]);
const CLINICAL_EDIT_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
]);
const HISTORY_EDIT_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
]);
const QR_MANAGE_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "receptionist",
]);
const DOCUMENT_ROLES = new Set<UserRole>([
  "super_admin",
  "hospital_admin",
  "receptionist",
  "doctor",
  "nurse",
]);

export type PatientAction =
  | "register"
  | "search"
  | "read_profile"
  | "update_identity"
  | "manage_contacts"
  | "manage_allergies"
  | "manage_history"
  | "manage_consents"
  | "manage_documents"
  | "manage_qr"
  | "resolve_qr";

export async function loadStaffRoles(
  auth: PhiReadAuth,
): Promise<UserRole[]> {
  if (!auth.isStaff) return [];
  // Local desk / eval demo identity — full reception+clinical staff roles for Worker APIs.
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

export function canPerform(
  action: PatientAction,
  auth: PhiReadAuth,
  roles: UserRole[],
  opts?: { isOwnPatient?: boolean; hasGrant?: boolean },
): boolean {
  if (auth.isStaff) {
    const has = (set: Set<UserRole>) => roles.some((r) => set.has(r));
    switch (action) {
      case "register":
        return has(REGISTER_ROLES);
      case "search":
      case "read_profile":
      case "resolve_qr":
        return roles.length > 0;
      case "update_identity":
      case "manage_contacts":
        return has(IDENTITY_EDIT_ROLES);
      case "manage_allergies":
        return has(CLINICAL_EDIT_ROLES);
      case "manage_history":
        return has(HISTORY_EDIT_ROLES);
      case "manage_consents":
        return has(CLINICAL_EDIT_ROLES);
      case "manage_documents":
        return has(DOCUMENT_ROLES);
      case "manage_qr":
        return has(QR_MANAGE_ROLES);
      default:
        return false;
    }
  }

  // Patient / caregiver
  const own = Boolean(opts?.isOwnPatient);
  const grant = Boolean(opts?.hasGrant);
  switch (action) {
    case "read_profile":
    case "manage_contacts":
    case "manage_consents":
    case "manage_documents":
      return own || grant;
    case "update_identity":
      return own;
    case "manage_qr":
      // Own printable ID card only — resolution remains staff-scoped
      return own;
    case "search":
    case "register":
    case "manage_allergies":
    case "manage_history":
    case "resolve_qr":
      return false;
    default:
      return false;
  }
}
