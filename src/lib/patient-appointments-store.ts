import type { Appointment } from "@/lib/mock-data";
import { appointments as mockAppointments, doctors } from "@/lib/mock-data";
import {
  formatSlotDisplayTime,
  listPatientBookings,
  normalizeTimeLabel,
  PATIENT_BOOKING_EVENT,
  type PatientBooking,
} from "@/lib/patient-booking-store";
import {
  resolveQueueMetricsForPanelPatient,
  subscribeDoctorQueue,
} from "@/lib/shared/booking-queue-bridge";
import { demoPanelPatientId } from "@/lib/shared/clinical-event-log";

const STORAGE_KEY = "medora-patient-appointments-v1";
export const PATIENT_APPOINTMENTS_EVENT = "medora-patient-appointments-changed";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PATIENT_APPOINTMENTS_EVENT));
  }
}

/** Live AWQ metrics for demo portal patient — replaces synthetic per-doctor math. */
function queueMetaForDoctor(_doctorId: string) {
  const live = resolveQueueMetricsForPanelPatient(demoPanelPatientId());
  if (live.queuePosition) return live;
  return {
    queuePosition: 1,
    queueTotal: 1,
    estimatedWait: 0,
  };
}

function roomForDoctor(doctorId: string): string {
  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) return "Outpatient · Room 3A";
  if (doctor.specialty === "Dermatology") return "Derm Suite 4B";
  if (doctor.specialty === "Cardiology") return "Cardiology Wing · Room 2C";
  return `${doctor.hospital.split(" ")[0]} · Room 3A`;
}

function displayTimeFrom24h(time24: string): string {
  const { displayTime, period } = formatSlotDisplayTime(time24);
  return `${displayTime} ${period}`;
}

function isoDateFromKey(dateKey: string): string {
  return `${dateKey}T12:00:00.000Z`;
}

function isTodayDateKey(dateKey: string): boolean {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return key === dateKey;
}

function appointmentDedupeKey(appt: Appointment): string {
  const dateKey = appt.date.slice(0, 10);
  const time = normalizeTimeLabel(appt.time);
  return `${appt.doctorId}|${dateKey}|${time}`;
}

function appointmentPriority(id: string): number {
  if (id.startsWith("appt-pb-")) return 3;
  if (id.startsWith("appt-seed-")) return 2;
  if (id.startsWith("appt-")) return 1;
  return 0;
}

function dedupeAppointments(list: Appointment[]): Appointment[] {
  const byKey = new Map<string, Appointment>();
  for (const appt of list) {
    const key = appointmentDedupeKey(appt);
    const existing = byKey.get(key);
    if (!existing || appointmentPriority(appt.id) > appointmentPriority(existing.id)) {
      byKey.set(key, appt);
    }
  }
  return [...byKey.values()];
}

function seedAppointments(): Appointment[] {
  return mockAppointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled",
  );
}

function readStored(): Appointment[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Appointment[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(list: Appointment[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emit();
  }
}

function bookingToAppointment(
  booking: PatientBooking,
  reason = "Scheduled visit",
  visitType?: string,
): Appointment {
  const meta = queueMetaForDoctor(booking.doctorId);
  const today = isTodayDateKey(booking.dateKey);
  const inPersonToday = today && visitType !== "video";

  const appt: Appointment = {
    id: `appt-${booking.id}`,
    doctorId: booking.doctorId,
    date: isoDateFromKey(booking.dateKey),
    time: displayTimeFrom24h(booking.time),
    reason,
    status: inPersonToday ? "in-queue" : "upcoming",
    queuePosition: inPersonToday ? meta.queuePosition : undefined,
    queueTotal: inPersonToday ? meta.queueTotal : undefined,
    estimatedWait: inPersonToday ? meta.estimatedWait : undefined,
    room: roomForDoctor(booking.doctorId),
    checkInStatus: inPersonToday
      ? meta.pendingApproval
        ? "Awaiting clinic approval"
        : "Checked in · Vitals complete"
      : undefined,
  };
  return appt;
}

function enrichInQueueMetrics(appt: Appointment): Appointment {
  if (appt.status !== "in-queue") return appt;
  const meta = queueMetaForDoctor(appt.doctorId);
  return {
    ...appt,
    queuePosition: meta.queuePosition,
    queueTotal: meta.queueTotal,
    estimatedWait: meta.estimatedWait,
    checkInStatus: meta.pendingApproval
      ? "Awaiting clinic approval"
      : appt.checkInStatus,
  };
}

function syncFromBookings(existing: Appointment[]): Appointment[] {
  const bookings = listPatientBookings();
  const bookingIds = new Set(bookings.map((b) => b.id));
  const preserved = existing.filter(
    (a) =>
      (a.status === "completed" || a.status === "cancelled") &&
      !a.id.startsWith("appt-pb-") &&
      !a.id.startsWith("appt-seed-"),
  );
  const fromBookings = bookings.map((b) => {
    const prev = existing.find((a) => a.id === `appt-${b.id}`);
    return prev ?? bookingToAppointment(b);
  });

  const merged = [...preserved];
  for (const appt of fromBookings) {
    const idx = merged.findIndex((a) => a.id === appt.id);
    if (idx >= 0) merged[idx] = appt;
    else merged.push(appt);
  }

  return dedupeAppointments(
    merged.filter((a) => {
      if (!a.id.startsWith("appt-pb-")) return true;
      const bookingId = a.id.replace("appt-", "");
      return bookingIds.has(bookingId);
    }),
  ).map(enrichInQueueMetrics);
}

export function listPatientAppointments(): Appointment[] {
  const stored = readStored();
  let base = stored ?? seedAppointments();
  base = base.filter(
    (a) => a.status !== "in-queue" || a.id.startsWith("appt-"),
  );
  const synced = dedupeAppointments(syncFromBookings(base));
  if (typeof window !== "undefined") {
    if (!stored || JSON.stringify(stored) !== JSON.stringify(synced)) {
      writeStored(synced);
    }
  }
  return synced.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function upsertAppointmentFromBooking(
  booking: PatientBooking,
  meta: { reason?: string; visitType?: string },
): Appointment {
  const list = listPatientAppointments();
  const appt = bookingToAppointment(booking, meta.reason?.trim() || "Scheduled visit", meta.visitType);

  let next = list.filter((a) => a.id !== appt.id);
  if (appt.status === "in-queue") {
    next = next.map((a) =>
      a.status === "in-queue" ? { ...a, status: "upcoming" as const } : a,
    );
  }
  next.push(appt);
  writeStored(dedupeAppointments(next));
  return appt;
}

export function hasActiveQueueForDoctor(doctorId: string): boolean {
  return listPatientAppointments().some(
    (a) => a.doctorId === doctorId && a.status === "in-queue",
  );
}

export function getAppointmentForBooking(bookingId: string): Appointment | undefined {
  return listPatientAppointments().find((a) => a.id === `appt-${bookingId}`);
}

export function refreshPatientAppointmentsFromBookings() {
  const stored = readStored() ?? seedAppointments();
  writeStored(dedupeAppointments(syncFromBookings(stored)));
}

if (typeof window !== "undefined") {
  window.addEventListener(PATIENT_BOOKING_EVENT, () => {
    refreshPatientAppointmentsFromBookings();
  });
  subscribeDoctorQueue(() => {
    refreshPatientAppointmentsFromBookings();
  });
}