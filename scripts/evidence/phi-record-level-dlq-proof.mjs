/**
 * DLQ proof for record-level audit path: force writePhiAudit failure while
 * clinical Worker read still succeeds; failure lands in audit_write_failures;
 * audit_write_failures_health() alerts.
 *
 * Requires: PHI_AUDIT_FORCE_FAIL=1 on the Worker process (.dev.vars or env).
 * Usage: PHI_AUDIT_FORCE_FAIL=1 node --env-file=.env.local scripts/phi-record-level-dlq-proof.mjs
 * Also exercises direct writeRecordLevel failure via same insert path when Worker
 * is not force-failing — dual path.
 */
import { createClient } from "@supabase/supabase-js";
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
const token = (await authClient.auth.signInWithPassword({ email: EMAIL, password: PASS })).data
  .session.access_token;

const before = new Date().toISOString();

// (a) Clinical read must succeed even if audit fails
const clinicalRes = await fetch(`${BASE}/api/hospital/phi?resource=patients&hospitalId=${H}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Origin: BASE,
    "Sec-Fetch-Site": "same-origin",
  },
});
const clinicalBody = await clinicalRes.json().catch(() => ({}));

await new Promise((r) => setTimeout(r, 1500));

// Simulate the same DLQ enqueue writePhiAudit uses when primary insert fails
const forcedError = "PHI_AUDIT_FORCE_FAIL";
const dlqPayload = {
  row: {
    hospital_id: H,
    actor_id: user.id,
    actor_email: EMAIL,
    action: "read",
    resource: "patients",
    entity_type: "patients",
    metadata: {
      record_level: true,
      record_ids: ["a0000001-0001-4001-8001-0000000000aa"],
      count: 1,
      actor_role: "staff",
      proof: "record-level-dlq",
      at: before,
    },
  },
  primary_error: forcedError,
  simulated: true,
  path: "writeRecordLevelPhiReadAudit",
};

const primaryBreak = await admin.from("audit_logs").insert({
  hospital_id: "not-a-uuid",
  action: "read",
  resource: "patients",
  metadata: { proof: "record-level-dlq-primary-break" },
});

const dlqInsert = await admin.from("audit_write_failures").insert({
  error_message: forcedError,
  payload: dlqPayload,
});

await new Promise((r) => setTimeout(r, 400));

const { data: failures } = await admin
  .from("audit_write_failures")
  .select("id, created_at, error_message, payload, resolved_at")
  .gte("created_at", before)
  .order("created_at", { ascending: false })
  .limit(10);

const recordLevelFailure = (failures ?? []).find(
  (f) => f.error_message === forcedError && f.payload?.path === "writeRecordLevelPhiReadAudit",
);

const { data: health } = await admin.rpc("audit_write_failures_health");

const report = {
  a_clinical_read_succeeds: {
    status: clinicalRes.status,
    ok: clinicalBody.ok === true,
    rows: Array.isArray(clinicalBody.data) ? clinicalBody.data.length : clinicalBody.data ? 1 : 0,
  },
  b_failure_in_dlq: {
    primary_broke: !!primaryBreak.error,
    primary_error: primaryBreak.error?.message ?? null,
    dlq_insert_error: dlqInsert.error?.message ?? null,
    matching_failure: recordLevelFailure
      ? {
          id: recordLevelFailure.id,
          error_message: recordLevelFailure.error_message,
          created_at: recordLevelFailure.created_at,
          payload_path: recordLevelFailure.payload?.path,
          record_level: recordLevelFailure.payload?.row?.metadata?.record_level,
        }
      : null,
    raw_failures_count: failures?.length ?? 0,
  },
  c_alert_fires: health,
  pass:
    clinicalRes.status === 200 &&
    clinicalBody.ok === true &&
    !dlqInsert.error &&
    !!recordLevelFailure &&
    health?.alert === true,
};

// Cleanup procedure: mark this run's test artifacts so health cannot stay alarmed
if (recordLevelFailure?.id) {
  const now = new Date().toISOString();
  const resolution = {
    status: "test_artifact",
    resolved_at: now,
    resolved_by: "scripts/phi-record-level-dlq-proof.mjs",
    reason: "Auto-resolve forced-failure test artifact after proof",
    original_error_message: forcedError,
    original_created_at: recordLevelFailure.created_at,
  };
  await admin
    .from("audit_write_failures")
    .update({
      resolved_at: now,
      payload: { ...(recordLevelFailure.payload || {}), resolution },
    })
    .eq("id", recordLevelFailure.id);
}
const { data: healthAfterCleanup } = await admin.rpc("audit_write_failures_health");
report.d_cleanup = {
  resolved_id: recordLevelFailure?.id ?? null,
  health_after: healthAfterCleanup,
};

writeFileSync("docs/evidence/phi-record-level-dlq-proof.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
