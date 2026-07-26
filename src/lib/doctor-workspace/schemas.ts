import { z } from "zod";

export const StartConsultationSchema = z.object({
  patientId: z.string().min(1),
  queueEntryId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  doctorStaffId: z.string().uuid().optional().nullable(),
  chiefComplaint: z.string().trim().max(2000).optional(),
  roomLabel: z.string().trim().max(80).optional(),
});

export const CompleteConsultationSchema = z.object({
  consultationId: z.string().uuid(),
  notes: z.string().trim().max(5000).optional(),
});

export const PrescriptionOrderSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().uuid().optional().nullable(),
  encounterId: z.string().uuid().optional().nullable(),
  medicationName: z.string().trim().min(1).max(300),
  dosage: z.string().trim().max(120).optional(),
  frequency: z.string().trim().max(120).optional(),
  duration: z.string().trim().max(120).optional(),
  route: z.string().trim().max(80).optional(),
  quantity: z.string().trim().max(80).optional(),
  instructions: z.string().trim().max(2000).optional(),
  allergyChecked: z.boolean().default(true),
  legacyId: z.string().trim().max(120).optional(),
});

export const LabOrderSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().uuid().optional().nullable(),
  encounterId: z.string().uuid().optional().nullable(),
  testName: z.string().trim().min(1).max(300),
  testCode: z.string().trim().max(80).optional(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  clinicalIndication: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const RadiologyOrderSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().uuid().optional().nullable(),
  encounterId: z.string().uuid().optional().nullable(),
  modality: z.enum(["xray", "ct", "mri", "us", "other"]).default("xray"),
  studyName: z.string().trim().min(1).max(300),
  studyCode: z.string().trim().max(80).optional(),
  bodySite: z.string().trim().max(200).optional(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  clinicalIndication: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const ReferralSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().uuid().optional().nullable(),
  encounterId: z.string().uuid().optional().nullable(),
  toSpecialty: z.string().trim().min(1).max(200),
  toDoctorName: z.string().trim().max(200).optional(),
  toFacility: z.string().trim().max(300).optional(),
  reason: z.string().trim().min(1).max(2000),
  urgency: z.enum(["routine", "urgent", "emergent"]).default("routine"),
  notes: z.string().trim().max(2000).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const ClinicalTaskSchema = z.object({
  patientId: z.string().min(1).optional().nullable(),
  consultationId: z.string().uuid().optional().nullable(),
  encounterId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(300),
  detail: z.string().trim().max(5000).optional(),
  taskType: z
    .enum(["general", "follow_up", "result_review", "documentation", "callback"])
    .default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueAt: z.string().datetime().optional().nullable(),
});

export const CompleteTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export const FollowUpSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  reason: z.string().trim().max(500).optional(),
  followUpOfId: z.string().uuid().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type StartConsultationInput = z.infer<typeof StartConsultationSchema>;
export type PrescriptionOrderInput = z.infer<typeof PrescriptionOrderSchema>;
export type LabOrderInput = z.infer<typeof LabOrderSchema>;
export type RadiologyOrderInput = z.infer<typeof RadiologyOrderSchema>;
export type ReferralInput = z.infer<typeof ReferralSchema>;
export type ClinicalTaskInput = z.infer<typeof ClinicalTaskSchema>;
export type FollowUpInput = z.infer<typeof FollowUpSchema>;

export type DoctorWorkspaceBoard = {
  date: string;
  appointments: Array<Record<string, unknown>>;
  queue: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  activeConsultation: Record<string, unknown> | null;
};

export type ConsultationBundle = {
  consultation: Record<string, unknown>;
  patientId: string;
  encounterId: string | null;
  prescriptions: Array<Record<string, unknown>>;
  labOrders: Array<Record<string, unknown>>;
  radiologyOrders: Array<Record<string, unknown>>;
  referrals: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
};
