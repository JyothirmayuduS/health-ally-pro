import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import { authorizeHospitalPersist } from "@/server/hospital-persist-auth";
import { auditRowsToCsv, listPhiAudit, writePhiAudit } from "@/server/phi-audit";

/**
 * PHI access audit list + CSV export for hospital admins / API key ops.
 * GET ?format=json|csv&limit=&since=&resource=
 */
export const Route = createFileRoute("/api/hospital/audit")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const requestedHospitalId = url.searchParams.get("hospitalId");
        const auth = await authorizeHospitalPersist(request, requestedHospitalId);
        if (!auth.ok) {
          return jsonResponse({ error: auth.error }, { status: auth.status });
        }

        // JWT: admins only (api_key / demo allowed for ops & evaluation)
        if (auth.mode === "jwt" && !auth.canProvision) {
          await writePhiAudit({
            hospitalId: auth.hospitalId,
            actorId: auth.userId,
            actorEmail: auth.actorEmail,
            action: "export",
            resource: "audit_logs",
            outcome: "denied",
            request,
          });
          return jsonResponse({ error: "Hospital admin required" }, { status: 403 });
        }

        const format = (url.searchParams.get("format") || "json").toLowerCase();
        const limit = Math.min(Number(url.searchParams.get("limit") || 500) || 500, 5000);
        const since = url.searchParams.get("since") || undefined;
        const resource = url.searchParams.get("resource") || undefined;

        const listed = await listPhiAudit({
          hospitalId: auth.hospitalId,
          limit,
          since,
          resource,
        });

        await writePhiAudit({
          hospitalId: auth.hospitalId,
          actorId: auth.userId,
          actorEmail: auth.actorEmail,
          action: "export",
          resource: "audit_logs",
          metadata: { format, limit, rowCount: listed.data.length },
          outcome: listed.ok ? "success" : "error",
          request,
        });

        if (!listed.ok) {
          return jsonResponse({ ok: false, error: listed.error, data: [] }, { status: 503 });
        }

        if (format === "csv") {
          const csv = auditRowsToCsv(listed.data as Record<string, unknown>[]);
          return new Response(csv, {
            status: 200,
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="medora-phi-audit-${auth.hospitalId.slice(0, 8)}.csv"`,
              "Cache-Control": "no-store",
            },
          });
        }

        return jsonResponse({
          ok: true,
          hospitalId: auth.hospitalId,
          count: listed.data.length,
          data: listed.data,
        });
      },
    },
  },
});
