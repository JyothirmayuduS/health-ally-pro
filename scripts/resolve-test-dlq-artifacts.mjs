/**
 * Resolve forced-failure DLQ test artifacts (never delete).
 * Usage: node --env-file=.env.local scripts/resolve-test-dlq-artifacts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const KNOWN_TEST_IDS = [
  "27be26a6-a418-4828-974a-66970cb78a64", // audit-write-dlq-proof simulated
  "ad905f3f-fa4f-422d-9f67-54241ee0a790", // record-level-dlq simulated
  "f302f5ee-f085-47df-b849-27203e5460b8", // PHI_AUDIT_FORCE_FAIL worker live
];

const { data: healthBefore } = await admin.rpc("audit_write_failures_health");
const { data: beforeRows } = await admin
  .from("audit_write_failures")
  .select("id, created_at, error_message, payload, resolved_at")
  .in("id", KNOWN_TEST_IDS);

const resolved = [];
const errors = [];

for (const id of KNOWN_TEST_IDS) {
  const existing = (beforeRows ?? []).find((r) => r.id === id);
  if (!existing) {
    errors.push({ id, error: "not_found_in_select" });
    continue;
  }
  const now = new Date().toISOString();
  const resolution = {
    status: "test_artifact",
    resolved_at: now,
    resolved_by: "scripts/resolve-test-dlq-artifacts.mjs",
    reason: "Forced PHI_AUDIT_FORCE_FAIL / simulated DLQ proof — not a production incident",
    previous_status: existing.resolved_at ? "resolved" : "open",
    original_error_message: existing.error_message,
    original_created_at: existing.created_at,
    markers: {
      simulated: existing.payload?.simulated === true,
      proof: existing.payload?.proof ?? existing.payload?.row?.metadata?.proof ?? null,
      path: existing.payload?.path ?? null,
      error_message: existing.error_message,
    },
  };
  const nextPayload = { ...(existing.payload || {}), resolution };
  const withCols = {
    payload: nextPayload,
    resolved_at: now,
    status: "test_artifact",
    resolution,
  };
  let { data, error } = await admin
    .from("audit_write_failures")
    .update(withCols)
    .eq("id", id)
    .select("id, resolved_at, status, resolution, payload")
    .maybeSingle();
  if (error && /column|schema cache/i.test(error.message)) {
    ({ data, error } = await admin
      .from("audit_write_failures")
      .update({ payload: nextPayload, resolved_at: now })
      .eq("id", id)
      .select("id, resolved_at, payload")
      .maybeSingle());
  }
  if (error) errors.push({ id, error: error.message });
  else
    resolved.push({
      id,
      previous_resolved_at: existing.resolved_at,
      new_resolved_at: data?.resolved_at ?? now,
      status: "test_artifact",
      reason: resolution.reason,
    });
}

const { data: healthAfter } = await admin.rpc("audit_write_failures_health");
const { data: stillThere } = await admin
  .from("audit_write_failures")
  .select("id, resolved_at, error_message")
  .in("id", KNOWN_TEST_IDS);

// App-layer open count (matches getAuditWriteFailuresHealth fallback)
const { data: allOpen } = await admin
  .from("audit_write_failures")
  .select("id, resolved_at, payload")
  .is("resolved_at", null);

const report = {
  health_before: healthBefore,
  identified: beforeRows,
  resolved,
  errors,
  health_after_rpc: healthAfter,
  historical_rows_retained: stillThere,
  open_unresolved_count: allOpen?.length ?? null,
  pass:
    resolved.length === KNOWN_TEST_IDS.length &&
    (healthAfter?.open_failures === 0 || (allOpen?.length ?? 0) === 0) &&
    (stillThere?.length ?? 0) === KNOWN_TEST_IDS.length &&
    stillThere.every((r) => r.resolved_at != null),
};

writeFileSync("docs/evidence/dlq-test-artifacts-resolved.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
