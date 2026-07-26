import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import { authorizeHospitalPersist } from "@/server/hospital-persist-auth";
import {
  getAuditWriteFailuresHealth,
  resolveAuditWriteFailure,
  resolveTestArtifactFailures,
  writePhiAudit,
} from "@/server/phi-audit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Audit-write DLQ health + resolve (never delete).
 * GET  ?view=health|open
 * POST { action: "resolve"|"ack"|"mark_test_artifact", id?, ids?, reason? }
 */
export const Route = createFileRoute("/api/hospital/audit-dlq")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const auth = await authorizeHospitalPersist(request, url.searchParams.get("hospitalId"));
        if (!auth.ok) return jsonResponse({ error: auth.error }, { status: auth.status });
        if (auth.mode === "jwt" && !auth.canProvision) {
          return jsonResponse({ error: "Hospital admin required" }, { status: 403 });
        }

        const view = url.searchParams.get("view") || "health";
        const health = await getAuditWriteFailuresHealth();

        if (view === "health") {
          return jsonResponse({ ok: true, health });
        }

        const admin = getSupabaseAdmin();
        if (!admin) return jsonResponse({ error: "admin_unavailable" }, { status: 503 });
        type AuditFailureRow = {
          id: string;
          created_at: string;
          error_message: string;
          payload: unknown;
          resolved_at: string | null;
          status?: string;
          resolution?: unknown;
        };
        let data: AuditFailureRow[] | null;
        let error: { message: string } | null;
        ({ data, error } = await admin
          .from("audit_write_failures")
          .select("id, created_at, error_message, payload, resolved_at, status, resolution")
          .is("resolved_at", null)
          .order("created_at", { ascending: true })
          .limit(200));
        if (error && /column|schema cache/i.test(error.message)) {
          ({ data, error } = await admin
            .from("audit_write_failures")
            .select("id, created_at, error_message, payload, resolved_at")
            .is("resolved_at", null)
            .order("created_at", { ascending: true })
            .limit(200));
        }
        if (error) return jsonResponse({ error: error.message }, { status: 500 });
        // Exclude acknowledged/test_artifact stored only in payload until status column exists
        const open = (data ?? []).filter((row) => {
          const status =
            (row as { status?: string; payload?: { resolution?: { status?: string } } }).status ||
            (row as { payload?: { resolution?: { status?: string } } }).payload?.resolution
              ?.status ||
            "open";
          return status === "open";
        });
        return jsonResponse({ ok: true, health, open });
      },
      POST: async ({ request }) => {
        const auth = await authorizeHospitalPersist(request);
        if (!auth.ok) return jsonResponse({ error: auth.error }, { status: auth.status });
        if (auth.mode === "jwt" && !auth.canProvision) {
          return jsonResponse({ error: "Hospital admin required" }, { status: 403 });
        }

        let body: {
          action?: string;
          id?: string;
          ids?: string[];
          reason?: string;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
        }

        const reason = String(body.reason || "").trim() || "ops resolution";
        const resolvedBy = auth.actorEmail || auth.userId || "ops";

        if (body.action === "mark_test_artifact") {
          const result = await resolveTestArtifactFailures({
            ids: body.ids,
            resolvedBy,
            reason,
          });
          await writePhiAudit({
            hospitalId: auth.hospitalId,
            actorId: auth.userId,
            actorEmail: auth.actorEmail,
            action: "resolve_test_artifact",
            resource: "audit_write_failures",
            metadata: { resolved: result.resolved, errors: result.errors },
            request,
          });
          const health = await getAuditWriteFailuresHealth();
          return jsonResponse({ ...result, health });
        }

        if (body.action === "ack" || body.action === "resolve") {
          if (!body.id) return jsonResponse({ error: "id required" }, { status: 400 });
          const status = body.action === "ack" ? "acknowledged" : "resolved";
          const result = await resolveAuditWriteFailure({
            id: body.id,
            status,
            resolvedBy,
            reason,
          });
          await writePhiAudit({
            hospitalId: auth.hospitalId,
            actorId: auth.userId,
            actorEmail: auth.actorEmail,
            action: status,
            resource: "audit_write_failures",
            entityId: body.id,
            metadata: { reason },
            outcome: result.ok ? "success" : "error",
            request,
          });
          const health = await getAuditWriteFailuresHealth();
          return jsonResponse({ ...result, health }, { status: result.ok ? 200 : 400 });
        }

        return jsonResponse({ error: "Unknown action" }, { status: 400 });
      },
    },
  },
});
