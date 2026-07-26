import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { jsonResponse, optionsResponse } from "@/server/ai/api-auth";
import {
  AllergyInputSchema,
  EmergencyContactInputSchema,
  HistoryEntryInputSchema,
  RevokeConsentSchema,
  SignConsentSchema,
  UpdatePatientSchema,
} from "@/lib/patient-management/schemas";
import {
  addAllergy,
  addHistoryEntry,
  archiveDocument,
  createSignedDocumentUrl,
  getPatientProfile,
  issueQrToken,
  replaceEmergencyContacts,
  revokeConsent,
  signConsent,
  updatePatient,
  uploadPatientDocumentMeta,
} from "@/server/patient-management/service";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { productionBootHttpResponse } from "@/server/production-boot";
import { newRequestId, withRequestLog } from "@/server/request-log";
import { auditAfter, authorize, fail, ok } from "@/server/patient-management/http";
import { ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES } from "@/lib/patient-management/schemas";

export const Route = createFileRoute("/api/hospital/patients/$patientId")({
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

        if (action === "download_document") {
          const documentId = url.searchParams.get("documentId");
          if (!documentId) {
            return withRequestLog(request, started, fail(400, "documentId required"), {
              request_id: requestId,
            });
          }
          const result = await createSignedDocumentUrl(auth, patientId, documentId);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "patient_document_download", "patient_documents", requestId, {
            document_id: documentId,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        const result = await getPatientProfile(auth, patientId);
        if (!result.ok) {
          return withRequestLog(request, started, fail(result.status, result.error), {
            request_id: requestId,
          });
        }
        auditAfter(request, auth, "patient_profile_read", "patients", requestId, {
          patient_id: patientId,
        });
        return withRequestLog(request, started, ok(result.data), { request_id: requestId });
      },

      PATCH: async ({ request, params }) => {
        const started = performance.now();
        const requestId = newRequestId(request);
        const blocked = productionBootHttpResponse();
        if (blocked) return blocked;

        const authResult = await authorize(request);
        if (!authResult.ok) {
          return withRequestLog(request, started, fail(authResult.status, authResult.error), {
            request_id: requestId,
          });
        }
        const auth = authResult.auth;
        const body = await request.json().catch(() => ({}));
        const parsed = UpdatePatientSchema.safeParse(body);
        if (!parsed.success) {
          return withRequestLog(request, started, fail(400, parsed.error.message), {
            request_id: requestId,
          });
        }
        const result = await updatePatient(auth, params.patientId, parsed.data);
        if (!result.ok) {
          return withRequestLog(request, started, fail(result.status, result.error), {
            request_id: requestId,
          });
        }
        auditAfter(request, auth, "patient_update", "patients", requestId, {
          patient_id: params.patientId,
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
          });
        }
        const auth = authResult.auth;

        if (action === "issue_qr") {
          const result = await issueQrToken(auth, patientId);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "patient_qr_issue", "patient_qr_tokens", requestId, {
            patient_id: patientId,
          });
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "contacts") {
          const body = await request.json().catch(() => ({}));
          const contacts = z.array(EmergencyContactInputSchema).safeParse(body.contacts);
          if (!contacts.success) {
            return withRequestLog(request, started, fail(400, contacts.error.message), {
              request_id: requestId,
            });
          }
          const result = await replaceEmergencyContacts(auth, patientId, contacts.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "allergy") {
          const body = await request.json().catch(() => ({}));
          const parsed = AllergyInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addAllergy(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "history") {
          const body = await request.json().catch(() => ({}));
          const parsed = HistoryEntryInputSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await addHistoryEntry(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "sign_consent") {
          const body = await request.json().catch(() => ({}));
          const parsed = SignConsentSchema.safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await signConsent(auth, patientId, parsed.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "revoke_consent") {
          const body = await request.json().catch(() => ({}));
          const parsed = RevokeConsentSchema.extend({
            consentId: z.string().uuid(),
          }).safeParse(body);
          if (!parsed.success) {
            return withRequestLog(request, started, fail(400, parsed.error.message), {
              request_id: requestId,
            });
          }
          const result = await revokeConsent(
            auth,
            patientId,
            parsed.data.consentId,
            parsed.data.reason,
          );
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "archive_document") {
          const body = await request.json().catch(() => ({}));
          const documentId = z.string().uuid().safeParse(body.documentId);
          if (!documentId.success) {
            return withRequestLog(request, started, fail(400, "documentId required"), {
              request_id: requestId,
            });
          }
          const result = await archiveDocument(auth, patientId, documentId.data);
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          return withRequestLog(request, started, ok(result.data), { request_id: requestId });
        }

        if (action === "upload_document") {
          const form = await request.formData().catch(() => null);
          if (!form) {
            return withRequestLog(request, started, fail(400, "multipart required"), {
              request_id: requestId,
            });
          }
          const file = form.get("file");
          const title = String(form.get("title") ?? "Document");
          const category = String(form.get("category") ?? "other");
          if (!(file instanceof File)) {
            return withRequestLog(request, started, fail(400, "file required"), {
              request_id: requestId,
            });
          }
          const mime = file.type || "application/octet-stream";
          if (!ALLOWED_DOCUMENT_MIME.includes(mime as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
            return withRequestLog(request, started, fail(400, "Unsupported file type"), {
              request_id: requestId,
            });
          }
          if (file.size > MAX_DOCUMENT_BYTES) {
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
          const buf = Buffer.from(await file.arrayBuffer());
          const sha256 = createHash("sha256").update(buf).digest("hex");
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
          const storagePath = `${auth.hospitalId}/${patientId}/${randomUUID()}/${safeName}`;
          if (
            storagePath.includes("..") ||
            !storagePath.startsWith(`${auth.hospitalId}/${patientId}/`)
          ) {
            return withRequestLog(request, started, fail(400, "Invalid storage path"), {
              request_id: requestId,
            });
          }
          const { error: upErr } = await admin.storage
            .from("patient-documents")
            .upload(storagePath, buf, { contentType: mime, upsert: false });
          if (upErr) {
            return withRequestLog(request, started, fail(500, upErr.message), {
              request_id: requestId,
            });
          }
          const result = await uploadPatientDocumentMeta(auth, patientId, {
            title,
            category,
            mimeType: mime,
            byteSize: buf.length,
            storagePath,
            sha256,
          });
          if (!result.ok) {
            return withRequestLog(request, started, fail(result.status, result.error), {
              request_id: requestId,
            });
          }
          auditAfter(request, auth, "patient_document_upload", "patient_documents", requestId, {
            patient_id: patientId,
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
