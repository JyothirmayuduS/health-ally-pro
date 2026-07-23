import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPatientWebAiRequest } from "@/server/ai/api-auth";
import { DEFAULT_HOSPITAL_ID } from "@/server/hospital-persistence";

export type PhiReadAuth = {
  userId: string;
  email: string | null;
  hospitalIds: string[];
  /** Primary hospital for staff; patient hospital when patient-only */
  hospitalId: string;
  isStaff: boolean;
  isPatient: boolean;
  patientId: string | null;
};

const STAFF_ROLES = new Set([
  "super_admin",
  "hospital_admin",
  "doctor",
  "receptionist",
  "lab_supervisor",
  "lab_technician",
  "pharmacist",
  "billing_staff",
  "nurse",
]);

function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || null;
}

function demoPhiAllowed(): boolean {
  const flag = process.env.ALLOW_DEMO_PERSIST ?? process.env.VITE_ALLOW_DEMO_AUTH;
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  const appEnv = (process.env.VITE_APP_ENV ?? process.env.APP_ENV ?? "").toLowerCase();
  if (appEnv === "production") return false;
  return process.env.NODE_ENV !== "production";
}

/** Short-lived auth memo for JWT + membership chain (Workers isolate memory). */
const PHI_AUTH_TTL_MS = 20_000;
const PHI_AUTH_CACHE_MAX = 200;
type PhiAuthCacheEntry = {
  exp: number;
  result: { ok: true; auth: PhiReadAuth } | { ok: false; status: number; error: string };
};
const phiAuthCache = new Map<string, PhiAuthCacheEntry>();

function tokenFingerprint(token: string): string {
  // FNV-1a 32-bit — enough to key cache without retaining the bearer string
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function phiAuthCacheKey(token: string, requestedHospitalId?: string | null): string {
  return `${tokenFingerprint(token)}|${requestedHospitalId ?? ""}`;
}

function getCachedPhiAuth(key: string): PhiAuthCacheEntry["result"] | null {
  const hit = phiAuthCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    phiAuthCache.delete(key);
    return null;
  }
  return hit.result;
}

function setCachedPhiAuth(key: string, result: PhiAuthCacheEntry["result"]) {
  if (phiAuthCache.size >= PHI_AUTH_CACHE_MAX) {
    const oldest = phiAuthCache.keys().next().value;
    if (oldest) phiAuthCache.delete(oldest);
  }
  phiAuthCache.set(key, { exp: Date.now() + PHI_AUTH_TTL_MS, result });
}

/** Test-only */
export function __resetPhiAuthCacheForTests() {
  phiAuthCache.clear();
}

/**
 * Authorize PHI reads for staff OR patient portal users.
 * Hospital scope is taken from memberships / patient row — never from client body alone.
 */
export async function authorizePhiRead(
  request: Request,
  requestedHospitalId?: string | null,
): Promise<{ ok: true; auth: PhiReadAuth } | { ok: false; status: number; error: string }> {
  const token = bearerToken(request);
  if (!token) {
    if (
      demoPhiAllowed() &&
      verifyPatientWebAiRequest(request) &&
      request.headers.get("x-medora-persist-demo") === "1"
    ) {
      const demoAuth: PhiReadAuth = {
        userId: "demo-staff",
        email: "demo@oakhaven.demo",
        hospitalIds: [DEFAULT_HOSPITAL_ID],
        hospitalId: DEFAULT_HOSPITAL_ID,
        isStaff: true,
        isPatient: false,
        patientId: null,
      };
      return { ok: true, auth: demoAuth };
    }
    return { ok: false, status: 401, error: "Bearer token required" };
  }

  const cacheKey = phiAuthCacheKey(token, requestedHospitalId);
  const cached = getCachedPhiAuth(cacheKey);
  if (cached) return cached;

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, status: 503, error: "Auth backend unavailable" };

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { ok: false, status: 401, error: "Invalid session" };

  // Parallelize post-JWT lookups (was sequential ~2 round-trips)
  const [membershipsRes, patientRes] = await Promise.all([
    admin
      .from("hospital_memberships")
      .select("role, hospital_id")
      .eq("profile_id", data.user.id)
      .eq("is_active", true),
    admin.from("patients").select("id, hospital_id").eq("profile_id", data.user.id).maybeSingle(),
  ]);

  const memberships = membershipsRes.data;
  const patient = patientRes.data;

  const staffMemberships = (memberships ?? []).filter((m) => STAFF_ROLES.has(String(m.role)));
  const hospitalIds = [
    ...new Set((memberships ?? []).map((m) => String(m.hospital_id)).filter(Boolean)),
  ];

  const isStaff = staffMemberships.length > 0;
  const isPatient = !!patient;
  if (!isStaff && !isPatient) {
    const denied = {
      ok: false as const,
      status: 403,
      error: "No hospital membership or patient profile",
    };
    setCachedPhiAuth(cacheKey, denied);
    return denied;
  }

  if (isStaff) {
    const staffHospitals = new Set(
      staffMemberships.map((m) => String(m.hospital_id)).filter(Boolean),
    );
    if (requestedHospitalId && !staffHospitals.has(requestedHospitalId)) {
      // Do not cache scope denials tied to a bad client hospitalId for long — still short TTL ok
      const denied = { ok: false as const, status: 403, error: "Hospital out of scope" };
      setCachedPhiAuth(cacheKey, denied);
      return denied;
    }
    const hospitalId =
      requestedHospitalId && staffHospitals.has(requestedHospitalId)
        ? requestedHospitalId
        : String(staffMemberships[0].hospital_id);
    const ok = {
      ok: true as const,
      auth: {
        userId: data.user.id,
        email: data.user.email ?? null,
        hospitalIds: [...staffHospitals],
        hospitalId,
        isStaff: true,
        isPatient,
        patientId: patient?.id ?? null,
      },
    };
    setCachedPhiAuth(cacheKey, ok);
    return ok;
  }

  // Patient-only
  const patientHospital = String(patient!.hospital_id);
  if (requestedHospitalId && requestedHospitalId !== patientHospital) {
    const denied = { ok: false as const, status: 403, error: "Hospital out of scope" };
    setCachedPhiAuth(cacheKey, denied);
    return denied;
  }
  const ok = {
    ok: true as const,
    auth: {
      userId: data.user.id,
      email: data.user.email ?? null,
      hospitalIds: hospitalIds.length ? hospitalIds : [patientHospital],
      hospitalId: patientHospital || DEFAULT_HOSPITAL_ID,
      isStaff: false,
      isPatient: true,
      patientId: patient!.id,
    },
  };
  setCachedPhiAuth(cacheKey, ok);
  return ok;
}

function assertHospital(auth: PhiReadAuth, rowHospitalId: string | null | undefined): boolean {
  if (!rowHospitalId) return false;
  return auth.hospitalIds.includes(rowHospitalId) || auth.hospitalId === rowHospitalId;
}

export async function listStaffProfiles(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  const { data, error } = await admin
    .from("staff_profiles")
    .select(
      "id, legacy_id, specialty, initials, bio, rating, review_count, experience_years, consultation_fee, next_available_slot, hospital_id, is_active",
    )
    .eq("hospital_id", auth.hospitalId)
    .eq("is_active", true)
    .not("specialty", "is", null)
    .order("rating", { ascending: false });
  if (error) return { error: error.message, data: [] as unknown[] };
  const scoped = (data ?? []).filter((r) => assertHospital(auth, r.hospital_id as string));
  return { error: null as string | null, data: scoped };
}

export async function getPatientForUser(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: null };
  if (auth.isPatient && auth.patientId) {
    const { data, error } = await admin
      .from("patients")
      .select("id, hospital_id, blood_group, member_since, date_of_birth, mrn, profile_id")
      .eq("id", auth.patientId)
      .maybeSingle();
    if (error) return { error: error.message, data: null };
    if (data && !assertHospital(auth, data.hospital_id as string)) {
      return { error: "hospital_scope", data: null };
    }
    return { error: null as string | null, data };
  }
  // Staff may list patients in hospital
  const { data, error } = await admin
    .from("patients")
    .select("id, hospital_id, blood_group, member_since, date_of_birth, mrn, profile_id")
    .eq("hospital_id", auth.hospitalId)
    .limit(200);
  if (error) return { error: error.message, data: null };
  return { error: null as string | null, data };
}

export async function listAppointmentsForAuth(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };

  if (auth.isPatient && auth.patientId) {
    const { data: patient } = await admin
      .from("patients")
      .select("id, hospital_id")
      .eq("id", auth.patientId)
      .maybeSingle();
    if (!patient || !assertHospital(auth, patient.hospital_id as string)) {
      return { error: "hospital_scope", data: [] as unknown[] };
    }
    const { data, error } = await admin
      .from("appointments")
      .select(
        "id, legacy_id, scheduled_at, time_label, reason, status, doctor_staff_id, hospital_id, patient_id, staff_profiles(legacy_id, initials, specialty), queue_entries(position, estimated_wait_minutes)",
      )
      .eq("patient_id", auth.patientId)
      .eq("hospital_id", auth.hospitalId)
      .order("scheduled_at", { ascending: true });
    if (error) return { error: error.message, data: [] as unknown[] };
    return { error: null as string | null, data: data ?? [] };
  }

  const { data, error } = await admin
    .from("appointments")
    .select(
      "id, legacy_id, scheduled_at, time_label, reason, status, doctor_staff_id, hospital_id, patient_id, staff_profiles(legacy_id, initials, specialty), queue_entries(position, estimated_wait_minutes)",
    )
    .eq("hospital_id", auth.hospitalId)
    .order("scheduled_at", { ascending: true })
    .limit(200);
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function listLabResultsForAuth(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };

  let q = admin
    .from("lab_results")
    .select(
      "id, legacy_id, title, report_type, result_date, file_size, doctor_name, shared_with_staff_ids, hospital_id, patient_id",
    )
    .eq("hospital_id", auth.hospitalId)
    .order("result_date", { ascending: false });

  if (auth.isPatient && auth.patientId && !auth.isStaff) {
    q = q.eq("patient_id", auth.patientId);
  }

  const { data, error } = await q.limit(200);
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function listPatientMedicationsForAuth(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  if (!auth.patientId && !auth.isStaff) {
    return { error: "patient_required", data: [] as unknown[] };
  }

  let q = admin
    .from("patient_medications")
    .select(
      "id, name, dosage, medication_time, frequency, reason, clinical_reason, instruction_tag, best_way_to_take, side_effects, interactions, alternatives, pills_remaining, total_pills, prescribed_by, status, legacy_id, hospital_id, patient_id",
    )
    .eq("hospital_id", auth.hospitalId);

  if (auth.patientId) {
    q = q.eq("patient_id", auth.patientId);
  } else if (!auth.isStaff) {
    return { error: "patient_required", data: [] as unknown[] };
  }

  const { data, error } = await q.order("status").order("name");
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function listMembershipsForAuth(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  const { data, error } = await admin
    .from("hospital_memberships")
    .select("role, hospital_id, is_active, profile_id")
    .eq("profile_id", auth.userId)
    .eq("is_active", true);
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function listQueueEntriesForAuth(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  let q = admin
    .from("queue_entries")
    .select("id, hospital_id, patient_id, position, estimated_wait_minutes, appointment_id")
    .eq("hospital_id", auth.hospitalId)
    .limit(200);
  if (auth.isPatient && auth.patientId && !auth.isStaff) {
    q = q.eq("patient_id", auth.patientId);
  }
  const { data, error } = await q;
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function getProfileBasics(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getLabItemsForReport(auth: PhiReadAuth, reportLegacyId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  if (!auth.patientId) return { error: "patient_required", data: [] as unknown[] };

  const { data: report } = await admin
    .from("lab_results")
    .select("id, hospital_id, patient_id")
    .eq("patient_id", auth.patientId)
    .eq("hospital_id", auth.hospitalId)
    .eq("legacy_id", reportLegacyId)
    .maybeSingle();
  if (!report || !assertHospital(auth, report.hospital_id as string)) {
    return { error: null as string | null, data: [] as unknown[] };
  }

  const { data, error } = await admin
    .from("lab_result_items")
    .select("name, value, status, sort_order")
    .eq("lab_result_id", report.id)
    .order("sort_order");
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function getLabFindings(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  if (!auth.patientId) return { error: "patient_required", data: [] as unknown[] };

  const { data: labReports, error: reportsError } = await admin
    .from("lab_results")
    .select("id, hospital_id")
    .eq("patient_id", auth.patientId)
    .eq("hospital_id", auth.hospitalId)
    .eq("report_type", "Lab");
  if (reportsError) return { error: reportsError.message, data: [] as unknown[] };
  const ids = (labReports ?? []).map((r) => r.id as string);
  if (!ids.length) return { error: null as string | null, data: [] as unknown[] };

  const { data, error } = await admin
    .from("lab_result_items")
    .select("name, value, status")
    .in("lab_result_id", ids);
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}
