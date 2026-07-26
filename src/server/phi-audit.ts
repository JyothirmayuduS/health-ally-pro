import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_HOSPITAL_ID } from "@/server/hospital-persistence";
import {
  diagnosticModeEnabled,
  getPhiAuditSchedulerHealth,
  inspectWaitUntil,
  isProductionAuditRuntime,
} from "@/server/phi-audit-scheduler";
import { incrementAuditTerminalFailure, newRequestId } from "@/server/request-log";

export type AuditPersistState =
  | "AUDIT_PERSISTED"
  | "AUDIT_DLQ_PERSISTED"
  | "AUDIT_TERMINAL_FAILURE_REPORTED";

export type SchedulePhiAuditMeta = {
  requestId?: string | null;
  auditEventId?: string | null;
};

/**
 * Schedule work after the HTTP response is sent (Cloudflare waitUntil).
 * Production MUST use a real waitUntil — the Vitest no-op stub is forbidden
 * (silent loss of audit + DLQ is a release blocker).
 */
export function schedulePhiAudit(
  task: Promise<unknown>,
  meta: SchedulePhiAuditMeta = {},
): "scheduled" | "scheduler_unavailable_terminal" {
  const inspected = inspectWaitUntil();
  const requestId = meta.requestId ?? null;
  const auditEventId = meta.auditEventId ?? null;

  if (diagnosticModeEnabled()) {
    console.log(
      JSON.stringify({
        msg: "phi_audit_diag",
        audit_context_present: true,
        wait_until_present: inspected.present,
        wait_until_type: inspected.implementation,
        audit_schedule_attempted: true,
        request_id: requestId,
        audit_event_id: auditEventId,
      }),
    );
  }

  const safeTask = Promise.resolve(task).catch((e) => {
    reportTerminalAuditFailure({
      reason: "unhandled_audit_rejection",
      requestId,
      auditEventId,
      error: String(e instanceof Error ? e.message : e).slice(0, 500),
    });
  });

  if (inspected.implementation === "cloudflare" && inspected.waitUntil) {
    inspected.waitUntil(safeTask);
    return "scheduled";
  }

  if (isProductionAuditRuntime()) {
    reportTerminalAuditFailure({
      reason: "waituntil_unavailable",
      requestId,
      auditEventId,
      wait_until_type: inspected.implementation,
    });
    void enqueueSchedulerUnavailableFailure({
      requestId,
      auditEventId,
      waitUntilType: inspected.implementation,
    });
    return "scheduler_unavailable_terminal";
  }

  // Node / Vitest / Docker preview: process stays alive; allow microtask completion.
  void safeTask;
  return "scheduled";
}

export function newAuditEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function reportTerminalAuditFailure(payload: Record<string, unknown>): void {
  incrementAuditTerminalFailure();
  console.error(
    JSON.stringify({
      level: "critical",
      msg: "phi_audit_terminal_failure",
      service: "medora",
      ...payload,
    }),
  );
}

async function enqueueSchedulerUnavailableFailure(opts: {
  requestId: string | null;
  auditEventId: string | null;
  waitUntilType: string;
}): Promise<void> {
  try {
    await enqueueAuditFailure("waituntil_unavailable", {
      audit_event_id: opts.auditEventId,
      request_id: opts.requestId,
      wait_until_type: opts.waitUntilType,
      path: "schedulePhiAudit",
    });
  } catch (e) {
    reportTerminalAuditFailure({
      reason: "scheduler_dlq_failed",
      requestId: opts.requestId,
      auditEventId: opts.auditEventId,
      error: String(e instanceof Error ? e.message : e).slice(0, 500),
    });
  }
}

export { getPhiAuditSchedulerHealth, diagnosticModeEnabled, inspectWaitUntil };

export type PhiAuditEntry = {
  hospitalId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  entityType?: string | null;
  entityId?: string | null;
  outcome?: "success" | "denied" | "error";
  metadata?: Record<string, unknown>;
  request?: Request;
};

function clientIp(request?: Request): string | null {
  if (!request) return null;
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

function forceFailEnabled(): boolean {
  const v = process.env.PHI_AUDIT_FORCE_FAIL;
  return v === "1" || v === "true";
}

async function enqueueAuditFailure(
  errorMessage: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("[Medora PHI Audit] DLQ unavailable; original error:", errorMessage);
    return { ok: false, error: "admin_unavailable" };
  }
  const { error } = await admin.from("audit_write_failures").insert({
    error_message: errorMessage.slice(0, 2000),
    payload,
  });
  if (error) {
    console.error(
      "[Medora PHI Audit] DLQ insert failed:",
      error.message,
      "original:",
      errorMessage,
    );
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Core clinical PHI tables that require per-record read IDs in audit metadata. */
export const CORE_PHI_RECORD_TABLES = [
  "patients",
  "appointments",
  "lab_results",
  "patient_medications",
] as const;

export type CorePhiRecordTable = (typeof CORE_PHI_RECORD_TABLES)[number];

/** Extract UUID ids from a PHI read payload (array or single row). */
export function extractPhiRecordIds(data: unknown): string[] {
  if (data == null) return [];
  const rows = Array.isArray(data) ? data : [data];
  const ids: string[] = [];
  for (const row of rows) {
    if (row && typeof row === "object" && "id" in row) {
      const id = String((row as { id: unknown }).id ?? "");
      if (/^[0-9a-f-]{36}$/i.test(id)) ids.push(id);
    }
  }
  return ids;
}

/**
 * Async record-level read audit for core PHI tables.
 * Logs every returned record id in metadata.record_ids (not count-only).
 * Same fire-and-forget + DLQ path as writePhiAudit — caller must schedule via schedulePhiAudit.
 */
export async function writeRecordLevelPhiReadAudit(opts: {
  table: CorePhiRecordTable;
  recordIds: string[];
  hospitalId: string;
  actorId: string;
  actorEmail: string | null;
  actorRole: "staff" | "patient";
  request?: Request;
  requestId?: string | null;
  auditEventId?: string | null;
  extraMetadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string; state: AuditPersistState; auditEventId: string }> {
  const ids = opts.recordIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const requestId = opts.requestId ?? (opts.request ? newRequestId(opts.request) : null);
  const auditEventId = opts.auditEventId ?? newAuditEventId();
  return writePhiAudit({
    hospitalId: opts.hospitalId,
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    action: "read",
    resource: opts.table,
    entityType: opts.table,
    entityId: ids.length === 1 ? ids[0] : null,
    metadata: {
      record_level: true,
      record_ids: ids,
      count: ids.length,
      actor_role: opts.actorRole,
      request_id: requestId,
      audit_event_id: auditEventId,
      ...opts.extraMetadata,
    },
    request: opts.request,
    auditEventId,
    requestId,
  });
}

/** Fire-and-forget PHI / clinical access audit (service role). Failures go to audit_write_failures. */
export async function writePhiAudit(
  entry: PhiAuditEntry & { auditEventId?: string | null; requestId?: string | null },
): Promise<{ ok: boolean; error?: string; state: AuditPersistState; auditEventId: string }> {
  const auditEventId = entry.auditEventId ?? newAuditEventId();
  const requestId =
    entry.requestId ??
    (entry.metadata && typeof entry.metadata.request_id === "string"
      ? entry.metadata.request_id
      : entry.request
        ? newRequestId(entry.request)
        : null);

  if (diagnosticModeEnabled()) {
    console.log(
      JSON.stringify({
        msg: "phi_audit_diag",
        audit_write_started: true,
        request_id: requestId,
        audit_event_id: auditEventId,
        resource: entry.resource,
        action: entry.action,
      }),
    );
  }

  const admin = getSupabaseAdmin();
  const metadata = {
    ...(entry.metadata ?? {}),
    audit_event_id: auditEventId,
    request_id:
      requestId ?? (entry.metadata as { request_id?: string } | undefined)?.request_id ?? null,
  };

  const row = {
    hospital_id: entry.hospitalId || DEFAULT_HOSPITAL_ID,
    actor_id: entry.actorId && /^[0-9a-f-]{36}$/i.test(entry.actorId) ? entry.actorId : null,
    actor_email: entry.actorEmail ?? null,
    action: entry.action,
    resource: entry.resource,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId && /^[0-9a-f-]{36}$/i.test(entry.entityId) ? entry.entityId : null,
    outcome: entry.outcome ?? "success",
    metadata,
    ip: clientIp(entry.request),
    user_agent: entry.request?.headers.get("user-agent")?.slice(0, 500) ?? null,
  };

  const dlqPayload = {
    audit_event_id: auditEventId,
    request_id: requestId,
    path: "writePhiAudit",
    row_fingerprint: {
      hospital_id: row.hospital_id,
      actor_id: row.actor_id,
      action: row.action,
      resource: row.resource,
      outcome: row.outcome,
      record_count:
        metadata && typeof metadata === "object" && "count" in metadata
          ? Number((metadata as { count?: number }).count ?? 0)
          : undefined,
    },
  };

  if (!admin) {
    const dlq = await enqueueAuditFailure("admin_unavailable", {
      ...dlqPayload,
      entry_keys: Object.keys(entry),
    });
    if (dlq.ok) {
      return { ok: false, error: "admin_unavailable", state: "AUDIT_DLQ_PERSISTED", auditEventId };
    }
    reportTerminalAuditFailure({
      reason: "primary_and_dlq_failed",
      requestId,
      auditEventId,
      primary_error: "admin_unavailable",
      dlq_error: dlq.error,
    });
    return {
      ok: false,
      error: "admin_unavailable",
      state: "AUDIT_TERMINAL_FAILURE_REPORTED",
      auditEventId,
    };
  }

  try {
    if (forceFailEnabled()) {
      throw new Error("PHI_AUDIT_FORCE_FAIL");
    }
    const { error } = await admin.from("audit_logs").insert(row);
    if (error) {
      const dlq = await enqueueAuditFailure(error.message, {
        ...dlqPayload,
        supabase_error: error.message,
      });
      if (dlq.ok) {
        return { ok: false, error: error.message, state: "AUDIT_DLQ_PERSISTED", auditEventId };
      }
      reportTerminalAuditFailure({
        reason: "primary_and_dlq_failed",
        requestId,
        auditEventId,
        primary_error: error.message,
        dlq_error: dlq.error,
      });
      return {
        ok: false,
        error: error.message,
        state: "AUDIT_TERMINAL_FAILURE_REPORTED",
        auditEventId,
      };
    }
    if (diagnosticModeEnabled()) {
      console.log(
        JSON.stringify({
          msg: "phi_audit_diag",
          audit_write_completed: true,
          request_id: requestId,
          audit_event_id: auditEventId,
        }),
      );
    }
    return { ok: true, state: "AUDIT_PERSISTED", auditEventId };
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    const dlq = await enqueueAuditFailure(msg, { ...dlqPayload, caught: true });
    if (dlq.ok) {
      return { ok: false, error: msg, state: "AUDIT_DLQ_PERSISTED", auditEventId };
    }
    reportTerminalAuditFailure({
      reason: "primary_and_dlq_failed",
      requestId,
      auditEventId,
      primary_error: msg,
      dlq_error: dlq.error,
    });
    return { ok: false, error: msg, state: "AUDIT_TERMINAL_FAILURE_REPORTED", auditEventId };
  }
}

export async function listPhiAudit(opts: {
  hospitalId: string;
  limit?: number;
  since?: string;
  resource?: string;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "admin_unavailable", data: [] as unknown[] };

  let q = admin
    .from("audit_logs")
    .select("*")
    .eq("hospital_id", opts.hospitalId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 500);

  if (opts.since) q = q.gte("created_at", opts.since);
  if (opts.resource) q = q.eq("resource", opts.resource);

  const { data, error } = await q;
  if (error) return { ok: false as const, error: error.message, data: [] as unknown[] };
  return { ok: true as const, data: data ?? [] };
}

export type AuditDlqStatus = "open" | "acknowledged" | "resolved" | "test_artifact";

export type AuditDlqResolution = {
  status: AuditDlqStatus;
  resolved_at: string | null;
  resolved_by: string;
  reason: string;
  previous_status?: string;
  original_error_message?: string;
  original_created_at?: string;
};

function payloadStatus(payload: Record<string, unknown> | null | undefined): AuditDlqStatus {
  const res = (payload?.resolution ?? {}) as Record<string, unknown>;
  const s = String(res.status ?? payload?.status ?? "open");
  if (s === "acknowledged" || s === "resolved" || s === "test_artifact" || s === "open") return s;
  return "open";
}

/** Health: prefer database RPC after migration; app-layer only as fallback. */
export async function getAuditWriteFailuresHealth(): Promise<{
  ok: boolean;
  alert: boolean;
  open_failures: number;
  acknowledged_failures: number;
  resolved_or_artifact: number;
  checked_at: string;
  source: "database_rpc" | "app_layer" | "unavailable";
  error?: string;
}> {
  const admin = getSupabaseAdmin();
  const checked_at = new Date().toISOString();
  if (!admin) {
    return {
      ok: false,
      alert: true,
      open_failures: -1,
      acknowledged_failures: 0,
      resolved_or_artifact: 0,
      checked_at,
      source: "unavailable",
      error: "admin_unavailable",
    };
  }

  // Prefer database RPC when enriched health is available (post-migration).
  // Only report source=database_rpc when the RPC call succeeds.
  const rpc = await admin.rpc("audit_write_failures_health");
  if (!rpc.error && rpc.data && typeof rpc.data === "object") {
    const d = rpc.data as Record<string, unknown>;
    const enriched =
      "acknowledged_failures" in d || "resolved_or_artifact" in d || d.source === "database_rpc";
    if (enriched) {
      return {
        ok: Boolean(d.ok),
        alert: Boolean(d.alert),
        open_failures: Number(d.open_failures ?? 0),
        acknowledged_failures: Number(d.acknowledged_failures ?? 0),
        resolved_or_artifact: Number(d.resolved_or_artifact ?? 0),
        checked_at: String(d.checked_at ?? checked_at),
        source: "database_rpc",
      };
    }
    // Legacy RPC (resolved_at-only): still use it for open count, label honestly
    return {
      ok: Boolean(d.ok),
      alert: Boolean(d.alert),
      open_failures: Number(d.open_failures ?? 0),
      acknowledged_failures: 0,
      resolved_or_artifact: 0,
      checked_at: String(d.checked_at ?? checked_at),
      source: "database_rpc",
    };
  }

  // Fallback: app-layer scan (pre-migration / RPC unavailable)
  const withStatus = await admin
    .from("audit_write_failures")
    .select("id, resolved_at, payload, status, resolution")
    .limit(5000);
  const select =
    withStatus.error && /column|schema cache/i.test(withStatus.error.message)
      ? await admin.from("audit_write_failures").select("id, resolved_at, payload").limit(5000)
      : withStatus;
  if (select.error) {
    return {
      ok: false,
      alert: true,
      open_failures: -1,
      acknowledged_failures: 0,
      resolved_or_artifact: 0,
      checked_at,
      source: "unavailable",
      error: select.error.message,
    };
  }

  let open = 0;
  let acked = 0;
  let done = 0;
  for (const row of select.data ?? []) {
    const r = row as {
      resolved_at: string | null;
      payload?: Record<string, unknown>;
      status?: string;
      resolution?: Record<string, unknown>;
    };
    const status =
      (r.status as AuditDlqStatus | undefined) ||
      (r.resolution?.status as AuditDlqStatus | undefined) ||
      payloadStatus(r.payload);
    if (status === "resolved" || status === "test_artifact") {
      done += 1;
    } else if (status === "acknowledged") {
      acked += 1;
    } else if (!r.resolved_at) {
      open += 1;
    } else {
      done += 1;
    }
  }

  return {
    ok: open === 0,
    alert: open > 0,
    open_failures: open,
    acknowledged_failures: acked,
    resolved_or_artifact: done,
    checked_at,
    source: "app_layer",
  };
}

/**
 * Acknowledge / resolve / mark test_artifact. Never deletes the row.
 * Works with or without the status column migration (falls back to payload + resolved_at).
 */
export async function resolveAuditWriteFailure(opts: {
  id: string;
  status: "acknowledged" | "resolved" | "test_artifact";
  resolvedBy: string;
  reason: string;
}): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "admin_unavailable" };

  const rpc = await admin.rpc("resolve_audit_write_failure", {
    p_id: opts.id,
    p_status: opts.status,
    p_resolved_by: opts.resolvedBy,
    p_reason: opts.reason,
  });
  if (!rpc.error && rpc.data) {
    return { ok: true, data: rpc.data as Record<string, unknown> };
  }

  const { data: existing, error: fetchErr } = await admin
    .from("audit_write_failures")
    .select("*")
    .eq("id", opts.id)
    .maybeSingle();
  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!existing) return { ok: false, error: "not_found" };

  const now = new Date().toISOString();
  const resolution: AuditDlqResolution = {
    status: opts.status,
    resolved_at: opts.status === "acknowledged" ? null : now,
    resolved_by: opts.resolvedBy,
    reason: opts.reason,
    previous_status: payloadStatus(existing.payload as Record<string, unknown>),
    original_error_message: existing.error_message,
    original_created_at: existing.created_at,
  };

  const nextPayload = {
    ...(existing.payload as Record<string, unknown>),
    resolution,
  };

  const patch: Record<string, unknown> = {
    payload: nextPayload,
    resolved_at: opts.status === "acknowledged" ? null : now,
  };
  // status/resolution columns may not exist pre-migration — try with, then without
  const withCols = { ...patch, status: opts.status, resolution };
  let { data, error } = await admin
    .from("audit_write_failures")
    .update(withCols)
    .eq("id", opts.id)
    .select("*")
    .maybeSingle();
  if (error && /column|schema cache/i.test(error.message)) {
    ({ data, error } = await admin
      .from("audit_write_failures")
      .update(patch)
      .eq("id", opts.id)
      .select("*")
      .maybeSingle());
  }
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? {}) as Record<string, unknown> };
}

/** Mark forced-failure test DLQ rows as test_artifact (idempotent by id or markers). */
export async function resolveTestArtifactFailures(opts: {
  ids?: string[];
  resolvedBy: string;
  reason: string;
}): Promise<{ ok: boolean; resolved: string[]; errors: string[] }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, resolved: [], errors: ["admin_unavailable"] };

  const resolved: string[] = [];
  const errors: string[] = [];

  if (opts.ids?.length) {
    for (const id of opts.ids) {
      const r = await resolveAuditWriteFailure({
        id,
        status: "test_artifact",
        resolvedBy: opts.resolvedBy,
        reason: opts.reason,
      });
      if (r.ok) resolved.push(id);
      else errors.push(`${id}: ${r.error}`);
    }
    return { ok: errors.length === 0, resolved, errors };
  }

  const { data, error } = await admin
    .from("audit_write_failures")
    .select("id, error_message, payload, resolved_at")
    .is("resolved_at", null)
    .limit(500);
  if (error) return { ok: false, resolved: [], errors: [error.message] };

  for (const row of data ?? []) {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const isTest =
      row.error_message === "PHI_AUDIT_FORCE_FAIL" ||
      payload.simulated === true ||
      payload.path === "writeRecordLevelPhiReadAudit" ||
      String((payload.row as { actor_email?: string } | undefined)?.actor_email ?? "").includes(
        "dlq-proof@",
      ) ||
      Boolean((payload as { proof?: string }).proof) ||
      Boolean((payload.row as { metadata?: { proof?: string } } | undefined)?.metadata?.proof);
    if (!isTest) continue;
    const r = await resolveAuditWriteFailure({
      id: row.id,
      status: "test_artifact",
      resolvedBy: opts.resolvedBy,
      reason: opts.reason,
    });
    if (r.ok) resolved.push(row.id);
    else errors.push(`${row.id}: ${r.error}`);
  }
  return { ok: errors.length === 0, resolved, errors };
}

export function auditRowsToCsv(rows: Record<string, unknown>[]): string {
  const headers = [
    "created_at",
    "hospital_id",
    "actor_email",
    "actor_id",
    "action",
    "resource",
    "entity_type",
    "entity_id",
    "outcome",
    "ip",
    "user_agent",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}
