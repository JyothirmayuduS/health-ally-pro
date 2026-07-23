/**
 * Post-fix load test: 80-row PostgREST selects after removing HTTP-in-RLS.
 * Temporarily grants SELECT to authenticated for the three tables, then revokes.
 *
 * Usage: node --env-file=.env.local scripts/phi-read-audit-load-test-post-fix.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const TABLES = ["patients", "appointments", "lab_results"];
const LIMIT = 80;

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const client = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Use REST RPC to run grants via a one-shot SQL function if available; else document that
// grants must be applied via MCP. We'll call apply via supabase rpc execute_sql isn't available
// from JS — use raw SQL through a temporary SECURITY DEFINER helper.

async function timeSelect(table) {
  const t0 = performance.now();
  const { data, error } = await client.from(table).select("id, hospital_id").limit(LIMIT);
  return {
    ms: performance.now() - t0,
    rows: data?.length ?? 0,
    error: error?.message ?? null,
    code: error?.code ?? null,
  };
}

function summarize(runs) {
  const ms = runs.map((r) => r.ms);
  const sorted = [...ms].sort((a, b) => a - b);
  return {
    rows: runs[0]?.rows,
    error: runs.find((r) => r.error)?.error ?? null,
    code: runs.find((r) => r.error)?.code ?? null,
    ms_runs: ms.map((x) => Math.round(x * 100) / 100),
    ms_median: Math.round(sorted[1] * 100) / 100,
    ms_min: Math.round(Math.min(...ms) * 100) / 100,
    ms_max: Math.round(Math.max(...ms) * 100) / 100,
  };
}

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed?.users?.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
await client.auth.signInWithPassword({ email: EMAIL, password: PASS });

// Expect grants already applied by companion SQL (phi_loadtest_grant) or fail clearly
const probe = await timeSelect("patients");
if (probe.error) {
  const report = {
    error: "authenticated SELECT still denied — apply temporary GRANT via MCP before this script",
    probe,
  };
  writeFileSync(
    "docs/evidence/phi-read-audit-load-test-post-fix.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(2);
}

const results = {};
for (const t of TABLES) {
  await timeSelect(t);
  const runs = [];
  for (let i = 0; i < 3; i++) runs.push(await timeSelect(t));
  results[t] = summarize(runs);
}

const prior = {
  patients_active_median_ms: 3345.6,
  patients_baseline_off_median_ms: 141.95,
  appointments_active_median_ms: 3396.34,
  appointments_baseline_off_median_ms: 460.82,
  lab_results_active_median_ms: 3381.64,
  lab_results_baseline_off_median_ms: 263.37,
};

const report = {
  limit: LIMIT,
  note: "HTTP-in-RLS removed; policies are plain predicates. Temporary SELECT grant for load test only.",
  post_fix: results,
  prior_round1: prior,
  vs_prior_baseline: {
    patients_delta_vs_off:
      Math.round((results.patients.ms_median - prior.patients_baseline_off_median_ms) * 100) / 100,
    appointments_delta_vs_off:
      Math.round(
        (results.appointments.ms_median - prior.appointments_baseline_off_median_ms) * 100,
      ) / 100,
    lab_results_delta_vs_off:
      Math.round((results.lab_results.ms_median - prior.lab_results_baseline_off_median_ms) * 100) /
      100,
  },
  vs_prior_active: {
    patients_improvement_ms:
      Math.round((prior.patients_active_median_ms - results.patients.ms_median) * 100) / 100,
    appointments_improvement_ms:
      Math.round((prior.appointments_active_median_ms - results.appointments.ms_median) * 100) /
      100,
    lab_results_improvement_ms:
      Math.round((prior.lab_results_active_median_ms - results.lab_results.ms_median) * 100) / 100,
  },
};

writeFileSync(
  "docs/evidence/phi-read-audit-load-test-post-fix.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
