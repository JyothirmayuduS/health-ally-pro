import { doctors } from "@/lib/mock-data";
import { BOOK_DAYS } from "@/lib/book-utils";
import { getPublicDoctorSlots } from "@/lib/doctor-slot-catalog";

export type PatientBooking = {
  id: string;
  doctorId: string;
  dateKey: string;
  time: string;
  visitType?: string;
  reason?: string;
};

export type SlotDisableReason =
  | "full"
  | "already_booked"
  | "day_booked"
  | "time_conflict"
  | "unavailable";

export type BookableSlot = {
  time: string;
  displayTime: string;
  period: "AM" | "PM";
  price: number;
  selectable: boolean;
  reason?: SlotDisableReason;
  conflictDoctorName?: string;
};

const STORAGE_KEY = "medora-patient-bookings-v1";
export const PATIENT_BOOKING_EVENT = "medora-patient-booking-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PATIENT_BOOKING_EVENT));
  }
}

export function dateKeyForDayIndex(dayIndex: number): string {
  const d = BOOK_DAYS[dayIndex] ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalize "5:15 PM" / "09:00" → "HH:mm" (24h). */
export function normalizeTimeLabel(time: string): string {
  const trimmed = time.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hour = Number.parseInt(match12[1] ?? "0", 10);
    const minute = match12[2] ?? "00";
    const meridiem = (match12[3] ?? "").toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    return `${String(Number.parseInt(parts[0] ?? "0", 10)).padStart(2, "0")}:${parts[1]!.slice(0, 2)}`;
  }
  return trimmed;
}

export function formatSlotDisplayTime(time: string): {
  displayTime: string;
  period: "AM" | "PM";
} {
  const [hStr, mStr] = time.split(":");
  const hour24 = Number.parseInt(hStr ?? "0", 10);
  const minute = (mStr ?? "00").slice(0, 2);
  const period = hour24 < 12 ? "AM" : "PM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    displayTime: `${String(hour12).padStart(2, "0")}:${minute}`,
    period,
  };
}

function doctorNameById(doctorId: string): string | undefined {
  return doctors.find((d) => d.id === doctorId)?.name;
}

function seedBookings(): PatientBooking[] {
  return [];
}

function bookingDedupeKey(b: PatientBooking): string {
  return `${b.doctorId}|${b.dateKey}|${normalizeTimeLabel(b.time)}`;
}

function dedupeBookings(bookings: PatientBooking[]): PatientBooking[] {
  const byKey = new Map<string, PatientBooking>();
  for (const b of bookings) {
    const key = bookingDedupeKey(b);
    const existing = byKey.get(key);
    if (!existing || (b.id.startsWith("pb-") && !existing.id.startsWith("pb-"))) {
      byKey.set(key, b);
    }
  }
  return [...byKey.values()];
}

function sanitizeBookings(bookings: PatientBooking[]): PatientBooking[] {
  return dedupeBookings(bookings.filter((b) => !b.id.startsWith("seed-")));
}

export function listPatientBookings(): PatientBooking[] {
  if (typeof window === "undefined") return seedBookings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = seedBookings();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const parsed = JSON.parse(raw) as PatientBooking[];
    if (!Array.isArray(parsed)) return seedBookings();
    const clean = sanitizeBookings(parsed);
    if (clean.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      emit();
    }
    return clean;
  } catch {
    return seedBookings();
  }
}

export function savePatientBooking(
  booking: Omit<PatientBooking, "id">,
): PatientBooking | null {
  const time = normalizeTimeLabel(booking.time);
  const dateKey = booking.dateKey;
  const { doctorId } = booking;

  const existing = listPatientBookings();

  if (
    existing.some(
      (b) =>
        b.doctorId === doctorId && b.dateKey === dateKey && b.time === time,
    )
  ) {
    return null;
  }

  if (existing.some((b) => b.doctorId === doctorId && b.dateKey === dateKey)) {
    return null;
  }

  const entry: PatientBooking = {
    ...booking,
    time,
    id: `pb-${Date.now()}`,
  };
  const next = [...existing, entry];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
    void import("@/lib/shared/booking-queue-bridge").then(({ bridgePatientBookingToDoctorQueue }) =>
      bridgePatientBookingToDoctorQueue(entry, {
        reason: booking.reason?.trim() || (booking.visitType === "video" ? "Video consultation" : "In-person visit"),
        visitType: booking.visitType,
      }),
    );
  }
  return entry;
}

export function hasBookingForDoctorDay(doctorId: string, dateKey: string): boolean {
  return listPatientBookings().some(
    (b) => b.doctorId === doctorId && b.dateKey === dateKey,
  );
}

export function countPatientBookingsForSlot(
  doctorId: string,
  dateKey: string,
  time: string,
): number {
  return listPatientBookings().filter(
    (b) => b.doctorId === doctorId && b.dateKey === dateKey && b.time === time,
  ).length;
}

export function getBookableSlots(
  doctorId: string,
  dayIndex: number,
): BookableSlot[] {
  const dateKey = dateKeyForDayIndex(dayIndex);
  const patientBookings = listPatientBookings();
  const slots = getPublicDoctorSlots(doctorId);

  return slots.map((slot) => {
    const time = slot.time;
    const { displayTime, period } = formatSlotDisplayTime(time);
    const base = { time, displayTime, period, price: slot.price };

    if (!slot.enabled) {
      return { ...base, selectable: false, reason: "unavailable" as const };
    }

    const totalBooked =
      slot.bookedToday + countPatientBookingsForSlot(doctorId, dateKey, time);
    if (totalBooked >= slot.capacity) {
      return { ...base, selectable: false, reason: "full" as const };
    }

    const dayBooked = patientBookings.some(
      (b) => b.doctorId === doctorId && b.dateKey === dateKey,
    );
    if (dayBooked) {
      return { ...base, selectable: false, reason: "day_booked" as const };
    }

    if (
      patientBookings.some(
        (b) =>
          b.doctorId === doctorId && b.dateKey === dateKey && b.time === time,
      )
    ) {
      return { ...base, selectable: false, reason: "already_booked" as const };
    }

    const conflict = patientBookings.find(
      (b) =>
        b.dateKey === dateKey && b.time === time && b.doctorId !== doctorId,
    );
    if (conflict) {
      return {
        ...base,
        selectable: false,
        reason: "time_conflict" as const,
        conflictDoctorName: doctorNameById(conflict.doctorId),
      };
    }

    return { ...base, selectable: true };
  });
}

export function slotDisableLabel(reason?: SlotDisableReason): string | null {
  if (reason === "full") return "Full";
  if (reason === "already_booked") return "Booked";
  if (reason === "day_booked") return "Day booked";
  if (reason === "time_conflict") return "Conflict";
  if (reason === "unavailable") return "Closed";
  return null;
}

export function slotStatusDetail(slot: BookableSlot): string | null {
  const label = slotDisableLabel(slot.reason);
  if (!label) return null;
  if (slot.reason === "time_conflict" && slot.conflictDoctorName) {
    return `${label} · ${slot.conflictDoctorName}`;
  }
  return label;
}
