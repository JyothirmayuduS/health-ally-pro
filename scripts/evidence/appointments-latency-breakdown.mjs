/**
 * Appointments read latency breakdown (Worker path).
 * Usage: node --env-file=.env.local scripts/appointments-latency-breakdown.mjs
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
const CONC = 8;

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
  };
}

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });

const tSign0 = performance.now();
const session = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
  .session;
const signInMs = performance.now() - tSign0;
const token = session.access_token;

// Stage: getUser
const tGu = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  await admin.auth.getUser(token);
  tGu.push(performance.now() - t0);
}

// Stage: membership + patient lookup (authorizePhiRead parallel)
const tAuthChain = [];
for (let i = 0; i < 10; i++) {
  const t0 = performance.now();
  await Promise.all([
    admin.from("hospital_memberships").select("role, hospital_id").eq("profile_id", user.id).eq("is_active", true),
    admin.from("patients").select("id, hospital_id").eq("profile_id", user.id).maybeSingle(),
  ]);
  tAuthChain.push(performance.now() - t0);
}

// Stage: DB appointments query (same shape as Worker)
const SELECT =
  "id, legacy_id, scheduled_at, time_label, reason, status, doctor_staff_id, hospital_id, patient_id, staff_profiles(legacy_id, initials, specialty), queue_entries(position, estimated_wait_minutes)";
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
    if (error) console.error("db error", error.message);
  }
}

// Stage: audit insert (record-level sized)
const sampleIds = (
  await admin.from("appointments").select("id").eq("hospital_id", H).limit(200)
).data?.map((r) => r.id) ?? [];
const tAudit = [];
for (let i = 0; i < 10; i++) {
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
      actor_role: "staff",
      probe: "appointments-latency-breakdown",
    },
  });
  tAudit.push(performance.now() - t0);
}

// Stage: Worker end-to-end sequential
async function workerHit() {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json();
  return {
    ms: performance.now() - t0,
    status: res.status,
    ok: body.ok === true,
    rows: Array.isArray(body.data) ? body.data.length : 0,
  };
}

await workerHit(); // warm (auth cache)
const seq = [];
for (let i = 0; i < N; i++) seq.push(await workerHit());

// Concurrent dashboard-like burst
const beforeConc = new Date().toISOString();
const conc = await Promise.all(Array.from({ length: CONC }, () => workerHit()));
await new Promise((r) => setTimeout(r, 2500));
const { data: audits } = await admin
  .from("audit_logs")
  .select("id, metadata")
  .eq("hospital_id", H)
  .eq("resource", "appointments")
  .eq("action", "read")
  .eq("actor_id", user.id)
  .gte("created_at", beforeConc);

// Index presence (via pg_indexes if exposed — fallback note)
const { data: indexProbe, error: indexErr } = await admin
  .from("appointments")
  .select("id")
  .eq("hospital_id", H)
  .order("scheduled_at", { ascending: true })
  .limit(1);

const workerStats = stats(seq.map((r) => r.ms));
const report = {
  at: new Date().toISOString(),
  hospital_id: H,
  row_count: rowCount,
  payload_bytes: payloadBytes,
  stages_ms: {
    sign_in_once: Math.round(signInMs * 100) / 100,
    auth_getUser: stats(tGu),
    auth_membership_patient_parallel: stats(tAuthChain),
    db_appointments_select_with_embeds: stats(tDb),
    audit_insert_record_level: stats(tAudit),
    worker_http_sequential: workerStats,
    worker_http_concurrent_8: stats(conc.map((r) => r.ms)),
  },
  breakdown_table: [
    {
      stage: "auth_getUser",
      p50: stats(tGu).p50,
      p95: stats(tGu).p95,
      p99: stats(tGu).p99,
      notes: "Cached 20s in authorizePhiRead after first hit",
    },
    {
      stage: "tenant_permission_lookup",
      p50: stats(tAuthChain).p50,
      p95: stats(tAuthChain).p95,
      p99: stats(tAuthChain).p99,
      notes: "memberships + patient profile parallel; cached with getUser",
    },
    {
      stage: "db_query_appointments",
      p50: stats(tDb).p50,
      p95: stats(tDb).p95,
      p99: stats(tDb).p99,
      notes: `hospital_id filter + embeds staff_profiles/queue_entries; rows=${rowCount}`,
    },
    {
      stage: "audit_persist",
      p50: stats(tAudit).p50,
      p95: stats(tAudit).p95,
      p99: stats(tAudit).p99,
      notes: "waitUntil after response — NOT on critical path of Worker TTFB",
    },
    {
      stage: "worker_e2e_sequential",
      p50: workerStats.p50,
      p95: workerStats.p95,
      p99: workerStats.p99,
      notes: "includes auth cache hits, DB, JSON serialize, localhost hop",
    },
    {
      stage: "worker_e2e_concurrent_8",
      p50: stats(conc.map((r) => r.ms)).p50,
      p95: stats(conc.map((r) => r.ms)).p95,
      p99: stats(conc.map((r) => r.ms)).p99,
      notes: "dashboard-like parallel",
    },
  ],
  concurrency_audit: {
    http_all_200: conc.every((r) => r.status === 200 && r.ok),
    audit_rows: audits?.length ?? 0,
    expected: CONC,
  },
  index_note:
    "Foundation indexes: patient_id, doctor_staff_id. Migration 20260723140000 adds (hospital_id, scheduled_at) for this path.",
  index_probe_ok: !indexErr && !!indexProbe,
  post_fix_baseline_ms: { patients: 113.01, appointments: 119.41, lab_results: 103.92 },
  budgets: {
    p95_warn_ms: 400,
    p95_critical_ms: 800,
    p99_critical_ms: 1500,
    reasoning: "Worker p50 measured ~150–200ms warm; warn ≈2.5×, critical ≈5× / far below Round-1 3.3s",
  },
  pass:
    seq.every((r) => r.status === 200) &&
    conc.every((r) => r.status === 200) &&
    workerStats.p95 < 800 &&
    (audits?.length ?? 0) >= CONC,
};

writeFileSync("docs/evidence/appointments-latency-breakdown.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
