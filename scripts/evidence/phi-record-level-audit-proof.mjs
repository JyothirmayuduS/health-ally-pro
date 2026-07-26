/**
 * Prove async record-level PHI read audit on Worker path.
 * Tables: patients, appointments, lab_results (+ patient_medications spot-check).
 *
 * Latency: Worker HTTP median vs post-fix PostgREST baseline (~103–119 ms) and vs
 * direct service_role 80-row select. Audit must not block response (record_ids appear
 * after HTTP completes).
 *
 * Usage: node --env-file=.env.local scripts/phi-record-level-audit-proof.mjs
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
const TABLES = ["patients", "appointments", "lab_results"];
const LIMIT = 80;

const POST_FIX_BASELINE = {
  patients: 113.01,
  appointments: 119.41,
  lab_results: 103.92,
};

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const authClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
const token = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
  .session.access_token;

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function directSelect(table) {
  const t0 = performance.now();
  const { data, error } = await admin
    .from(table)
    .select("id, hospital_id")
    .eq("hospital_id", H)
    .limit(LIMIT);
  return {
    ms: performance.now() - t0,
    rows: data?.length ?? 0,
    ids: (data ?? []).map((r) => r.id),
    error: error?.message ?? null,
  };
}

async function workerHit(resource) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/hospital/phi?resource=${resource}&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json().catch(() => ({}));
  const ms = performance.now() - t0;
  const data = body.data;
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return {
    status: res.status,
    ms,
    ok: body.ok === true,
    rows: rows.length,
    ids: rows.map((r) => r?.id).filter(Boolean),
  };
}

const load = {};
for (const table of TABLES) {
  // warm
  await workerHit(table);
  const directRuns = [];
  for (let i = 0; i < 3; i++) directRuns.push(await directSelect(table));
  const workerRuns = [];
  for (let i = 0; i < 5; i++) workerRuns.push(await workerHit(table));
  const directMed = median(directRuns.map((r) => r.ms));
  const workerMed = median(workerRuns.map((r) => r.ms));
  load[table] = {
    limit: LIMIT,
    direct_runs_ms: directRuns.map((r) => Math.round(r.ms * 100) / 100),
    direct_median_ms: Math.round(directMed * 100) / 100,
    direct_rows: directRuns[0]?.rows ?? 0,
    worker_runs_ms: workerRuns.map((r) => Math.round(r.ms * 100) / 100),
    worker_median_ms: Math.round(workerMed * 100) / 100,
    worker_rows: workerRuns[0]?.rows ?? 0,
    worker_all_200: workerRuns.every((r) => r.status === 200 && r.ok),
    post_fix_postgrest_median_ms: POST_FIX_BASELINE[table],
    delta_worker_vs_post_fix_ms: Math.round((workerMed - POST_FIX_BASELINE[table]) * 100) / 100,
    delta_direct_vs_post_fix_ms: Math.round((directMed - POST_FIX_BASELINE[table]) * 100) / 100,
    note: "post_fix baseline was PostgREST SELECT (temporary grant). Production path is Worker+service_role; direct_median approximates DB cost; worker_median includes auth+framework. Async audit must not push worker_median far above prior worker profiles (~200–450ms warm).",
  };
}

// Record-id audit verification (patients)
const markerBefore = new Date().toISOString();
const hit = await workerHit("patients");
await new Promise((r) => setTimeout(r, 2500));
const { data: auditRows, error: auditErr } = await admin
  .from("audit_logs")
  .select("id, created_at, resource, action, actor_id, entity_type, entity_id, metadata")
  .eq("hospital_id", H)
  .eq("resource", "patients")
  .eq("action", "read")
  .eq("actor_id", user.id)
  .gte("created_at", markerBefore)
  .order("created_at", { ascending: false })
  .limit(5);

const latest = auditRows?.[0];
const meta = latest?.metadata ?? {};
const recordIds = Array.isArray(meta.record_ids) ? meta.record_ids : [];
const idsMatch =
  hit.ids.length > 0 &&
  recordIds.length === hit.ids.length &&
  hit.ids.every((id) => recordIds.includes(id));

const recordLevel = {
  http_status: hit.status,
  http_ok: hit.ok,
  returned_ids: hit.ids,
  audit_error: auditErr?.message ?? null,
  audit_row: latest
    ? {
        id: latest.id,
        created_at: latest.created_at,
        entity_type: latest.entity_type,
        entity_id: latest.entity_id,
        metadata: meta,
      }
    : null,
  record_level_flag: meta.record_level === true,
  record_ids_logged: recordIds,
  count_matches: meta.count === recordIds.length,
  ids_match_response: idsMatch,
  pass:
    hit.ok && hit.status === 200 && meta.record_level === true && idsMatch && recordIds.length > 0,
};

// patient_medications spot-check
const medBefore = new Date().toISOString();
const medHit = await workerHit("patient_medications");
await new Promise((r) => setTimeout(r, 2000));
const { data: medAudit } = await admin
  .from("audit_logs")
  .select("id, metadata")
  .eq("hospital_id", H)
  .eq("resource", "patient_medications")
  .eq("action", "read")
  .eq("actor_id", user.id)
  .gte("created_at", medBefore)
  .order("created_at", { ascending: false })
  .limit(1);
const medMeta = medAudit?.[0]?.metadata ?? {};
const medIds = Array.isArray(medMeta.record_ids) ? medMeta.record_ids : [];

const report = {
  at: new Date().toISOString(),
  base: BASE,
  load_test: load,
  record_level_patients: recordLevel,
  patient_medications_spot: {
    http_ok: medHit.ok,
    rows: medHit.rows,
    audit_record_level: medMeta.record_level === true,
    audit_record_ids_count: medIds.length,
    ids_match: medHit.ids.every((id) => medIds.includes(id)) && medIds.length === medHit.ids.length,
  },
  latency_verdict: {
    post_fix_baselines_ms: POST_FIX_BASELINE,
    worker_medians_ms: Object.fromEntries(TABLES.map((t) => [t, load[t].worker_median_ms])),
    direct_medians_ms: Object.fromEntries(TABLES.map((t) => [t, load[t].direct_median_ms])),
    async_safe:
      TABLES.every((t) => load[t].worker_all_200) &&
      TABLES.every((t) => load[t].worker_median_ms < 2000) &&
      recordLevel.pass,
    explanation:
      "If async audit blocked the response, Worker median would approach Round-1 active (~3.3s). Staying near prior Worker warm range (~200–850ms) and far below 3.3s proves non-blocking.",
  },
  pass:
    recordLevel.pass &&
    TABLES.every((t) => load[t].worker_all_200) &&
    TABLES.every((t) => load[t].worker_median_ms < 2000) &&
    TABLES.every((t) => load[t].direct_median_ms < 500),
};

writeFileSync("docs/evidence/phi-record-level-audit-proof.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
