import { z } from "zod";

export const Icd10CodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[A-TV-Z][0-9][A-Z0-9](\.[A-Z0-9]{1,4})?$/i, "Invalid ICD-10 code");

export const SoapNoteSchema = z.object({
  encounterId: z.string().uuid().optional(),
  chiefComplaint: z.string().trim().max(2000).optional(),
  subjective: z.string().trim().max(20000).optional(),
  objective: z.string().trim().max(20000).optional(),
  assessment: z.string().trim().max(20000).optional(),
  plan: z.string().trim().max(20000).optional(),
  notes: z.string().trim().max(10000).optional(),
  changeSummary: z.string().trim().max(500).optional(),
  sign: z.boolean().default(false),
  appointmentId: z.string().uuid().optional().nullable(),
});

export const OpenEncounterSchema = z.object({
  chiefComplaint: z.string().trim().max(2000).optional(),
  appointmentId: z.string().uuid().optional().nullable(),
  doctorStaffId: z.string().uuid().optional().nullable(),
});

export const VitalsInputSchema = z.object({
  encounterId: z.string().uuid().optional().nullable(),
  recordedAt: z.string().datetime().optional(),
  bpSystolic: z.number().int().min(40).max(300).optional().nullable(),
  bpDiastolic: z.number().int().min(20).max(200).optional().nullable(),
  heartRate: z.number().int().min(20).max(300).optional().nullable(),
  respiratoryRate: z.number().int().min(4).max(80).optional().nullable(),
  temperatureC: z.number().min(30).max(45).optional().nullable(),
  spo2: z.number().int().min(50).max(100).optional().nullable(),
  weightKg: z.number().min(0.5).max(500).optional().nullable(),
  heightCm: z.number().min(20).max(275).optional().nullable(),
  painScore: z.number().int().min(0).max(10).optional().nullable(),
  notes: z.string().trim().max(2000).optional(),
  legacyId: z.string().trim().max(120).optional(),
});

export const DiagnosisInputSchema = z.object({
  encounterId: z.string().uuid().optional().nullable(),
  icd10Code: Icd10CodeSchema,
  icd10Display: z.string().trim().min(1).max(500),
  clinicalStatus: z
    .enum(["active", "resolved", "inactive", "recurrence"])
    .default("active"),
  verificationStatus: z
    .enum(["unconfirmed", "provisional", "differential", "confirmed"])
    .default("confirmed"),
  onsetDate: z.string().date().optional().nullable(),
  resolvedDate: z.string().date().optional().nullable(),
  isPrimary: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
});

export const ProcedureInputSchema = z.object({
  encounterId: z.string().uuid().optional().nullable(),
  code: z.string().trim().max(40).optional(),
  display: z.string().trim().min(1).max(500),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("completed"),
  performedAt: z.string().datetime().optional().nullable(),
  performerName: z.string().trim().max(200).optional(),
  bodySite: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const ImmunizationInputSchema = z.object({
  encounterId: z.string().uuid().optional().nullable(),
  vaccineCode: z.string().trim().min(1).max(80),
  vaccineName: z.string().trim().min(1).max(200),
  doseNumber: z.number().int().min(1).max(20).optional().nullable(),
  status: z.enum(["completed", "deferred", "refused", "entered_in_error"]).default("completed"),
  administeredAt: z.string().datetime().optional().nullable(),
  lotNumber: z.string().trim().max(80).optional(),
  site: z.string().trim().max(80).optional(),
  route: z.string().trim().max(80).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  aefiNotes: z.string().trim().max(2000).optional(),
  deferralReason: z.string().trim().max(500).optional(),
  legacyId: z.string().trim().max(120).optional(),
});

export const AllergyEmrInputSchema = z.object({
  substance: z.string().trim().min(1).max(200),
  reaction: z.string().trim().max(500).optional(),
  severity: z.enum(["mild", "moderate", "severe", "unknown"]).default("unknown"),
  status: z.enum(["active", "inactive", "resolved"]).default("active"),
  onsetDate: z.string().date().optional().nullable(),
  notes: z.string().trim().max(2000).optional(),
});

export const HistoryEmrInputSchema = z.object({
  category: z.enum(["medical", "surgical", "family", "social", "other"]),
  title: z.string().trim().min(1).max(300),
  detail: z.string().trim().max(5000).optional(),
  occurredOn: z.string().date().optional().nullable(),
  status: z.enum(["active", "resolved", "inactive"]).default("active"),
});

export const AttachmentMetaSchema = z.object({
  title: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(80).default("clinical"),
  encounterId: z.string().uuid().optional().nullable(),
  noteVersionId: z.string().uuid().optional().nullable(),
  mimeType: z.string().trim().min(1).max(120),
  byteSize: z.number().int().min(1).max(20 * 1024 * 1024),
  storagePath: z.string().trim().min(1).max(1000),
  sha256: z.string().trim().max(128).optional(),
});

export const ALLOWED_CLINICAL_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/dicom",
]);

export type SoapNoteInput = z.infer<typeof SoapNoteSchema>;
export type VitalsInput = z.infer<typeof VitalsInputSchema>;
export type DiagnosisInput = z.infer<typeof DiagnosisInputSchema>;
export type ProcedureInput = z.infer<typeof ProcedureInputSchema>;
export type ImmunizationInput = z.infer<typeof ImmunizationInputSchema>;
export type AllergyEmrInput = z.infer<typeof AllergyEmrInputSchema>;
export type HistoryEmrInput = z.infer<typeof HistoryEmrInputSchema>;
export type AttachmentMetaInput = z.infer<typeof AttachmentMetaSchema>;

export type EmrTimelineKind =
  | "encounter"
  | "note"
  | "vitals"
  | "diagnosis"
  | "procedure"
  | "allergy"
  | "immunization"
  | "history"
  | "attachment";

export type EmrTimelineItem = {
  id: string;
  kind: EmrTimelineKind;
  occurredAt: string;
  title: string;
  summary?: string;
  resourceId: string;
  encounterId?: string | null;
  meta?: Record<string, unknown>;
};

export type EmrChartBundle = {
  patientId: string;
  mrn?: string | null;
  timeline: EmrTimelineItem[];
  encounters: Array<Record<string, unknown>>;
  vitals: Array<Record<string, unknown>>;
  diagnoses: Array<Record<string, unknown>>;
  procedures: Array<Record<string, unknown>>;
  allergies: Array<Record<string, unknown>>;
  immunizations: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  attachments: Array<Record<string, unknown>>;
  noteVersions: Array<Record<string, unknown>>;
};
