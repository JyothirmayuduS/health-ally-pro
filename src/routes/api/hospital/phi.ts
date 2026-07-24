import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import {
  extractPhiRecordIds,
  schedulePhiAudit,
  writePhiAudit,
  writeRecordLevelPhiReadAudit,
  type CorePhiRecordTable,
} from "@/server/phi-audit";
import { productionBootHttpResponse } from "@/server/production-boot";
import { newRequestId, withRequestLog } from "@/server/request-log";
import {
  authorizePhiRead,
  getLabFindings,
  getLabItemsForReport,
  getPatientForUser,
  getProfileBasics,
  listAppointmentsForAuth,
  listLabResultsForAuth,
  listMembershipsForAuth,
  listPatientMedicationsForAuth,
  listQueueEntriesForAuth,
  listStaffProfiles,
  type PhiReadAuth,
} from "@/server/phi-reads";
import {
  listClinicalResource,
  upsertClinicalResource,
  type ClinicalResource,
} from "@/server/clinical-phi";

/** Schedule audit after response body is ready — must not block the HTTP response. */
function auditAfter(
  request: Request,
  auth: { hospitalId: string; userId: string; email: string | null },
  action: string,
  resource: string,
  metadata?: Record<string, unknown>,
) {
  schedulePhiAudit(
    writePhiAudit({
      hospitalId: auth.hospitalId,
      actorId: auth.userId,
      actorEmail: auth.email,
      action,
      resource,
      metadata,
      request,
    }),
  );
}

/** Core PHI tables: async per-record-id audit (waitUntil — never blocks HTTP return). */
function auditCorePhiRead(
  request: Request,
  auth: PhiReadAuth,
  table: CorePhiRecordTable,
  data: unknown,
  extraMetadata?: Record<string, unknown>,
) {
  schedulePhiAudit(
    writeRecordLevelPhiReadAudit({
      table,
      recordIds: extractPhiRecordIds(data),
      hospitalId: auth.hospitalId,
      actorId: auth.userId,
      actorEmail: auth.email,
      actorRole: auth.isStaff ? "staff" : "patient",
      request,
      extraMetadata,
    }),
  );
}

function ok(data: unknown) {
  return jsonResponse({ ok: true, data });
}

export const Route = createFileRoute("/api/hospital/phi")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        const url = new URL(request.url);
        const resource = url.searchParams.get("resource");
        const requestedHospitalId = url.searchParams.get("hospitalId");
        const reportLegacyId = url.searchParams.get("reportLegacyId");

        const finish = (
          res: Response,
          extras?: {
            hospital_id?: string | null;
            user_id?: string | null;
            role?: string | null;
            resource?: string | null;
            error_code?: string | null;
          },
        ) =>
          withRequestLog(request, started, res, {
            request_id: requestId,
            correlation_id: requestId,
            hospital_id: extras?.hospital_id ?? null,
            tenant_id: extras?.hospital_id ?? null,
            user_id: extras?.user_id ?? null,
            role: extras?.role ?? null,
            resource: extras?.resource ?? resource ?? null,
            error_code: extras?.error_code ?? null,
          });

        if (blocked) return finish(blocked);

        const authz = await authorizePhiRead(request, requestedHospitalId);
        if (!authz.ok) {
          return finish(jsonResponse({ error: authz.error }, { status: authz.status }), {
            error_code:
              authz.status === 403
                ? "cross_tenant"
                : authz.status === 401
                  ? "auth_failed"
                  : authz.error,
          });
        }
        const { auth } = authz;
        const authMeta = {
          hospital_id: auth.hospitalId,
          user_id: auth.userId,
          role: auth.isStaff ? "staff" : "patient",
          resource: resource ?? null,
        };

        switch (resource) {
          case "staff_profiles": {
            const res = await listStaffProfiles(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditAfter(request, auth, "read", "staff_profiles", { count: res.data.length });
            return finish(response, authMeta);
          }
          case "patients": {
            const res = await getPatientForUser(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditCorePhiRead(request, auth, "patients", res.data);
            return finish(response, authMeta);
          }
          case "patient_profile": {
            const patient = await getPatientForUser(auth);
            const profile = await getProfileBasics(auth.userId);
            const row = Array.isArray(patient.data) ? patient.data[0] : patient.data;
            const response = ok({ profile, patient: row });
            auditCorePhiRead(request, auth, "patients", row, { view: "profile" });
            return finish(response, authMeta);
          }
          case "appointments": {
            const res = await listAppointmentsForAuth(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditCorePhiRead(request, auth, "appointments", res.data);
            return finish(response, authMeta);
          }
          case "lab_results": {
            const res = await listLabResultsForAuth(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditCorePhiRead(request, auth, "lab_results", res.data);
            return finish(response, authMeta);
          }
          case "lab_findings": {
            const res = await getLabFindings(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditAfter(request, auth, "read", "lab_results", {
              view: "findings",
              count: res.data.length,
            });
            return finish(response, authMeta);
          }
          case "lab_items": {
            if (!reportLegacyId) {
              return finish(
                jsonResponse({ error: "reportLegacyId required" }, { status: 400 }),
                authMeta,
              );
            }
            const res = await getLabItemsForReport(auth, reportLegacyId);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditAfter(request, auth, "read", "lab_results", {
              view: "items",
              reportLegacyId,
              count: res.data.length,
            });
            return finish(response, authMeta);
          }
          case "patient_medications": {
            const res = await listPatientMedicationsForAuth(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditCorePhiRead(request, auth, "patient_medications", res.data);
            return finish(response, authMeta);
          }
          case "hospital_memberships": {
            const res = await listMembershipsForAuth(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditAfter(request, auth, "read", "hospital_memberships", { count: res.data.length });
            return finish(response, authMeta);
          }
          case "queue_entries": {
            const res = await listQueueEntriesForAuth(auth);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditAfter(request, auth, "read", "queue_entries", { count: res.data.length });
            return finish(response, authMeta);
          }
          case "encounters":
          case "invoices":
          case "payments":
          case "lab_orders":
          case "prescriptions":
          case "notifications":
          case "branches":
          case "vitals_readings":
          case "beds":
          case "admissions":
          case "ot_rooms":
          case "ot_cases": {
            const res = await listClinicalResource(auth, resource as ClinicalResource);
            if (res.error)
              return finish(jsonResponse({ error: res.error }, { status: 500 }), authMeta);
            const response = ok(res.data);
            auditAfter(request, auth, "read", resource, { count: res.data.length });
            return finish(response, authMeta);
          }
          default:
            return finish(
              jsonResponse(
                {
                  error: "Unknown resource",
                  allowed: [
                    "staff_profiles",
                    "patients",
                    "patient_profile",
                    "appointments",
                    "lab_results",
                    "lab_findings",
                    "lab_items",
                    "patient_medications",
                    "hospital_memberships",
                    "queue_entries",
                    "encounters",
                    "invoices",
                    "payments",
                    "lab_orders",
                    "prescriptions",
                    "notifications",
                    "branches",
                    "vitals_readings",
                    "beds",
                    "admissions",
                    "ot_rooms",
                    "ot_cases",
                  ],
                },
                { status: 400 },
              ),
              authMeta,
            );
        }
      },
      POST: async ({ request }) => {
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const authz = await authorizePhiRead(request);
        if (!authz.ok) {
          return jsonResponse({ error: authz.error }, { status: authz.status });
        }
        const { auth } = authz;

        let body: {
          resource?: ClinicalResource;
          rows?: Array<{ legacy_id: string; payload: Record<string, unknown> }>;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body.resource || !body.rows?.length) {
          return jsonResponse({ error: "resource and rows required" }, { status: 400 });
        }

        const res = await upsertClinicalResource(auth, body.resource, body.rows);
        if (res.error) return jsonResponse({ error: res.error }, { status: 500 });
        auditAfter(request, auth, "upsert", body.resource, { count: body.rows.length });
        return ok(res.data);
      },
    },
  },
});
