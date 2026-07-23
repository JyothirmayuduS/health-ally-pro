/**
 * Load-test + fail-mode + EXPLAIN evidence for phi_read_audit.
 * Usage: node --env-file=.env.local scripts/phi-read-audit-load-test.mjs
 *
 * Modes via PHI_AUDIT_MODE env (set in DB via config key audit_http_mode):
 *   active | baseline | broken_url
 */
import { createClient } from "@supabase/supabase-js";
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const H = "a0000001-0001-4001-8001-000000000001";
const N = 80;

function assert(c, m) {
  if (!c) throw new Error(m);
}

async function seed(admin) {
  const { count } = await admin
    .from("patients")
    .select("id", { count: "exact", head: true })
    .like("mrn", "LOAD-%");
  if ((count ?? 0) >= N) {
    return { seeded: false, existing: count };
  }
  const patients = [];
  const appts = [];
  const labs = [];
  for (let i = 0; i < N; i++) {
    const id = crypto.randomUUID();
    patients.push({ id, hospital_id: H, mrn: `LOAD-${String(i).padStart(4, "0")}` });
    appts.push({
      id: crypto.randomUUID(),
      hospital_id: H,
      patient_id: id,
      scheduled_at: new Date(Date.now() + i * 3600000).toISOString(),
      reason: `load-test-${i}`,
      status: "upcoming",
    });
    labs.push({
      id: crypto.randomUUID(),
      hospital_id: H,
      patient_id: id,
      title: `Load Lab ${i}`,
      report_type: "Lab",
      result_date: new Date().toISOString().slice(0, 10),
    });
  }
  const p = await admin.from("patients").upsert(patients, { onConflict: "id" });
  assert(!p.error, p.error?.message);
  const a = await admin.from("appointments").upsert(appts, { onConflict: "id" });
  assert(!a.error, a.error?.message);
  const l = await admin.from("lab_results").upsert(labs, { onConflict: "id" });
  assert(!l.error, l.error?.message);
  return { seeded: true, n: N };
}

async function setAuditMode(admin, mode) {
  const { data, error } = await admin.rpc("phi_audit_set_mode", { p_mode: mode });
  if (error) throw new Error(`phi_audit_set_mode(${mode}): ${error.message}`);
  return data;
}

async function timeSelect(client, table, limit) {
  const t0 = performance.now();
  const { data, error } = await client.from(table).select("id, hospital_id").limit(limit);
  const ms = performance.now() - t0;
  return { ms, rows: data?.length ?? 0, error: error?.message ?? null };
}

async function main() {
  assert(url && anon && service, "missing env");
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

  const seedInfo = await seed(admin);

  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = listed?.users?.find((u) => u.email === EMAIL);
  assert(user, "doctor missing");
  await admin.auth.admin.updateUserById(user.id, { password: PASS });
  const signIn = await client.auth.signInWithPassword({ email: EMAIL, password: PASS });
  assert(!signIn.error, signIn.error?.message);

  const tables = ["patients", "appointments", "lab_results"];
  const limit = 80;

  // --- ACTIVE (HTTP ingest on) ---
  await setAuditMode(admin, "active");
  const active = {};
  for (const t of tables) {
    await timeSelect(client, t, limit);
    const runs = [];
    for (let i = 0; i < 3; i++) runs.push(await timeSelect(client, t, limit));
    active[t] = runs;
  }

  // --- BASELINE (http off — RAISE LOG only) ---
  await setAuditMode(admin, "off");
  const baseline = {};
  for (const t of tables) {
    await timeSelect(client, t, limit);
    const runs = [];
    for (let i = 0; i < 3; i++) runs.push(await timeSelect(client, t, limit));
    baseline[t] = runs;
  }

  // --- BROKEN URL (primary ingest fails; expect DLQ, read still OK) ---
  await setAuditMode(admin, "broken_url");
  const beforeAudit = new Date().toISOString();
  const broken = await timeSelect(client, "patients", 5);
  await new Promise((r) => setTimeout(r, 2500));
  const { data: afterBroken } = await admin.rpc("phi_read_audit_since", {
    p_since: beforeAudit,
    p_table: "patients",
    p_actor: user.id,
  });
  const { data: dlq } = await admin.rpc("phi_read_audit_dlq_since", {
    p_since: beforeAudit,
  });
  const { data: health } = await admin.rpc("phi_audit_health_check");
  const { data: cronProof } = await admin.rpc("phi_audit_run_cron_check");

  // restore
  await setAuditMode(admin, "active");

  const summarize = (runs) => {
    const ms = runs.map((r) => r.ms);
    return {
      rows: runs[0]?.rows,
      error: runs.find((r) => r.error)?.error ?? null,
      ms_runs: ms.map((x) => Math.round(x * 100) / 100),
      ms_median: Math.round([...ms].sort((a, b) => a - b)[1] * 100) / 100,
      ms_min: Math.round(Math.min(...ms) * 100) / 100,
      ms_max: Math.round(Math.max(...ms) * 100) / 100,
    };
  };

  const report = {
    seedInfo,
    limit,
    tables,
    active: Object.fromEntries(tables.map((t) => [t, summarize(active[t])])),
    baseline_http_off: Object.fromEntries(tables.map((t) => [t, summarize(baseline[t])])),
    delta_ms_median: Object.fromEntries(
      tables.map((t) => [
        t,
        Math.round((summarize(active[t]).ms_median - summarize(baseline[t]).ms_median) * 100) / 100,
      ]),
    ),
    broken_url: {
      read: broken,
      clinical_read_succeeded: !broken.error && broken.rows > 0,
      phi_read_audit_rows_after: afterBroken?.length ?? 0,
      dlq_rows_after: dlq?.length ?? 0,
      sample_dlq: dlq?.[0] ?? null,
      health_check: health,
      cron_check_proof: cronProof,
      classification:
        !broken.error &&
        broken.rows > 0 &&
        (dlq?.length ?? 0) > 0
          ? "READ_OK_PRIMARY_FAILED_DLQ_CAPTURED"
          : !broken.error &&
              broken.rows > 0 &&
              (afterBroken?.length ?? 0) === 0 &&
              (dlq?.length ?? 0) === 0
            ? "FAIL_OPEN_audit_and_dlq_lost"
            : broken.error
              ? "FAIL_CLOSED_read_blocked"
              : "OTHER",
    },
  };

  writeFileSync(
    "docs/evidence/phi-read-audit-load-test.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ error: String(e.message || e) }, null, 2));
  process.exit(1);
});
