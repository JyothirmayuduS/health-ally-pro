import { createFileRoute } from "@tanstack/react-router";
import { optionsResponse } from "@/server/ai/api-auth";
import { productionBootHttpResponse } from "@/server/production-boot";
import { auditAfter, authorize, fail, ok } from "@/server/patient-management/http";
import { newRequestId, withRequestLog } from "@/server/request-log";
import { QueueActionSchema } from "@/lib/opd/schemas";
import { listQueue, transitionQueue } from "@/server/opd/service";

export const Route = createFileRoute("/api/hospital/queue")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;
        const authResult = await authorize(request);
        if (!authResult.ok) return fail(authResult.status, authResult.error);
        const auth = authResult.auth;
        const doctorId = new URL(request.url).searchParams.get("doctorId") ?? undefined;
        const result = await listQueue(auth, doctorId);
        if (!result.ok) return fail(result.status, result.error);
        auditAfter(request, auth, "opd.queue.list", "queue_entries", requestId, {
          count: result.data.length,
        });
        return withRequestLog(request, started, ok(result.data), {
          request_id: requestId,
          hospital_id: auth.hospitalId,
          user_id: auth.userId,
          resource: "queue_entries",
        });
      },
      POST: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;
        const authResult = await authorize(request);
        if (!authResult.ok) return fail(authResult.status, authResult.error);
        const auth = authResult.auth;
        const parsed = QueueActionSchema.safeParse(
          await request.json().catch(() => ({})),
        );
        if (!parsed.success) return fail(400, parsed.error.message);
        const result = await transitionQueue(
          auth,
          parsed.data.queueEntryId,
          parsed.data.action,
        );
        if (!result.ok) {
          auditAfter(
            request,
            auth,
            `opd.queue.${parsed.data.action}_denied`,
            "queue_entries",
            requestId,
            {},
            result.status === 403 ? "denied" : "error",
          );
          return fail(result.status, result.error);
        }
        auditAfter(
          request,
          auth,
          `opd.queue.${parsed.data.action}`,
          "queue_entries",
          requestId,
          { queue_entry_id: parsed.data.queueEntryId },
        );
        return withRequestLog(request, started, ok(result.data), {
          request_id: requestId,
          hospital_id: auth.hospitalId,
          user_id: auth.userId,
          resource: "queue_entries",
        });
      },
    },
  },
});
