import { getProfileStore } from "@/lib/doctor-profile-store";
import {
  DEFAULT_SCHEDULE,
  type ScheduleSlot,
} from "@/lib/doctor-profile-workspace";

/** Dr. Eleanor Thorne (d1) shares live slot capacity with the doctor portal schedule. */
const ELEANOR_DOCTOR_ID = "d1";

const GENERIC_SLOT_TIMES = [
  "09:00",
  "09:30",
  "11:15",
  "14:00",
  "14:30",
  "15:15",
  "16:00",
] as const;

function genericSlots(price = 800): ScheduleSlot[] {
  return GENERIC_SLOT_TIMES.map((time, i) => ({
    id: `g${i}`,
    time,
    price: time >= "14:00" ? price + 100 : price,
    capacity: 2,
    bookedToday: 0,
    inPerson: true,
    video: true,
    enabled: true,
  }));
}

/** Slots exposed to patients — capacity comes from the doctor schedule. */
export function getPublicDoctorSlots(doctorId: string): ScheduleSlot[] {
  if (doctorId === ELEANOR_DOCTOR_ID) {
    const live = getProfileStore().schedule.slots.filter((s) => s.enabled);
    if (live.length > 0) return live;
    return DEFAULT_SCHEDULE.slots.filter((s) => s.enabled);
  }
  return genericSlots();
}

export function slotPeriod(time: string): "AM" | "PM" {
  const hour = Number.parseInt(time.split(":")[0] ?? "0", 10);
  return hour < 12 ? "AM" : "PM";
}
