import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyMedoraApiKey, verifyPatientWebAiRequest } from "@/server/ai/api-auth";

/** Must match Oak Haven demo seed / hospital-persistence DEFAULT_HOSPITAL_ID */
const DEFAULT_HOSPITAL_ID = "a0000001-0001-4001-8001-000000000001";

export type PersistAuthOk = {
  ok: true;
  hospitalId: string;
  userId: string | null;
  actorEmail: string | null;
  /** May create hospital tenants (onboard provision) */
  canProvision: boolean;
  /** Staff clinical/ops writes (doctors, charts, units, anatomy) */
  canWriteClinical: boolean;
  mode: "api_key" | "jwt" | "demo";
};

export type PersistAuthFail = {
  ok: false;
  status: number;
  error: string;
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

function isProductionRuntime(): boolean {
  const appEnv = (process.env.VITE_APP_ENV ?? process.env.APP_ENV ?? "").toLowerCase();
  if (appEnv === "production") return true;
  return process.env.NODE_ENV === "production";
}

function demoPersistAllowed(): boolean {
  const flag = process.env.ALLOW_DEMO_PERSIST ?? process.env.VITE_ALLOW_DEMO_AUTH;
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return !isProductionRuntime();
}

/** Simple per-isolate rate limit for public onboarding (Workers: best-effort). */
const onboardHits = new Map<string, { count: number; resetAt: number }>();

/** Test-only helper */
export function __resetOnboardRateLimitForTests() {
  onboardHits.clear();
}

export function rateLimitOnboard(request: Request, limit = 5, windowMs = 60 * 60 * 1000): boolean {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const row = onboardHits.get(ip);
  if (!row || now > row.resetAt) {
    onboardHits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || null;
}

/**
 * Authorize hospital persistence API.
 * - API key: full access (ops / trusted server)
 * - Supabase JWT + active staff membership: scoped to that hospital
 * - Demo (non-prod or ALLOW_DEMO_PERSIST): same-origin only, DEFAULT hospital, no tenant provision
 */
export async function authorizeHospitalPersist(
  request: Request,
  requestedHospitalId?: string | null,
): Promise<PersistAuthOk | PersistAuthFail> {
  if (verifyMedoraApiKey(request) && process.env.MEDORA_AI_API_KEY) {
    return {
      ok: true,
      hospitalId: requestedHospitalId || DEFAULT_HOSPITAL_ID,
      userId: null,
      actorEmail: "api-key",
      canProvision: true,
      canWriteClinical: true,
      mode: "api_key",
    };
  }

  const token = bearerToken(request);
  if (token) {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return { ok: false, status: 503, error: "Auth backend unavailable" };
    }
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return { ok: false, status: 401, error: "Invalid session" };
    }

    const { data: memberships } = await admin
      .from("hospital_memberships")
      .select("role, hospital_id")
      .eq("profile_id", data.user.id)
      .eq("is_active", true);

    const staffMemberships = (memberships ?? []).filter((m) =>
      STAFF_ROLES.has(String(m.role)),
    );
    if (staffMemberships.length === 0) {
      return { ok: false, status: 403, error: "Staff membership required" };
    }

    const hospitalIds = new Set(
      staffMemberships.map((m) => String(m.hospital_id)).filter(Boolean),
    );
    const hospitalId = requestedHospitalId && hospitalIds.has(requestedHospitalId)
      ? requestedHospitalId
      : String(staffMemberships[0].hospital_id);

    if (requestedHospitalId && !hospitalIds.has(requestedHospitalId)) {
      return { ok: false, status: 403, error: "Hospital out of scope" };
    }

    const canProvision = staffMemberships.some((m) =>
      ["super_admin", "hospital_admin"].includes(String(m.role)),
    );

    return {
      ok: true,
      hospitalId,
      userId: data.user.id,
      actorEmail: data.user.email ?? null,
      canProvision,
      canWriteClinical: true,
      mode: "jwt",
    };
  }

  // Dev / evaluation demo path — never trusts client hospitalId
  if (
    demoPersistAllowed() &&
    verifyPatientWebAiRequest(request) &&
    request.headers.get("x-medora-persist-demo") === "1"
  ) {
    return {
      ok: true,
      hospitalId: DEFAULT_HOSPITAL_ID,
      userId: null,
      actorEmail: "demo",
      canProvision: false,
      canWriteClinical: true,
      mode: "demo",
    };
  }

  if (!verifyPatientWebAiRequest(request)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return {
    ok: false,
    status: 401,
    error: isProductionRuntime()
      ? "Sign in required for hospital data sync"
      : "Send Authorization Bearer token or x-medora-persist-demo: 1",
  };
}

/** Public onboarding: same-origin only + rate limit. Provision needs stronger auth. */
export function authorizePublicOnboard(request: Request): PersistAuthFail | { ok: true } {
  if (!verifyPatientWebAiRequest(request) && !verifyMedoraApiKey(request)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (!rateLimitOnboard(request)) {
    return { ok: false, status: 429, error: "Too many onboarding attempts — try later" };
  }
  return { ok: true };
}
