/**
 * Profile /api/hospital/phi latency breakdown.
 * Usage: node --env-file=.env.local scripts/phi-worker-latency-profile.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.MEDORA_BASE_URL || "http://127.0.0.1:8787";
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const H = "a0000001-0001-4001-8001-000000000001";

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const authClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });

const tAuth0 = performance.now();
const signIn = await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS });
const authMs = performance.now() - tAuth0;
const token = signIn.data.session.access_token;

// Direct service-role query (same data path Worker uses after auth)
const tDb0 = performance.now();
const { data: direct, error: directErr } = await admin
  .from("patients")
  .select("id, hospital_id, blood_group, member_since, date_of_birth, mrn, profile_id")
  .eq("hospital_id", H)
  .limit(200);
const directDbMs = performance.now() - tDb0;

// Auth.getUser cost (what authorizePhiRead does)
const tGetUser0 = performance.now();
await admin.auth.getUser(token);
const getUserMs = performance.now() - tGetUser0;

const tMem0 = performance.now();
await admin
  .from("hospital_memberships")
  .select("role, hospital_id")
  .eq("profile_id", user.id)
  .eq("is_active", true);
const membershipMs = performance.now() - tMem0;

const tPat0 = performance.now();
await admin.from("patients").select("id, hospital_id").eq("profile_id", user.id).maybeSingle();
const patientLookupMs = performance.now() - tPat0;

async function hitWorker() {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/hospital/phi?resource=patients&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json();
  return {
    status: res.status,
    ms: performance.now() - t0,
    ok: body.ok,
    count: Array.isArray(body.data) ? body.data.length : body.data ? 1 : 0,
  };
}

await hitWorker(); // warm
const runs = [];
for (let i = 0; i < 5; i++) runs.push(await hitWorker());
const workerMs = runs.map((r) => r.ms).sort((a, b) => a - b);

const authChainMs = getUserMs + membershipMs + patientLookupMs;
const explained = authChainMs + directDbMs;
const workerMedian = workerMs[2];
const unexplained = workerMedian - explained;

const report = {
  base: BASE,
  breakdown_ms: {
    signIn_once: Math.round(authMs * 100) / 100,
    authorize_getUser: Math.round(getUserMs * 100) / 100,
    authorize_memberships: Math.round(membershipMs * 100) / 100,
    authorize_patient_lookup: Math.round(patientLookupMs * 100) / 100,
    authorize_chain_sum: Math.round(authChainMs * 100) / 100,
    service_role_patients_query: Math.round(directDbMs * 100) / 100,
    direct_row_count: direct?.length ?? 0,
    direct_error: directErr?.message ?? null,
    worker_http_runs: runs.map((r) => ({
      status: r.status,
      ms: Math.round(r.ms * 100) / 100,
      count: r.count,
    })),
    worker_median: Math.round(workerMedian * 100) / 100,
    worker_min: Math.round(workerMs[0] * 100) / 100,
    worker_max: Math.round(workerMs[4] * 100) / 100,
    sum_auth_plus_db: Math.round(explained * 100) / 100,
    residual_http_framework_ms: Math.round(unexplained * 100) / 100,
  },
  interpretation: {
    avoidable:
      unexplained > 150
        ? "Residual is largely Vite/SSR framework + network hop on localhost; membership+getUser are required per request without caching."
        : "Most overhead explained by auth chain + DB.",
    tradeoff:
      "Worker path pays JWT validation + membership/patient lookups each request. Caching memberships in-memory (short TTL) could cut authorize_chain; cold isolate adds more on Cloudflare.",
  },
};

writeFileSync("docs/evidence/phi-worker-latency-profile.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
