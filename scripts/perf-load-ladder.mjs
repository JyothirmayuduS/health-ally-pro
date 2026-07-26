#!/usr/bin/env node
/**
 * Production-scale PHI read ladder (100/250/500/750/1000 concurrent users).
 * Prefer staging Worker; never weakens auth/RLS/audit.
 *
 * Usage:
 *   ALLOW_HIGH_LOAD=1 MEDORA_BASE_URL=https://medora-health-ally-staging....workers.dev \
 *     node --env-file=.env.local scripts/perf-load-ladder.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { cpus, freemem, totalmem } from "node:os";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE =
  process.env.MEDORA_BASE_URL ||
  process.env.MEDORA_DOCKER_URL ||
  "https://medora-health-ally-staging.jyothirmayudu03.workers.dev";
const H = "a0000001-0001-4001-8001-000000000001";
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const SCENARIOS = (process.env.LOAD_SCENARIOS || "100,250,500,750,1000")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n > 0);
const ALLOW = process.env.ALLOW_HIGH_LOAD === "1";
const OUT = process.env.LOAD_REPORT_PATH || "docs/evidence/perf-load-ladder-baseline.json";

if (!ALLOW && SCENARIOS.some((n) => n > 250)) {
  console.error("Set ALLOW_HIGH_LOAD=1 for scenarios > 250");
  process.exit(2);
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

function stats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const pct = (p) => {
    if (!s.length) return null;
    const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
    return Math.round(s[idx] * 100) / 100;
  };
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    min: pct(0),
    avg: s.length ? Math.round((sum / s.length) * 100) / 100 : null,
    p50: pct(50),
    p95: pct(95),
    p99: pct(99),
    max: pct(100),
  };
}

function concurrencyFor(users) {
  if (users <= 100) return 25;
  if (users <= 250) return 40;
  if (users <= 500) return 60;
  if (users <= 750) return 80;
  return 100;
}

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
const token = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
  .session.access_token;

const resources = ["appointments", "patients", "lab_results"];
const APPT_SELECT =
  "id, legacy_id, scheduled_at, time_label, reason, status, doctor_staff_id, hospital_id, patient_id, staff_profiles(legacy_id, initials, specialty), queue_entries(position, estimated_wait_minutes)";

async function hitApi(resource) {
  const t0 = performance.now();
  let status = 0;
  let ok = false;
  try {
    const res = await fetch(`${BASE}/api/hospital/phi?resource=${resource}&hospitalId=${H}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: BASE,
        "Sec-Fetch-Site": "same-origin",
      },
    });
    status = res.status;
    const body = await res.json().catch(() => ({}));
    ok = body.ok === true;
  } catch {
    status = 0;
    ok = false;
  }
  return { resource, status, ok, ms: performance.now() - t0 };
}

async function hitDbDirect(resource) {
  const t0 = performance.now();
  let error = null;
  let rows = 0;
  try {
    if (resource === "appointments") {
      const { data, error: e } = await admin
        .from("appointments")
        .select(APPT_SELECT)
        .eq("hospital_id", H)
        .order("scheduled_at", { ascending: true })
        .limit(200);
      error = e?.message ?? null;
      rows = data?.length ?? 0;
    } else if (resource === "patients") {
      const { data, error: e } = await admin.from("patients").select("id").eq("hospital_id", H).limit(200);
      error = e?.message ?? null;
      rows = data?.length ?? 0;
    } else {
      const { data, error: e } = await admin
        .from("lab_results")
        .select("id")
        .eq("hospital_id", H)
        .limit(200);
      error = e?.message ?? null;
      rows = data?.length ?? 0;
    }
  } catch (e) {
    error = String(e);
  }
  return { resource, ms: performance.now() - t0, error, rows, ok: !error };
}

async function runBurst(users, concurrency) {
  const results = [];
  const queue = [];
  for (let i = 0; i < users; i++) queue.push(resources[i % resources.length]);
  let idx = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < queue.length) {
      const my = idx++;
      results.push(await hitApi(queue[my]));
    }
  });
  const memBefore = process.memoryUsage();
  const wall0 = performance.now();
  await Promise.all(workers);
  const wallMs = performance.now() - wall0;
  const memAfter = process.memoryUsage();

  // Sample DB direct latency at same concurrency (separate, smaller N)
  const dbN = Math.min(60, users);
  const dbResults = [];
  let dbIdx = 0;
  const dbQueue = [];
  for (let i = 0; i < dbN; i++) dbQueue.push(resources[i % resources.length]);
  const dbWorkers = Array.from({ length: Math.min(concurrency, 20) }, async () => {
    while (dbIdx < dbQueue.length) {
      const my = dbIdx++;
      dbResults.push(await hitDbDirect(dbQueue[my]));
    }
  });
  await Promise.all(dbWorkers);

  const errors = results.filter((r) => r.status !== 200 || !r.ok).length;
  const byRes = {};
  for (const r of resources) {
    const subset = results.filter((x) => x.resource === r);
    byRes[r] = {
      ...stats(subset.map((x) => x.ms)),
      errors: subset.filter((x) => x.status !== 200 || !x.ok).length,
    };
  }
  const dbByRes = {};
  for (const r of resources) {
    const subset = dbResults.filter((x) => x.resource === r);
    dbByRes[r] = {
      ...stats(subset.map((x) => x.ms)),
      errors: subset.filter((x) => !x.ok).length,
    };
  }

  // Status / DLQ health sample
  const statusRes = await fetch(`${BASE}/api/status`).then((r) => r.json()).catch(() => null);

  return {
    users,
    concurrency,
    wall_ms: Math.round(wallMs),
    throughput_rps: Math.round((results.length / (wallMs / 1000)) * 100) / 100,
    overall: {
      ...stats(results.map((r) => r.ms)),
      errors,
      error_rate: errors / Math.max(results.length, 1),
    },
    by_resource: byRes,
    db_direct: {
      overall: stats(dbResults.map((r) => r.ms)),
      by_resource: dbByRes,
      errors: dbResults.filter((r) => !r.ok).length,
    },
    client_memory: {
      rss_mb_before: Math.round(memBefore.rss / 1024 / 1024),
      rss_mb_after: Math.round(memAfter.rss / 1024 / 1024),
      heap_used_mb_after: Math.round(memAfter.heapUsed / 1024 / 1024),
    },
    audit_dlq: statusRes?.audit_dlq
      ? {
          source: statusRes.audit_dlq.source,
          open_failures: statusRes.audit_dlq.open_failures,
          alert: statusRes.audit_dlq.alert,
        }
      : null,
    pass: errors === 0 && results.length === users,
  };
}

const host = {
  cpus: cpus().length,
  total_mem_mb: Math.round(totalmem() / 1024 / 1024),
  free_mem_mb_start: Math.round(freemem() / 1024 / 1024),
};

// Warm isolates + auth/JWKS before measuring (avoids attributing cold-start to p95).
const WARMUP_N = Number(process.env.LOAD_WARMUP_N || 40);
console.error(`Warm-up ${WARMUP_N} requests against ${BASE}`);
{
  const warm = [];
  for (let i = 0; i < WARMUP_N; i++) warm.push(hitApi(resources[i % resources.length]));
  await Promise.all(warm);
  await new Promise((r) => setTimeout(r, 1000));
}

const scenarios = [];
for (const users of SCENARIOS) {
  const concurrency = concurrencyFor(users);
  console.error(`Running users=${users} concurrency=${concurrency} against ${BASE}`);
  const result = await runBurst(users, concurrency);
  scenarios.push(result);
  console.error(
    JSON.stringify({
      users,
      p50: result.overall.p50,
      p95: result.overall.p95,
      p99: result.overall.p99,
      rps: result.throughput_rps,
      errors: result.overall.errors,
      db_p95: result.db_direct.overall.p95,
    }),
  );
  // Cool-down between scenarios
  await new Promise((r) => setTimeout(r, 2000));
}

const slowest = [...scenarios]
  .flatMap((s) =>
    Object.entries(s.by_resource).map(([endpoint, st]) => ({
      users: s.users,
      endpoint,
      p95: st.p95,
      p99: st.p99,
      avg: st.avg,
    })),
  )
  .sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0))
  .slice(0, 10);

const report = {
  at: new Date().toISOString(),
  base: BASE,
  host,
  methodology: {
    note: "In-process Node concurrency ladder — not distributed k6. Same JWT reused (auth cache warm path). Warm-up precedes first scenario. Direct PostgREST samples run after each API burst.",
    warmup_n: WARMUP_N,
    scenarios: SCENARIOS,
    resources,
  },
  scenarios,
  slowest_endpoints: slowest,
  enterprise_budget: {
    p50_ms: 500,
    p95_ms: 2000,
    p99_ms: 4000,
    error_rate_max: 0.005,
  },
};

mkdirSync("docs/evidence", { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ wrote: OUT, scenarios: scenarios.length, base: BASE }, null, 2));
