#!/usr/bin/env node
/**
 * Bounded load smoke for enterprise hardening evidence.
 * Not a full 1000-VU soak — documents methodology and runs realistic concurrent bursts.
 *
 * Usage:
 *   MEDORA_BASE_URL=http://127.0.0.1:8787 node --env-file=.env.local scripts/load-smoke.mjs
 *   USERS=50 CONCURRENCY=20 node --env-file=.env.local scripts/load-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE =
  process.env.MEDORA_BASE_URL || process.env.MEDORA_DOCKER_URL || "http://127.0.0.1:8787";
const H = "a0000001-0001-4001-8001-000000000001";
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const USERS = Math.min(
  Number(process.env.USERS || 100),
  process.env.ALLOW_HIGH_LOAD === "1" ? 1000 : 250,
);
const CONCURRENCY = Math.min(
  Number(process.env.CONCURRENCY || 20),
  process.env.ALLOW_HIGH_LOAD === "1" ? 100 : 50,
);

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const authClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
const token = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
  .session.access_token;

const resources = ["appointments", "patients", "lab_results"];
async function hit(resource) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/hospital/phi?resource=${resource}&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json().catch(() => ({}));
  return {
    resource,
    status: res.status,
    ok: body.ok === true,
    ms: performance.now() - t0,
  };
}

const results = [];
let inFlight = 0;
let idx = 0;
const queue = [];
for (let i = 0; i < USERS; i++) queue.push(resources[i % resources.length]);

const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (idx < queue.length) {
    const my = idx++;
    inFlight++;
    try {
      results.push(await hit(queue[my]));
    } finally {
      inFlight--;
    }
  }
});

const wall0 = performance.now();
await Promise.all(workers);
const wallMs = performance.now() - wall0;

const errors = results.filter((r) => r.status !== 200 || !r.ok).length;
const byRes = {};
for (const r of resources) {
  const subset = results.filter((x) => x.resource === r);
  byRes[r] = {
    ...stats(subset.map((x) => x.ms)),
    errors: subset.filter((x) => x.status !== 200 || !x.ok).length,
  };
}

const report = {
  at: new Date().toISOString(),
  base: BASE,
  methodology: {
    note: "In-process Node concurrency against localhost Worker/Docker — not distributed k6/Locust. Caps: USERS<=250, CONCURRENCY<=50 for safety.",
    users_simulated: USERS,
    concurrency: CONCURRENCY,
    resources,
  },
  wall_ms: Math.round(wallMs),
  throughput_rps: Math.round((results.length / (wallMs / 1000)) * 100) / 100,
  overall: {
    ...stats(results.map((r) => r.ms)),
    errors,
    error_rate: errors / Math.max(results.length, 1),
  },
  by_resource: byRes,
  pending_full_load: {
    "100_users": USERS >= 100 ? "covered_by_this_run_or_higher" : "not_run",
    "250_users": USERS >= 250 ? "covered" : "pending_or_partial",
    "500_users": "pending_external_load_generator",
    "1000_users": "pending_external_load_generator",
  },
  pass: errors === 0 && results.length === USERS,
};

writeFileSync("docs/evidence/load-smoke.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
