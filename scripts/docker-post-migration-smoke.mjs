/**
 * Docker-backed post-migration smoke tests (no forced-failure).
 * Usage: MEDORA_DOCKER_URL=http://127.0.0.1:3001 node --env-file=.env.local scripts/docker-post-migration-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.MEDORA_DOCKER_URL || "http://127.0.0.1:3001";
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const H = "a0000001-0001-4001-8001-000000000001";
const OTHER = "a0000001-0001-4001-8001-000000000099";

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

const status = await fetch(`${BASE}/api/status`).then((r) => r.json());
const { data: healthBefore } = await admin.rpc("audit_write_failures_health");

async function phi(resource, opts = {}) {
  const hospitalId = opts.hospitalId ?? H;
  const headers = {
    Origin: BASE,
    "Sec-Fetch-Site": "same-origin",
    ...(opts.token === null ? {} : { Authorization: `Bearer ${opts.token ?? token}` }),
    ...(opts.requestId ? { "X-Request-Id": opts.requestId } : {}),
  };
  const t0 = performance.now();
  const res = await fetch(
    `${BASE}/api/hospital/phi?resource=${resource}&hospitalId=${hospitalId}`,
    {
      headers,
    },
  );
  const body = await res.json().catch(() => ({}));
  return {
    status: res.status,
    ok: body.ok === true,
    rows: Array.isArray(body.data) ? body.data.length : body.data ? 1 : 0,
    ms: performance.now() - t0,
    error: body.error ?? null,
  };
}

const tests = [];
function add(name, expected, actual, pass, extra = {}) {
  tests.push({ test: name, expected, actual, result: pass ? "PASS" : "FAIL", ...extra });
}

const appt = await phi("appointments");
add(
  "appointments_auth_200",
  "200 ok rows>0",
  `${appt.status} ok=${appt.ok} rows=${appt.rows}`,
  appt.status === 200 && appt.ok && appt.rows > 0,
  { ms: Math.round(appt.ms) },
);
const patients = await phi("patients");
add(
  "patients_auth_200",
  "200 ok",
  `${patients.status} ok=${patients.ok} rows=${patients.rows}`,
  patients.status === 200 && patients.ok,
);
const labs = await phi("lab_results");
add(
  "lab_results_auth_200",
  "200 ok",
  `${labs.status} ok=${labs.ok} rows=${labs.rows}`,
  labs.status === 200 && labs.ok,
);
const noTok = await phi("appointments", { token: null });
add("missing_auth_401", "401", String(noTok.status), noTok.status === 401);
const badTok = await phi("appointments", { token: "not-a-real-token" });
add("invalid_auth_401", "401", String(badTok.status), badTok.status === 401);
const cross = await phi("appointments", { hospitalId: OTHER });
add("cross_tenant_403", "403", `${cross.status} ${cross.error}`, cross.status === 403);

// Durability: response then audit
const reqId = `docker-durability-${Date.now()}`;
const before = new Date().toISOString();
const t0 = performance.now();
const dur = await phi("appointments", { requestId: reqId });
const responseMs = performance.now() - t0;
let audit = null;
const deadline = Date.now() + 8000;
while (Date.now() < deadline) {
  const { data } = await admin
    .from("audit_logs")
    .select("id, created_at, metadata")
    .eq("hospital_id", H)
    .eq("resource", "appointments")
    .eq("actor_id", user.id)
    .eq("action", "read")
    .gte("created_at", before)
    .order("created_at", { ascending: false })
    .limit(5);
  audit = (data ?? []).find(
    (a) =>
      a.metadata?.record_level === true &&
      Array.isArray(a.metadata?.record_ids) &&
      a.metadata.record_ids.length === dur.rows,
  );
  if (audit) break;
  await new Promise((r) => setTimeout(r, 250));
}
add(
  "audit_durability_waituntil",
  "200 + audit with record_ids",
  `status=${dur.status} audit=${audit?.id ?? null} ids=${audit?.metadata?.record_ids?.length ?? 0}`,
  dur.status === 200 && !!audit,
  {
    request_id: reqId,
    response_ms: Math.round(responseMs * 100) / 100,
    audit_id: audit?.id ?? null,
    record_count: audit?.metadata?.record_ids?.length ?? 0,
    poll_timeout_ms: 8000,
  },
);

// Sync path should not wait for audit insert (~100ms+); response typically returns before audit poll finds row
add(
  "clinical_not_blocked_on_audit",
  "response_ms reasonable (<2000) while audit may appear later",
  `response_ms=${Math.round(responseMs)}`,
  responseMs < 2000 && dur.status === 200,
);

const { data: healthAfter } = await admin.rpc("audit_write_failures_health");
const statusAfter = await fetch(`${BASE}/api/status`).then((r) => r.json());
add(
  "open_failures_remain_0",
  "0 / database_rpc",
  `${statusAfter.audit_dlq?.open_failures} ${statusAfter.audit_dlq?.source}`,
  statusAfter.audit_dlq?.open_failures === 0 &&
    statusAfter.audit_dlq?.source === "database_rpc" &&
    healthAfter?.open_failures === 0,
);
add(
  "no_new_dlq_from_normal_reads",
  "open_failures unchanged at 0",
  `before=${healthBefore?.open_failures} after=${healthAfter?.open_failures}`,
  (healthBefore?.open_failures ?? 0) === 0 && (healthAfter?.open_failures ?? -1) === 0,
);
add(
  "build_identity_matches",
  status.build?.git_commit,
  statusAfter.build?.git_commit,
  statusAfter.build?.git_commit === "7b4d0b9438a5c557f4c45f2ddedb21e551147923",
);

const report = {
  at: new Date().toISOString(),
  base: BASE,
  status_endpoint: {
    status: statusAfter.status,
    build: statusAfter.build,
    audit_dlq: statusAfter.audit_dlq,
    optional_degraded: (statusAfter.checks ?? [])
      .filter((c) => c.optional && !c.ok)
      .map((c) => c.id),
    required_failed: (statusAfter.checks ?? [])
      .filter((c) => !c.optional && !c.ok)
      .map((c) => c.id),
  },
  tests,
  pass: tests.every((t) => t.result === "PASS"),
};

writeFileSync("docs/evidence/docker-post-migration-smoke.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
