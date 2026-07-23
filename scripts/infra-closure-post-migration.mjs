/**
 * Post-migration closure suite: lifecycle, force-fail, waitUntil durability,
 * concurrency, auth, latency reconcile.
 * Usage: node --env-file=.env.local scripts/infra-closure-post-migration.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = process.env.MEDORA_BASE_URL || "http://127.0.0.1:8787";
const DOCKER = process.env.MEDORA_DOCKER_URL || "http://127.0.0.1:3001";
const EMAIL = "doctor@oakhaven.demo";
const PASS = "MedoraDemo!2026Doc";
const H = "a0000001-0001-4001-8001-000000000001";
const OTHER_H = "a0000001-0001-4001-8001-000000000099";
const KNOWN = [
  "27be26a6-a418-4828-974a-66970cb78a64",
  "ad905f3f-fa4f-422d-9f67-54241ee0a790",
  "f302f5ee-f085-47df-b849-27203e5460b8",
  "6f9ca1f1-01e5-420e-9c18-76d2c58363ff",
];

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const authClient = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
    avg: Math.round((sum / Math.max(s.length, 1)) * 100) / 100,
    p50: pct(s, 50),
    p95: pct(s, 95),
    p99: pct(s, 99),
    max: pct(s, 100),
  };
}

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = listed.users.find((u) => u.email === EMAIL);
await admin.auth.admin.updateUserById(user.id, { password: PASS });
const token = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
  .session.access_token;

const report = {
  at: new Date().toISOString(),
  project_ref: "wsnpwyqypgclsclktoyf",
  hospital_id: H,
  actor_id: user.id,
  tests: {},
};

// --- Health source ---
const status0 = await fetch(`${BASE}/api/status`).then((r) => r.json());
const { data: health0 } = await admin.rpc("audit_write_failures_health");
report.tests.health_database_rpc = {
  pass:
    status0.audit_dlq?.source === "database_rpc" &&
    health0?.source === "database_rpc" &&
    health0?.open_failures === 0,
  status_audit_dlq: status0.audit_dlq,
  rpc_health: health0,
};

// --- Known artifacts ---
const { data: knownRows } = await admin
  .from("audit_write_failures")
  .select("id, status, resolved_at, resolution, payload, error_message")
  .in("id", KNOWN);
report.tests.known_artifacts = {
  pass:
    (knownRows?.length ?? 0) === 4 &&
    knownRows.every((r) => r.status === "test_artifact" && r.resolved_at) &&
    health0?.open_failures === 0,
  rows: (knownRows ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    resolved_at: r.resolved_at,
    resolution_reason: r.resolution?.resolution_reason || r.resolution?.reason || null,
    simulated: r.payload?.simulated === true,
    proof: r.payload?.proof || r.payload?.row?.metadata?.proof || null,
    error_message: r.error_message,
  })),
};

// --- Lifecycle open → ack → resolved ---
const lifeMarker = `lifecycle-${Date.now()}`;
const lifeIns = await admin
  .from("audit_write_failures")
  .insert({
    error_message: "PHI_AUDIT_FORCE_FAIL",
    payload: { simulated: true, proof: lifeMarker, path: "lifecycle-test" },
  })
  .select("id, status, resolved_at")
  .single();
const lifeId = lifeIns.data?.id;
const { data: hOpen } = await admin.rpc("audit_write_failures_health");
const ack = await admin.rpc("resolve_audit_write_failure", {
  p_id: lifeId,
  p_status: "acknowledged",
  p_resolved_by: "infra-closure",
  p_reason: "lifecycle ack step",
});
const { data: hAck } = await admin.rpc("audit_write_failures_health");
const { data: ackRow } = await admin
  .from("audit_write_failures")
  .select("id, status, resolved_at, resolution")
  .eq("id", lifeId)
  .single();
const res = await admin.rpc("resolve_audit_write_failure", {
  p_id: lifeId,
  p_status: "resolved",
  p_resolved_by: "infra-closure",
  p_reason: "lifecycle resolve step",
});
const { data: hRes } = await admin.rpc("audit_write_failures_health");
const { data: resRow } = await admin
  .from("audit_write_failures")
  .select("id, status, resolved_at, resolution, payload")
  .eq("id", lifeId)
  .single();

report.tests.lifecycle_open_ack_resolved = {
  pass:
    !!lifeId &&
    hOpen?.alert === true &&
    hOpen?.open_failures >= 1 &&
    ack.data?.ok === true &&
    ackRow?.status === "acknowledged" &&
    !ackRow?.resolved_at &&
    hAck?.alert === false && // acknowledged is non-alerting
    hAck?.acknowledged_failures >= 1 &&
    res.data?.ok === true &&
    resRow?.status === "resolved" &&
    !!resRow?.resolved_at &&
    hRes?.ok === true &&
    !!resRow?.payload, // original payload retained
  record_id: lifeId,
  health_open: hOpen,
  health_acked: hAck,
  health_resolved: hRes,
  ack_row: {
    status: ackRow?.status,
    acknowledged_at: ackRow?.resolution?.acknowledged_at,
    acknowledged_by: ackRow?.resolution?.acknowledged_by,
  },
  resolved_row: {
    status: resRow?.status,
    resolved_at: resRow?.resolved_at,
    resolved_by: resRow?.resolution?.resolved_by,
    reason: resRow?.resolution?.resolution_reason,
    retained_payload_proof: resRow?.payload?.proof,
  },
};

// --- open → test_artifact ---
const artIns = await admin
  .from("audit_write_failures")
  .insert({
    error_message: "PHI_AUDIT_FORCE_FAIL",
    payload: { simulated: true, proof: `artifact-${Date.now()}` },
  })
  .select("id")
  .single();
const artId = artIns.data?.id;
const { data: hArtOpen } = await admin.rpc("audit_write_failures_health");
const artRes = await admin.rpc("resolve_audit_write_failure", {
  p_id: artId,
  p_status: "test_artifact",
  p_resolved_by: "infra-closure",
  p_reason: "lifecycle test_artifact path",
});
const { data: hArtDone } = await admin.rpc("audit_write_failures_health");
const { data: artRow } = await admin
  .from("audit_write_failures")
  .select("id, status, resolved_at")
  .eq("id", artId)
  .single();
report.tests.lifecycle_open_test_artifact = {
  pass:
    hArtOpen?.alert === true &&
    artRes.data?.ok === true &&
    artRow?.status === "test_artifact" &&
    !!artRow?.resolved_at &&
    hArtDone?.ok === true,
  record_id: artId,
  health_before: hArtOpen,
  health_after: hArtDone,
  retained: !!artRow,
};

// --- Unauthorized RPC (anon key) ---
const anonRpc = await authClient.rpc("resolve_audit_write_failure", {
  p_id: lifeId,
  p_status: "resolved",
  p_resolved_by: "attacker",
  p_reason: "should fail",
});
const anonHealth = await authClient.rpc("audit_write_failures_health");
report.tests.rpc_unauthorized = {
  pass: !!anonRpc.error && !!anonHealth.error,
  resolve_error: anonRpc.error?.message ?? null,
  health_error: anonHealth.error?.message ?? null,
};

// --- Forced failure (simulated enqueue matching Worker DLQ path) + clinical 200 ---
const beforeForce = new Date().toISOString();
const forceMarker = `force-${Date.now()}`;
const clinicalRes = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Origin: BASE,
    "Sec-Fetch-Site": "same-origin",
    "X-Request-Id": forceMarker,
  },
});
const clinicalBody = await clinicalRes.json();
const requestId = forceMarker;
const dlqIns = await admin
  .from("audit_write_failures")
  .insert({
    error_message: "PHI_AUDIT_FORCE_FAIL",
    payload: {
      simulated: true,
      proof: forceMarker,
      request_id: requestId,
      path: "writeRecordLevelPhiReadAudit",
      row: {
        hospital_id: H,
        actor_id: user.id,
        action: "read",
        resource: "appointments",
        metadata: {
          record_level: true,
          record_ids: Array.isArray(clinicalBody.data)
            ? clinicalBody.data.slice(0, 5).map((r) => r.id)
            : [],
          count: Array.isArray(clinicalBody.data) ? clinicalBody.data.length : 0,
          request_id: requestId,
        },
      },
    },
  })
  .select("id")
  .single();
const { data: hForce } = await admin.rpc("audit_write_failures_health");
const forceId = dlqIns.data?.id;
const clean = await admin.rpc("resolve_audit_write_failure", {
  p_id: forceId,
  p_status: "test_artifact",
  p_resolved_by: "infra-closure",
  p_reason: "Forced-failure proof cleanup",
});
const { data: hClean } = await admin.rpc("audit_write_failures_health");
const { data: forceRetained } = await admin
  .from("audit_write_failures")
  .select("id, status, resolved_at, payload")
  .eq("id", forceId)
  .single();

report.tests.forced_failure = {
  pass:
    clinicalRes.status === 200 &&
    clinicalBody.ok === true &&
    (Array.isArray(clinicalBody.data) ? clinicalBody.data.length : 0) > 0 &&
    !!forceId &&
    hForce?.alert === true &&
    hForce?.open_failures === 1 &&
    clean.data?.ok === true &&
    hClean?.ok === true &&
    forceRetained?.status === "test_artifact" &&
    forceRetained?.payload?.request_id === requestId,
  clinical_status: clinicalRes.status,
  rows: Array.isArray(clinicalBody.data) ? clinicalBody.data.length : 0,
  request_id: requestId,
  dlq_id: forceId,
  health_alert: hForce,
  health_after: hClean,
  retained_status: forceRetained?.status,
};

// --- waitUntil durability: response then audit appears ---
const beforeAudit = new Date().toISOString();
const t0 = performance.now();
const durRes = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Origin: BASE,
    "Sec-Fetch-Site": "same-origin",
  },
});
const durBody = await durRes.json();
const responseMs = performance.now() - t0;
let auditRow = null;
const pollDeadline = Date.now() + 8000;
while (Date.now() < pollDeadline) {
  const { data } = await admin
    .from("audit_logs")
    .select("id, created_at, metadata")
    .eq("hospital_id", H)
    .eq("resource", "appointments")
    .eq("actor_id", user.id)
    .eq("action", "read")
    .gte("created_at", beforeAudit)
    .order("created_at", { ascending: false })
    .limit(5);
  const hit = (data ?? []).find(
    (a) =>
      a.metadata?.record_level === true &&
      Array.isArray(a.metadata?.record_ids) &&
      a.metadata.record_ids.length === (Array.isArray(durBody.data) ? durBody.data.length : -1),
  );
  if (hit) {
    auditRow = hit;
    break;
  }
  await new Promise((r) => setTimeout(r, 250));
}
report.tests.waituntil_durability = {
  pass: durRes.status === 200 && durBody.ok === true && !!auditRow,
  response_ms: Math.round(responseMs * 100) / 100,
  response_status: durRes.status,
  audit_id: auditRow?.id ?? null,
  audit_created_at: auditRow?.created_at ?? null,
  record_ids_count: auditRow?.metadata?.record_ids?.length ?? null,
  poll_timeout_ms: 8000,
  note: "Audit may complete after TTFB via waitUntil; bounded poll verifies durability",
};

// --- Concurrent 8 ---
const beforeConc = new Date().toISOString();
async function hit() {
  const t = performance.now();
  const res = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json();
  const ids = Array.isArray(body.data) ? body.data.map((r) => r.id).sort() : [];
  return {
    status: res.status,
    ok: body.ok === true,
    ms: performance.now() - t,
    rows: ids.length,
    fp: ids.join(","),
  };
}
await hit();
const conc = await Promise.all(Array.from({ length: 8 }, () => hit()));
await new Promise((r) => setTimeout(r, 3500));
const { data: audits } = await admin
  .from("audit_logs")
  .select("id, metadata")
  .eq("hospital_id", H)
  .eq("resource", "appointments")
  .eq("actor_id", user.id)
  .gte("created_at", beforeConc);
const fps = new Set(conc.map((c) => c.fp));
report.tests.concurrent_8 = {
  pass:
    conc.every((c) => c.status === 200 && c.ok) &&
    fps.size === 1 &&
    (audits?.length ?? 0) >= 8 &&
    new Set((audits ?? []).map((a) => a.id)).size === (audits?.length ?? 0) &&
    (audits ?? []).every((a) => a.metadata?.record_level === true),
  latency: stats(conc.map((c) => c.ms)),
  audit_count: audits?.length ?? 0,
  audit_ids: (audits ?? []).map((a) => a.id),
  unique_fingerprints: fps.size,
  rows: conc[0]?.rows,
};

// --- Auth / tenant / flows / docker / force flag ---
const iso = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${OTHER_H}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Origin: BASE,
    "Sec-Fetch-Site": "same-origin",
  },
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const unauth = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
  headers: { Origin: BASE, "Sec-Fetch-Site": "same-origin" },
}).then((r) => r.status);
const bad = await fetch(`${BASE}/api/hospital/phi?resource=appointments&hospitalId=${H}`, {
  headers: {
    Authorization: "Bearer bad",
    Origin: BASE,
    "Sec-Fetch-Site": "same-origin",
  },
}).then((r) => r.status);
report.tests.tenant_isolation = {
  pass: iso.status === 403,
  status: iso.status,
  error: iso.body?.error,
};
report.tests.unauthorized = { pass: unauth === 401 && bad === 401, unauth, bad };

const flows = {};
for (const resource of ["patients", "appointments", "lab_results"]) {
  const res = await fetch(`${BASE}/api/hospital/phi?resource=${resource}&hospitalId=${H}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: BASE,
      "Sec-Fetch-Site": "same-origin",
    },
  });
  const body = await res.json();
  flows[resource] = {
    status: res.status,
    ok: body.ok === true,
    rows: Array.isArray(body.data) ? body.data.length : body.data ? 1 : 0,
  };
}
report.tests.clinical_flows = {
  pass: Object.values(flows).every((f) => f.status === 200 && f.ok),
  flows,
};

const dockerRoot = await fetch(`${DOCKER}/`)
  .then((r) => r.status)
  .catch(() => 0);
report.tests.docker = { pass: dockerRoot === 200, root: dockerRoot };

report.tests.force_fail_flag_off = {
  pass: process.env.PHI_AUDIT_FORCE_FAIL !== "1" && process.env.PHI_AUDIT_FORCE_FAIL !== "true",
  env_value: process.env.PHI_AUDIT_FORCE_FAIL ?? null,
};

const statusFinal = await fetch(`${BASE}/api/status`).then((r) => r.json());
report.tests.final_health = {
  pass: statusFinal.audit_dlq?.ok === true && statusFinal.audit_dlq?.open_failures === 0,
  audit_dlq: statusFinal.audit_dlq,
};

report.pass = Object.values(report.tests).every((t) => t.pass === true);
writeFileSync("docs/evidence/infra-closure-post-migration.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
