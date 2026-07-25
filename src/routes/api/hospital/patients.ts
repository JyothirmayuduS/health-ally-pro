import { createFileRoute } from "@tanstack/react-router";
import { optionsResponse } from "@/server/ai/api-auth";
import { productionBootHttpResponse } from "@/server/production-boot";
import { newRequestId, withRequestLog } from "@/server/request-log";
import {
  PatientSearchSchema,
  QrResolveSchema,
  RegisterPatientSchema,
} from "@/lib/patient-management/schemas";
import {
  listConsentTemplates,
  registerPatient,
  resolveQrToken,
  searchPatients,
} from "@/server/patient-management/service";
import { auditAfter, authorize, fail, ok } from "@/server/patient-management/http";

export const Route = createFileRoute("/api/hospital/patients")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "search";

        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
            error_code: "auth",
          });
        }
        const auth = authResult.auth;

        if (action === "templates") {
          const result = await listConsentTemplates(auth);
          if (!result.ok) {
            auditAfter(request, auth, "consent_templates_denied", "patient_management", requestId, {}, "denied");
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
              hospital_id: auth.hospitalId,
              user_id: auth.userId,
            });
          }
          auditAfter(request, auth, "consent_templates_list", "patient_management", requestId);
          return withRequestLog(request, started, ok(result.data), {
            request_id: requestId,
            hospital_id: auth.hospitalId,
            user_id: auth.userId,
            resource: "consent_templates",
          });
        }

        const parsed = PatientSearchSchema.safeParse({
          q: url.searchParams.get("q") ?? undefined,
          page: url.searchParams.get("page") ?? 1,
          pageSize: url.searchParams.get("pageSize") ?? 20,
          status: url.searchParams.get("status") ?? undefined,
        });
        if (!parsed.success) {
          return withRequestLog(request, started, fail(400, parsed.error.message), {
            request_id: requestId,
          });
        }
        const result = await searchPatients(auth, parsed.data);
        if (!result.ok) {
          auditAfter(request, auth, "patient_search_denied", "patients", requestId, {}, "denied");
          return withRequestLog(request, started, fail(result.status, result.error), {
            request_id: requestId,
            hospital_id: auth.hospitalId,
            user_id: auth.userId,
          });
        }
        auditAfter(request, auth, "patient_search", "patients", requestId, {
          result_count: result.data.total,
          page: result.data.page,
        });
        return withRequestLog(request, started, ok(result.data), {
          request_id: requestId,
          hospital_id: auth.hospitalId,
          user_id: auth.userId,
          resource: "patients",
        });
      },

      POST: async ({ request }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "register";

        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
            error_code: "auth",
          });
        }
        const auth = authResult.auth;

        if (action === "resolve_qr") {
          const body = await request.json().catch(() => ({}));
          const parsed = QrResolveSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await resolveQrToken(auth, parsed.data.token);
          if (!result.ok) {
            auditAfter(
              request,
              auth,
              "patient_qr_resolve_denied",
              "patient_qr_tokens",
              requestId,
              {},
              "denied",
            );
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
              hospital_id: auth.hospitalId,
              user_id: auth.userId,
            });
          }
          auditAfter(request, auth, "patient_qr_resolve", "patient_qr_tokens", requestId, {
            patient_id: result.data.patient.id,
          });
          return withRequestLog(request, started, ok(result.data), {
            request_id: requestId,
            hospital_id: auth.hospitalId,
            user_id: auth.userId,
            resource: "patient_qr_tokens",
          });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = RegisterPatientSchema.safeParse(body);
        if (!parsed.success) {
          return withRequestLog(request, started, fail(400, parsed.error.message), {
            request_id: requestId,
          });
        }
        const result = await registerPatient(auth, parsed.data);
        if (!result.ok) {
          auditAfter(request, auth, "patient_register_denied", "patients", requestId, {}, "denied");
          return withRequestLog(request, started, fail(result.status, result.error), {
            request_id: requestId,
            hospital_id: auth.hospitalId,
            user_id: auth.userId,
          });
        }
        const isDuplicateBlock = Boolean(result.data.duplicates?.length && !parsed.data.forceCreateDespiteDuplicates);
        auditAfter(request, auth, isDuplicateBlock ? "patient_register_duplicates" : "patient_register", "patients", requestId, {
          patient_id: result.data.patient.id,
          duplicate_count: result.data.duplicates?.length ?? 0,
        });
        return withRequestLog(
          request,
          started,
          ok({
            ...result.data,
            needsConfirmation: isDuplicateBlock,
          }),
          {
            request_id: requestId,
            hospital_id: auth.hospitalId,
            user_id: auth.userId,
            resource: "patients",
          },
        );
      },
    },
  },
});
