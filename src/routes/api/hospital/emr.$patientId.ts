import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomUUID } from "node:crypto";
import {
  AllergyEmrInputSchema,
  ALLOWED_CLINICAL_MIME,
  DiagnosisInputSchema,
  HistoryEmrInputSchema,
  ImmunizationInputSchema,
  OpenEncounterSchema,
  ProcedureInputSchema,
  SoapNoteSchema,
  VitalsInputSchema,
} from "@/lib/emr/schemas";
import {
  addDiagnosis,
  addEmrAllergy,
  addEmrHistory,
  addImmunization,
  addProcedure,
  createClinicalAttachmentUrl,
  getEmrChart,
  listNoteVersions,
  openEncounter,
  recordVitals,
  registerClinicalAttachment,
  saveSoapNote,
} from "@/server/emr/service";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { productionBootHttpResponse } from "@/server/production-boot";
import { newRequestId, withRequestLog } from "@/server/request-log";
import { auditAfter, authorize, fail, ok } from "@/server/patient-management/http";
import { optionsResponse } from "@/server/ai/api-auth";

export const Route = createFileRoute("/api/hospital/emr/$patientId")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),

      GET: async ({ request, params }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const url = new URL(request.url);
        const action = url.searchParams.get("action");
        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
            error_code: "auth",
          });
        }
        const auth = authResult.auth;
        const patientId = params.patientId;

        if (action === "note_versions") {
          const encounterId = url.searchParams.get("encounterId") ?? undefined;
          const result = await listNoteVersions(auth, patientId, encounterId);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.note_versions.read", "clinical_note_versions", requestId, {
            patient_id: patientId,
            record_ids: result.data.map((r) => r.id),
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "download_attachment") {
          const attachmentId = url.searchParams.get("attachmentId");
          if (!attachmentId) {
            return withRequestLog(request, started, fail(400, "attachmentId required"), {
              request_id: requestId,
            });
          }
          const result = await createClinicalAttachmentUrl(auth, patientId, attachmentId);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.attachment.download", "clinical_attachments", requestId, {
            patient_id: patientId,
            attachment_id: attachmentId,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        const result = await getEmrChart(auth, patientId);
        if (!result.ok) {
          return withRequestLog(request, started, fail(result.status, result.error), {
            request_id: requestId,
          });
        }
        auditAfter(request, auth, "emr.chart.read", "emr_chart", requestId, {
          patient_id: patientId,
          timeline_count: result.data.timeline.length,
        });
        return withRequestLog(request, started, ok(result.data), { request_id: requestId });
      },

      POST: async ({ request, params }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "";
        const patientId = params.patientId;

        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
            error_code: "auth",
          });
        }
        const auth = authResult.auth;

        if (action === "attachment") {
          const form = await request.formData().catch(() => null);
          if (!form) {
            return withRequestLog(request, started, fail(400, "multipart required"), {
              request_id: requestId,
            });
          }
          const file = form.get("file");
          if (!(file instanceof File)) {
            return withRequestLog(request, started, fail(400, "file required"), {
              request_id: requestId,
            });
          }
          if (!ALLOWED_CLINICAL_MIME.has(file.type)) {
            return withRequestLog(request, started, fail(400, "MIME not allowed"), {
              request_id: requestId,
            });
          }
          if (file.size > 20 * 1024 * 1024) {
            return withRequestLog(request, started, fail(400, "File too large"), {
              request_id: requestId,
            });
          }
          const admin = getSupabaseAdmin();
          if (!admin) {
            return withRequestLog(request, started, fail(503, "admin_unavailable"), {
              request_id: requestId,
            });
          }
          const chart = await getEmrChart(auth, patientId);
          if (!chart.ok) {
            return withRequestLog(request, started, fail(chart.status, chart.error), {
              request_id: requestId,
            });
          }
          const resolvedPatientId = chart.data.patientId;
          const bytes = Buffer.from(await file.arrayBuffer());
          const sha256 = createHash("sha256").update(bytes).digest("hex");
          const storagePath = `${auth.hospitalId}/${resolvedPatientId}/${randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
          const upload = await admin.storage
            .from("clinical-attachments")
            .upload(storagePath, bytes, { contentType: file.type, upsert: false });
          if (upload.error) {
            return withRequestLog(request, started, fail(500, upload.error.message), {
              request_id: requestId,
            });
          }
          const title = String(form.get("title") || file.name).slice(0, 300);
          const category = String(form.get("category") || "clinical").slice(0, 80);
          const encounterIdRaw = form.get("encounterId");
          const encounterId =
            typeof encounterIdRaw === "string" && encounterIdRaw
              ? encounterIdRaw
              : null;
          const result = await registerClinicalAttachment(auth, resolvedPatientId, {
            title,
            category,
            encounterId,
            mimeType: file.type,
            byteSize: file.size,
            storagePath,
            sha256,
          });
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.attachment.upload", "clinical_attachments", requestId, {
            patient_id: resolvedPatientId,
            attachment_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        const body = await request.json().catch(() => ({}));

        if (action === "open_encounter") {
          const parsed = OpenEncounterSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await openEncounter(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.encounter.open", "encounters", requestId, {
            patient_id: patientId,
            encounter_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "soap") {
          const parsed = SoapNoteSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await saveSoapNote(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(
            request,
            auth,
            parsed.data.sign ? "emr.soap.sign" : "emr.soap.save",
            "clinical_note_versions",
            requestId,
            {
              patient_id: patientId,
              encounter_id: result.data.encounter.id,
              version_id: result.data.version.id,
            },
          );
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "vitals") {
          const parsed = VitalsInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await recordVitals(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.vitals.record", "vitals_readings", requestId, {
            patient_id: patientId,
            vitals_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "diagnosis") {
          const parsed = DiagnosisInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addDiagnosis(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.diagnosis.add", "patient_diagnoses", requestId, {
            patient_id: patientId,
            diagnosis_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "procedure") {
          const parsed = ProcedureInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addProcedure(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.procedure.add", "patient_procedures", requestId, {
            patient_id: patientId,
            procedure_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "allergy") {
          const parsed = AllergyEmrInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addEmrAllergy(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.allergy.add", "patient_allergies", requestId, {
            patient_id: patientId,
            allergy_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "immunization") {
          const parsed = ImmunizationInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addImmunization(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.immunization.add", "patient_immunizations", requestId, {
            patient_id: patientId,
            immunization_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "history") {
          const parsed = HistoryEmrInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addEmrHistory(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "emr.history.add", "patient_history_entries", requestId, {
            patient_id: patientId,
            history_id: result.data.id,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        return withRequestLog(request, started, fail(400, "Unknown action"), {
          request_id: requestId,
        });
      },
    },
  },
});
