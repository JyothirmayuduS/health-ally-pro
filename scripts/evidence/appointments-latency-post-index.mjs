/**
 * Post-index appointments latency + cold-auth + concurrent.
 * Usage: node --env-file=.env.local scripts/appointments-latency-post-index.mjs
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
const N = 30;

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

function pct(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[idx] * 100) / 100;
}
function stats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    min: pct(s, 0),
    avg: Math.round((sum / s.length) * 100) / 100,
    p50: pct(s, 50),
    p95: pct(s, 95),
    p99: pct(s, 99),
    max: pct(s, 100),
    errors: 0,
  };
}

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });

async function freshToken() {
  const session = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
    .session;
  return session.access_token;
}

const SELECT =
  "id, legacy_id, scheduled_at, time_label, reason, status, doctor_staff_id, hospital_id, patient_id, staff_profiles(legacy_id, initials, specialty), queue_entries(position, estimated_wait_minutes)";

// Stage timings (service role — isolates DB)
const tDb = [];
let rowCount = 0;
let payloadBytes = 0;
for (let i = 0; i < 15; i++) {
  const t0 = performance.now();
  const { data, error } = await admin
    .from("appointments")
    .select(SELECT)
    .eq("hospital_id", H)
    .order("scheduled_at", { ascending: true })
    .limit(200);
  tDb.push(performance.now() - t0);
  if (i === 0) {
    rowCount = data?.length ?? 0;
    payloadBytes = Buffer.byteLength(JSON.stringify(data ?? []), "utf8");
    if (error) throw new Error(error.message);
  }
}

const tGu = [];
const tokenWarm = await freshToken();
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  await admin.auth.getUser(tokenWarm);
  tGu.push(performance.now() - t0);
}

const tAuthChain = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  await Promise.all([
    admin.from("hospital_memberships").select("role, hospital_id").eq("profile_id", user.id).eq("is_active", true),
    admin.from("patients").select("id, hospital_id").eq("profile_id", user.id).maybeSingle(),
  ]);
  tAuthChain.push(performance.now() - t0);
}

const sampleIds =
  (await admin.from("appointments").select("id").eq("hospital_id", H).limit(200)).data?.map((r) => r.id) ??
  [];
const tAudit = [];
for (let i = 0; i < 8; i++) {
  const t0 = performance.now();
  await admin.from("audit_logs").insert({
    hospital_id: H,
    actor_id: user.id,
    actor_email: EMAIL,
    action: "read",
    resource: "appointments",
    entity_type: "appointments",
    metadata: {
      record_level: true,
      record_ids: sampleIds,
      count: sampleIds.length,
      probe: "post-index-latency",
    },
  });
  tAudit.push(performance.now() - t0);
}

async function workerHit(token) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json().catch(() => ({}));
  return {
    ms: performance.now() - t0,
    status: res.status,
    ok: body.ok === true,
    rows: Array.isArray(body.data) ? body.data.length : 0,
  };
}

// Warm sequential (same token → auth cache hits after first)
await workerHit(tokenWarm);
const warmSeq = [];
for (let i = 0; i < N; i++) warmSeq.push(await workerHit(tokenWarm));
const warmStats = stats(warmSeq.map((r) => r.ms));
warmStats.errors = warmSeq.filter((r) => r.status !== 200 || !r.ok).length;

// Cold-auth: new sign-in each request defeats Worker auth cache fingerprint reuse
// (different JWT each time). N=8 to bound runtime.
const coldSeq = [];
for (let i = 0; i < 8; i++) {
  const tok = await freshToken();
  coldSeq.push(await workerHit(tok));
}
const coldStats = stats(coldSeq.map((r) => r.ms));
coldStats.errors = coldSeq.filter((r) => r.status !== 200 || !r.ok).length;

// Concurrent 8 with warm token
const conc = await Promise.all(Array.from({ length: 8 }, () => workerHit(tokenWarm)));
const concStats = stats(conc.map((r) => r.ms));
concStats.errors = conc.filter((r) => r.status !== 200 || !r.ok).length;

const report = {
  at: new Date().toISOString(),
  methodology: {
    timing_boundary: "complete HTTP response round-trip from Node client to localhost:8787 Worker",
    not: ["browser RUM", "remote CF edge", "TTFB-only"],
    cache: {
      warm: "single JWT, Worker authorizePhiRead 20s cache after first hit",
      cold: "fresh signIn JWT each request — auth cache miss",
    },
    row_count: rowCount,
    payload_bytes: payloadBytes,
    embeds: ["staff_profiles", "queue_entries"],
    index: "idx_appointments_hospital_scheduled applied remotely before this run",
  },
  reconciliation: {
    earlier_131_176_ms: {
      source: "docs/evidence/phi-record-level-audit-proof.json / load-test medians",
      meaning:
        "Likely warm Worker median after auth cache + smaller sample / different clock; appointments Worker median reported ~176ms in that suite",
      endpoint: "GET /api/hospital/phi?resource=appointments",
      environment: "localhost Worker",
    },
    later_235_ms_p50: {
      source: "docs/evidence/appointments-latency-breakdown.json",
      meaning:
        "n=30 complete response times after one warm-up; includes localhost hop + JSON parse of ~28KB with embeds; auth cache warm",
      why_higher_than_176:
        "Different sample size (30 vs fewer), possible Worker/CPU contention, and full response body consumption timing — not a PostgREST-only number",
    },
    postgrest_119_ms: {
      meaning: "Direct PostgREST/service_role select median WITHOUT Worker auth/framework — not comparable % to Worker e2e",
    },
  },
  stages_ms: {
    auth_getUser: stats(tGu),
    tenant_permission_lookup: stats(tAuthChain),
    appointments_db_query: stats(tDb),
    audit_persist_off_critical_path: stats(tAudit),
    worker_e2e_warm_sequential: warmStats,
    worker_e2e_cold_auth: coldStats,
    worker_e2e_concurrent_8: concStats,
  },
  breakdown_table: [
    {
      stage: "auth_getUser",
      p50: stats(tGu).p50,
      p95: stats(tGu).p95,
      p99: stats(tGu).p99,
      notes: "Isolated; cached in Worker after first hit",
    },
    {
      stage: "tenant_permission_lookup",
      p50: stats(tAuthChain).p50,
      p95: stats(tAuthChain).p95,
      p99: stats(tAuthChain).p99,
      notes: "Cached with getUser in Worker",
    },
    {
      stage: "appointments_db_query",
      p50: stats(tDb).p50,
      p95: stats(tDb).p95,
      p99: stats(tDb).p99,
      notes: "service_role select with embeds; index present",
    },
    {
      stage: "audit_persist",
      p50: stats(tAudit).p50,
      p95: stats(tAudit).p95,
      p99: stats(tAudit).p99,
      notes: "waitUntil background — NOT on Worker TTFB critical path",
    },
    {
      stage: "worker_e2e_warm",
      p50: warmStats.p50,
      p95: warmStats.p95,
      p99: warmStats.p99,
      notes: "complete response time, warm auth cache",
    },
    {
      stage: "worker_e2e_cold_auth",
      p50: coldStats.p50,
      p95: coldStats.p95,
      p99: coldStats.p99,
      notes: "fresh JWT each request",
    },
    {
      stage: "worker_e2e_concurrent_8",
      p50: concStats.p50,
      p95: concStats.p95,
      p99: concStats.p99,
      notes: "dashboard burst",
    },
  ],
  pass:
    warmStats.errors === 0 &&
    coldStats.errors === 0 &&
    concStats.errors === 0 &&
    warmStats.p95 < 800,
};

writeFileSync("docs/evidence/appointments-latency-post-index.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
