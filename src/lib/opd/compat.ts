import type { Appointment } from "@/lib/reception-desk/store";
import type { ClinicQueueEntry } from "@/lib/shared/clinic-queue";
import {
  appointmentStatusToDesk,
  queueStatusToDesk,
  type OpdAppointment,
  type OpdQueueEntry,
} from "./schemas";

export function rowToOpdAppointment(row: Record<string, unknown>): OpdAppointment {
  const patient = row.patients as
    | { mrn?: string | null; legacy_id?: string | null }
    | null
    | undefined;
  const doctor = row.staff_profiles as
    | { legacy_id?: string | null }
    | null
    | undefined;
  return {
    id: String(row.id),
    hospitalId: String(row.hospital_id),
    patientId: String(row.patient_id),
    doctorId: row.doctor_staff_id ? String(row.doctor_staff_id) : null,
    scheduledAt: String(row.scheduled_at),
    timeLabel: (row.time_label as string | null) ?? null,
    reason: (row.reason as string | null) ?? null,
    status: (row.status as OpdAppointment["status"]) ?? "upcoming",
    appointmentType: String(row.appointment_type ?? "consultation"),
    visitMode: (row.visit_mode as OpdAppointment["visitMode"]) ?? "scheduled",
    tokenNumber: (row.token_number as number | null) ?? null,
    checkedInAt: (row.checked_in_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    cancelReason: (row.cancel_reason as string | null) ?? null,
    rescheduledFromId: (row.rescheduled_from_id as string | null) ?? null,
    followUpOfId: (row.follow_up_of_id as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    legacyId: (row.legacy_id as string | null) ?? null,
    patientLegacyId: patient?.mrn || patient?.legacy_id || null,
    doctorLegacyId: doctor?.legacy_id || null,
  };
}

export function rowToOpdQueueEntry(row: Record<string, unknown>): OpdQueueEntry {
  const patient = row.patients as
    | { mrn?: string | null; legacy_id?: string | null }
    | null
    | undefined;
  const doctor = row.staff_profiles as
    | { legacy_id?: string | null }
    | null
    | undefined;
  return {
    id: String(row.id),
    hospitalId: String(row.hospital_id),
    appointmentId: (row.appointment_id as string | null) ?? null,
    patientId: String(row.patient_id),
    doctorId: (row.doctor_staff_id as string | null) ?? null,
    tokenNumber: (row.token_number as number | null) ?? null,
    position: (row.position as number | null) ?? null,
    estimatedWaitMinutes: (row.estimated_wait_minutes as number | null) ?? null,
    status: (row.status as OpdQueueEntry["status"]) ?? "waiting",
    calledAt: (row.called_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    patientLegacyId: patient?.mrn || patient?.legacy_id || null,
    doctorLegacyId: doctor?.legacy_id || null,
  };
}

export function opdToReceptionAppointment(
  appointment: OpdAppointment,
  ids?: { patientId?: string; doctorId?: string },
): Appointment {
  const date = appointment.scheduledAt.slice(0, 10);
  const time =
    appointment.timeLabel ||
    new Date(appointment.scheduledAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return {
    id: appointment.legacyId || appointment.id,
    patientId: ids?.patientId || appointment.patientLegacyId || appointment.patientId,
    doctorId: ids?.doctorId || appointment.doctorLegacyId || appointment.doctorId || "",
    date,
    time,
    type: appointment.appointmentType,
    status: appointmentStatusToDesk(appointment.status),
    tokenNumber: appointment.tokenNumber,
    notes: appointment.notes || undefined,
    cancellationReason: appointment.cancelReason || undefined,
    rescheduledFromId: appointment.rescheduledFromId || undefined,
  };
}

export function opdToClinicQueue(entry: OpdQueueEntry): ClinicQueueEntry {
  return {
    id: entry.id,
    appointmentId: entry.appointmentId || "",
    patientId: entry.patientLegacyId || entry.patientId,
    doctorId: entry.doctorLegacyId || entry.doctorId || "",
    tokenNumber: entry.tokenNumber || 0,
    status: queueStatusToDesk(entry.status) as ClinicQueueEntry["status"],
    checkInTime: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    waitMinutes: entry.estimatedWaitMinutes || 0,
  };
}
