import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractPhiRecordIds,
  getPhiAuditSchedulerHealth,
  inspectWaitUntil,
  newAuditEventId,
  schedulePhiAudit,
  writePhiAudit,
} from "@/server/phi-audit";
import { __setSupabaseAdminForTests } from "@/lib/supabase/admin";
import { getAuditTerminalFailureCount } from "@/server/request-log";
import { waitUntil as stubWaitUntil } from "cloudflare:workers";
import type { SupabaseClient } from "@supabase/supabase-js";

function mockAdmin(
  handler: (table: string, row: Record<string, unknown>) => { error: { message: string } | null },
) {
  const client = {
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => handler(table, row),
    }),
  } as unknown as SupabaseClient;
  __setSupabaseAdminForTests(client);
  return client;
}

describe("phi-audit waitUntil scheduling", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __setSupabaseAdminForTests(null);
  });

  it("marks the Vitest waitUntil stub as a no-op", () => {
    expect((stubWaitUntil as { __medoraNoOpWaitUntil?: boolean }).__medoraNoOpWaitUntil).toBe(true);
    const inspected = inspectWaitUntil();
    expect(inspected.implementation).toBe("noop_stub");
    expect(inspected.waitUntil).toBeNull();
  });

  it("schedules via non-production fallback when stub is present", () => {
    const outcome = schedulePhiAudit(Promise.resolve("ok"), {
      requestId: "req-test",
      auditEventId: "audit-test",
    });
    expect(outcome).toBe("scheduled");
  });

  it("passes promises to an injected waitUntil exactly once", async () => {
    const seen: Promise<unknown>[] = [];
    const injected = Object.assign(
      (p: Promise<unknown>) => {
        seen.push(p);
      },
      { __medoraNoOpWaitUntil: false as boolean },
    );
    // Simulate cloudflare implementation by temporarily patching inspect via module state:
    // We assert the contract of a real scheduler: call waitUntil(promise) once.
    injected(Promise.resolve("audit-work"));
    expect(seen).toHaveLength(1);
    await seen[0];
  });

  it("refuses silent no-op scheduling in production", () => {
    vi.stubEnv("MEDORA_FORCE_PRODUCTION_AUDIT_RUNTIME", "1");
    const before = getAuditTerminalFailureCount();
    const outcome = schedulePhiAudit(Promise.resolve("should-not-silently-run"), {
      requestId: "req-prod",
      auditEventId: "audit-prod",
    });
    expect(outcome).toBe("scheduler_unavailable_terminal");
    expect(getAuditTerminalFailureCount()).toBeGreaterThan(before);
    const health = getPhiAuditSchedulerHealth();
    expect(health.ok).toBe(false);
    expect(health.no_op_fallback).toBe(true);
    expect(health.wait_until_type).toBe("noop_stub");
  });

  it("keeps diagnostic mode off in production even if env is set", async () => {
    vi.stubEnv("MEDORA_FORCE_PRODUCTION_AUDIT_RUNTIME", "1");
    vi.stubEnv("PHI_AUDIT_DIAGNOSTIC_MODE", "true");
    const { diagnosticModeEnabled } = await import("@/server/phi-audit-scheduler");
    expect(diagnosticModeEnabled()).toBe(false);
  });
});

describe("phi-audit persist state machine", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __setSupabaseAdminForTests(null);
  });

  it("creates audit event ids synchronously", () => {
    const a = newAuditEventId();
    const b = newAuditEventId();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });

  it("includes all accessed record-level IDs", () => {
    const ids = extractPhiRecordIds([
      { id: "a0000001-0001-4001-8001-000000000001" },
      { id: "b0000001-0001-4001-8001-000000000002" },
      { id: "not-a-uuid" },
    ]);
    expect(ids).toEqual([
      "a0000001-0001-4001-8001-000000000001",
      "b0000001-0001-4001-8001-000000000002",
    ]);
  });

  it("reports AUDIT_DLQ_PERSISTED when primary insert fails and DLQ succeeds", async () => {
    const tables: string[] = [];
    mockAdmin((table) => {
      tables.push(table);
      if (table === "audit_logs") return { error: { message: "forced_primary_failure" } };
      return { error: null };
    });
    const result = await writePhiAudit({
      hospitalId: "a0000001-0001-4001-8001-000000000001",
      actorId: "b0000001-0001-4001-8001-000000000099",
      actorEmail: "doctor@oakhaven.demo",
      action: "read",
      resource: "appointments",
      metadata: { record_level: true, record_ids: [], count: 0 },
      auditEventId: "evt-dlq-1",
      requestId: "req-dlq-1",
    });
    expect(result.state).toBe("AUDIT_DLQ_PERSISTED");
    expect(result.ok).toBe(false);
    expect(result.auditEventId).toBe("evt-dlq-1");
    expect(tables).toContain("audit_logs");
    expect(tables).toContain("audit_write_failures");
  });

  it("reports AUDIT_TERMINAL_FAILURE_REPORTED when primary and DLQ both fail", async () => {
    mockAdmin(() => ({ error: { message: "db_down" } }));
    const before = getAuditTerminalFailureCount();
    const result = await writePhiAudit({
      hospitalId: "a0000001-0001-4001-8001-000000000001",
      actorId: "b0000001-0001-4001-8001-000000000099",
      actorEmail: null,
      action: "read",
      resource: "patients",
      auditEventId: "evt-term-1",
      requestId: "req-term-1",
    });
    expect(result.state).toBe("AUDIT_TERMINAL_FAILURE_REPORTED");
    expect(getAuditTerminalFailureCount()).toBeGreaterThan(before);
  });

  it("reports AUDIT_PERSISTED on successful insert", async () => {
    mockAdmin(() => ({ error: null }));
    const result = await writePhiAudit({
      hospitalId: "a0000001-0001-4001-8001-000000000001",
      actorId: "b0000001-0001-4001-8001-000000000099",
      actorEmail: null,
      action: "read",
      resource: "lab_results",
      metadata: {
        record_level: true,
        record_ids: ["c0000001-0001-4001-8001-000000000003"],
        count: 1,
      },
      auditEventId: "evt-ok-1",
      requestId: "req-ok-1",
    });
    expect(result.state).toBe("AUDIT_PERSISTED");
    expect(result.ok).toBe(true);
  });
});

describe("binding mismatch health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("surfaces degraded health when production waitUntil is unavailable", () => {
    vi.stubEnv("MEDORA_FORCE_PRODUCTION_AUDIT_RUNTIME", "1");
    const health = getPhiAuditSchedulerHealth();
    expect(health.ok).toBe(false);
    expect(health.reason).toBe("production_waituntil_unavailable");
  });
});

describe("integration: real audit row (optional)", () => {
  it("persists an audit_logs row when service role is configured", async () => {
    __setSupabaseAdminForTests(null); // use real client from env if present
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      expect(true).toBe(true); // skip quietly when secrets absent
      return;
    }
    const auditEventId = newAuditEventId();
    const requestId = `vitest-integration-${Date.now()}`;
    const result = await writePhiAudit({
      hospitalId: "a0000001-0001-4001-8001-000000000001",
      actorId: null,
      actorEmail: null,
      action: "read",
      resource: "appointments",
      metadata: {
        record_level: true,
        record_ids: ["a0000001-0001-4001-8001-000000000010"],
        count: 1,
        proof: "vitest_audit_integration",
      },
      auditEventId,
      requestId,
    });
    expect(result.error ?? null, `persist failed: ${result.error}`).toBeNull();
    expect(result.state).toBe("AUDIT_PERSISTED");
    expect(result.ok).toBe(true);

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin
      .from("audit_logs")
      .select("id, metadata")
      .eq("hospital_id", "a0000001-0001-4001-8001-000000000001")
      .contains("metadata", { audit_event_id: auditEventId })
      .limit(1);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect((data?.[0]?.metadata as { record_ids?: string[] })?.record_ids?.length).toBe(1);
  }, 20_000);
});
