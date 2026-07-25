import { z } from "zod";

export const AllergySeveritySchema = z.enum([
  "unknown",
  "mild",
  "moderate",
  "severe",
  "life_threatening",
]);
export const AllergyStatusSchema = z.enum(["active", "inactive", "resolved"]);
export const HistoryCategorySchema = z.enum([
  "medical",
  "surgical",
  "family",
  "social",
  "other",
]);
export const ConsentStatusSchema = z.enum(["pending", "signed", "revoked", "expired"]);
export const DocumentCategorySchema = z.enum([
  "id_proof",
  "insurance",
  "lab",
  "imaging",
  "consent",
  "referral",
  "other",
]);
export const AccessGrantScopeSchema = z.enum(["read", "documents", "consent", "full"]);
export const PatientStatusSchema = z.enum(["active", "inactive", "archived", "merged"]);

export const EmergencyContactInputSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(32),
  relation: z.string().trim().max(80).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const RelationshipInputSchema = z.object({
  relatedPatientId: z.string().uuid().optional().nullable(),
  relatedName: z.string().trim().max(120).optional(),
  relation: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const AllergyInputSchema = z.object({
  substance: z.string().trim().min(1).max(120),
  reaction: z.string().trim().max(240).optional(),
  severity: AllergySeveritySchema.default("unknown"),
  status: AllergyStatusSchema.default("active"),
  onsetDate: z.string().date().optional().nullable(),
  notes: z.string().trim().max(500).optional(),
});

export const HistoryEntryInputSchema = z.object({
  category: HistoryCategorySchema,
  title: z.string().trim().min(1).max(200),
  detail: z.string().trim().max(4000).optional(),
  occurredOn: z.string().date().optional().nullable(),
});

export const RegisterPatientSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  dateOfBirth: z.string().date(),
  gender: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(7).max(32),
  email: z.string().trim().email().optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(2).optional(),
  bloodGroup: z.string().trim().max(8).optional(),
  nationalId: z.string().trim().max(64).optional(),
  insuranceProvider: z.string().trim().max(120).optional(),
  insurancePolicyId: z.string().trim().max(80).optional(),
  allergiesSummary: z.string().trim().max(500).optional(),
  emergencyContacts: z.array(EmergencyContactInputSchema).max(5).optional(),
  allergies: z.array(AllergyInputSchema).max(30).optional(),
  forceCreateDespiteDuplicates: z.boolean().optional(),
});

export const UpdatePatientSchema = RegisterPatientSchema.partial().omit({
  forceCreateDespiteDuplicates: true,
  emergencyContacts: true,
  allergies: true,
});

export const PatientSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: PatientStatusSchema.optional(),
});

export const SignConsentSchema = z.object({
  templateId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  bodySnapshot: z.string().trim().min(1).max(20000).optional(),
  signedByName: z.string().trim().min(1).max(120),
  signatureMethod: z.enum(["typed", "checkbox", "staff_witness"]).default("typed"),
});

export const RevokeConsentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const AccessGrantInputSchema = z.object({
  granteeProfileId: z.string().uuid(),
  scope: AccessGrantScopeSchema.default("read"),
  relationshipLabel: z.string().trim().max(80).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const QrResolveSchema = z.object({
  token: z.string().trim().min(16).max(200),
});

export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type RegisterPatientInput = z.infer<typeof RegisterPatientSchema>;
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
export type PatientSearchInput = z.infer<typeof PatientSearchSchema>;
export type EmergencyContactInput = z.infer<typeof EmergencyContactInputSchema>;
export type AllergyInput = z.infer<typeof AllergyInputSchema>;
export type HistoryEntryInput = z.infer<typeof HistoryEntryInputSchema>;
export type SignConsentInput = z.infer<typeof SignConsentSchema>;

export type ManagedPatient = {
  id: string;
  hospitalId: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  bloodGroup: string | null;
  nationalId: string | null;
  insuranceProvider: string | null;
  insurancePolicyId: string | null;
  allergiesSummary: string | null;
  status: string;
  profileId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PatientProfileBundle = {
  patient: ManagedPatient;
  emergencyContacts: Array<Record<string, unknown>>;
  relationships: Array<Record<string, unknown>>;
  allergies: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  consents: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  qr: { id: string; tokenPrefix: string; status: string; expiresAt: string | null } | null;
};

export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9+]/g, "");
}

export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}
