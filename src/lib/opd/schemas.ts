import { z } from "zod";

export const AppointmentStatusSchema = z.enum([
  "upcoming",
  "in_queue",
  "completed",
  "cancelled",
  "no_show",
]);
export const QueueStatusSchema = z.enum([
  "waiting",
  "called",
  "in_progress",
  "completed",
  "cancelled",
]);

export const AppointmentListSchema = z.object({
  date: z.string().date().optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: AppointmentStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const BookAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  legacyId: z.string().trim().max(120).optional(),
  scheduledAt: z.string().datetime(),
  timeLabel: z.string().trim().max(40).optional(),
  reason: z.string().trim().max(500).optional(),
  appointmentType: z.string().trim().min(1).max(80).default("consultation"),
  notes: z.string().trim().max(2000).optional(),
  followUpOfId: z.string().uuid().optional(),
});

export const WalkInSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  legacyId: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(500).optional(),
  appointmentType: z.string().trim().min(1).max(80).default("walk_in"),
  notes: z.string().trim().max(2000).optional(),
});

export const CheckInSchema = z.object({
  appointmentId: z.string().min(1),
});

export const RescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  doctorId: z.string().min(1).optional(),
  scheduledAt: z.string().datetime(),
  reason: z.string().trim().max(500).optional(),
});

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional(),
});

export const QueueActionSchema = z.object({
  queueEntryId: z.string().uuid(),
  action: z.enum(["call", "start", "complete", "cancel"]),
});

export const TransferQueueSchema = z.object({
  queueEntryId: z.string().uuid(),
  doctorId: z.string().min(1),
});

export const AvailabilityRuleSchema = z.object({
  doctorId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.number().int().min(5).max(240).default(15),
  capacity: z.number().int().min(1).max(20).default(1),
  effectiveFrom: z.string().date().optional().nullable(),
  effectiveTo: z.string().date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const AvailabilityExceptionSchema = z.object({
  doctorId: z.string().min(1),
  exceptionDate: z.string().date(),
  kind: z.enum(["blocked", "override"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().trim().max(500).optional(),
});

export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;
export type WalkInInput = z.infer<typeof WalkInSchema>;
export type AppointmentListInput = z.infer<typeof AppointmentListSchema>;
export type AvailabilityRuleInput = z.infer<typeof AvailabilityRuleSchema>;

export type OpdAppointment = {
  id: string;
  hospitalId: string;
  patientId: string;
  doctorId: string | null;
  scheduledAt: string;
  timeLabel: string | null;
  reason: string | null;
  status: z.infer<typeof AppointmentStatusSchema>;
  appointmentType: string;
  visitMode: "scheduled" | "walk_in";
  tokenNumber: number | null;
  checkedInAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  rescheduledFromId: string | null;
  followUpOfId: string | null;
  notes: string | null;
  legacyId: string | null;
  patientLegacyId?: string | null;
  doctorLegacyId?: string | null;
};

export type OpdQueueEntry = {
  id: string;
  hospitalId: string;
  appointmentId: string | null;
  patientId: string;
  doctorId: string | null;
  tokenNumber: number | null;
  position: number | null;
  estimatedWaitMinutes: number | null;
  status: z.infer<typeof QueueStatusSchema>;
  calledAt: string | null;
  completedAt: string | null;
  patientLegacyId?: string | null;
  doctorLegacyId?: string | null;
};

export function appointmentStatusToDesk(status: OpdAppointment["status"]): string {
  if (status === "upcoming") return "scheduled";
  if (status === "in_queue") return "checked-in";
  return status.replace("_", "-");
}

export function queueStatusToDesk(status: OpdQueueEntry["status"]): string {
  return status === "in_progress" ? "in-consultation" : status;
}
