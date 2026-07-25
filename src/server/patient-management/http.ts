import { schedulePhiAudit, writePhiAudit } from "@/server/phi-audit";
import { authorizePhiRead, type PhiReadAuth } from "@/server/phi-reads";
import { jsonResponse } from "@/server/ai/api-auth";

export function auditAfter(
  request: Request,
  auth: Pick<PhiReadAuth, "hospitalId" | "userId" | "email">,
  action: string,
  resource: string,
  requestId: string,
  metadata?: Record<string, unknown>,
  outcome: "success" | "denied" | "error" = "success",
) {
  const auditEventId = crypto.randomUUID();
  schedulePhiAudit(
    writePhiAudit({
      hospitalId: auth.hospitalId,
      actorId: auth.userId,
      actorEmail: auth.email,
      action,
      resource,
      outcome,
      metadata: { ...metadata, request_id: requestId, audit_event_id: auditEventId },
      request,
      requestId,
      auditEventId,
    }),
    { requestId, auditEventId },
  );
}

export function fail(status: number, error: string) {
  return jsonResponse({ ok: false, error }, { status });
}

export function ok(data: unknown) {
  return jsonResponse({ ok: true, data });
}

export async function authorize(request: Request) {
  const url = new URL(request.url);
  return authorizePhiRead(request, url.searchParams.get("hospitalId"));
}
