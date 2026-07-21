import type { HospitalDoctorRecord, SpecialtyId } from "./types";
import { getSpecialty, resolveSpecialtyId } from "./catalog";
import { DEFAULT_SERVICES } from "@/lib/shared/services";

const STORAGE_KEY = "medora-hospital-doctors-v2";
const EVENT = "medora-hospital-doctors-updated";
const LEGACY_KEY = "medora-hospital-doctors-v1";

function nowIso() {
  return new Date().toISOString();
}

function nextDoctorId(existing: HospitalDoctorRecord[]): string {
  const nums = existing
    .map((d) => Number.parseInt(d.doctorId.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `DOC-${String(max + 1).padStart(3, "0")}`;
}

/** Seed from legacy service fees + link demo doctor login to general medicine by default */
function seedDoctors(): HospitalDoctorRecord[] {
  const ts = nowIso();
  const fromFees: HospitalDoctorRecord[] = DEFAULT_SERVICES.map((s, i) => ({
    doctorId: s.doctorId,
    name: s.doctorName,
    email: `${s.doctorId.toLowerCase()}@oakhaven.demo`,
    specialtyId: resolveSpecialtyId(s.specialty),
    room: `OPD-${i + 1}`,
    fee: s.fee,
    active: true,
    createdAt: ts,
    updatedAt: ts,
    // Map DOC-001 (General Medicine) to the demo doctor login
    authUserId: s.doctorId === "DOC-001" ? "demo-doctor" : undefined,
  }));

  // Extra specialty doctors so multi-specialty desks are demoable
  const extras: Omit<HospitalDoctorRecord, "createdAt" | "updatedAt" | "doctorId">[] = [
    {
      name: "Dr. Meera Joshi",
      email: "ophthalmology@oakhaven.demo",
      specialtyId: "ophthalmology",
      room: "Eye-1",
      fee: 900,
      active: true,
      authUserId: "demo-doctor-ophtho",
      registrationNo: "MCI-OPH-2210",
    },
    {
      name: "Dr. Vikram Shah",
      email: "cardiology@oakhaven.demo",
      specialtyId: "cardiology",
      room: "Cardio-1",
      fee: 1800,
      active: true,
      authUserId: "demo-doctor-cardio",
      registrationNo: "MCI-CARD-1102",
    },
    {
      name: "Dr. Priya Nair",
      email: "pediatrics@oakhaven.demo",
      specialtyId: "pediatrics",
      room: "Peds-1",
      fee: 800,
      active: true,
      authUserId: "demo-doctor-peds",
    },
    {
      name: "Dr. Rohan Bhatt",
      email: "orthopedics@oakhaven.demo",
      specialtyId: "orthopedics",
      room: "Ortho-1",
      fee: 1200,
      active: true,
      authUserId: "demo-doctor-ortho",
    },
  ];

  const baseIds = new Set(fromFees.map((d) => d.specialtyId));
  const merged = [...fromFees];
  for (const ex of extras) {
    // Prefer linking existing fee doctor by specialty when present
    const existing = merged.find((d) => d.specialtyId === ex.specialtyId && !d.authUserId?.startsWith("demo-doctor-"));
    if (existing && ex.authUserId) {
      existing.authUserId = ex.authUserId;
      existing.email = ex.email;
      existing.room = ex.room;
      continue;
    }
    if (baseIds.has(ex.specialtyId) && merged.some((d) => d.email === ex.email)) continue;
    merged.push({
      ...ex,
      doctorId: nextDoctorId(merged),
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Ensure demo-doctor always resolves
  if (!merged.some((d) => d.authUserId === "demo-doctor")) {
    merged[0] = { ...merged[0], authUserId: "demo-doctor", email: "doctor@oakhaven.demo" };
  } else {
    const linked = merged.find((d) => d.authUserId === "demo-doctor");
    if (linked) linked.email = "doctor@oakhaven.demo";
  }

  return merged;
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function loadHospitalDoctors(): HospitalDoctorRecord[] {
  if (typeof window === "undefined") return seedDoctors();
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // migrate / ignore legacy key and reseed with specialty links
      localStorage.removeItem(LEGACY_KEY);
      const seeded = seedDoctors();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as HospitalDoctorRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = seedDoctors();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    return seedDoctors();
  }
}

export function saveHospitalDoctors(doctors: HospitalDoctorRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
  emit();
}

export function subscribeHospitalDoctors(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export type AddDoctorInput = {
  name: string;
  email: string;
  specialtyId: SpecialtyId;
  room?: string;
  fee?: number;
  phone?: string;
  registrationNo?: string;
  authUserId?: string;
  active?: boolean;
};

export function addHospitalDoctor(input: AddDoctorInput): HospitalDoctorRecord {
  const list = loadHospitalDoctors();
  const specialty = getSpecialty(input.specialtyId);
  const ts = nowIso();
  const record: HospitalDoctorRecord = {
    doctorId: nextDoctorId(list),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    specialtyId: input.specialtyId,
    room: input.room?.trim() || specialty.unitLabel,
    fee: input.fee ?? specialty.defaultFee,
    phone: input.phone?.trim(),
    registrationNo: input.registrationNo?.trim(),
    active: input.active ?? true,
    authUserId: input.authUserId,
    createdAt: ts,
    updatedAt: ts,
  };
  saveHospitalDoctors([record, ...list]);
  return record;
}

export function updateHospitalDoctor(
  doctorId: string,
  patch: Partial<Omit<HospitalDoctorRecord, "doctorId" | "createdAt">>,
): HospitalDoctorRecord | null {
  const list = loadHospitalDoctors();
  const idx = list.findIndex((d) => d.doctorId === doctorId);
  if (idx < 0) return null;
  const next = {
    ...list[idx],
    ...patch,
    updatedAt: nowIso(),
  };
  list[idx] = next;
  saveHospitalDoctors(list);
  return next;
}

export function setDoctorSpecialty(doctorId: string, specialtyId: SpecialtyId) {
  return updateHospitalDoctor(doctorId, { specialtyId });
}

export function findDoctorByAuthUserId(authUserId: string): HospitalDoctorRecord | null {
  return loadHospitalDoctors().find((d) => d.authUserId === authUserId && d.active) ?? null;
}

export function findDoctorByEmail(email: string): HospitalDoctorRecord | null {
  const e = email.trim().toLowerCase();
  return loadHospitalDoctors().find((d) => d.email === e && d.active) ?? null;
}

export function getDoctorSpecialtyId(authUserId?: string | null, email?: string | null): SpecialtyId {
  if (authUserId) {
    const byAuth = findDoctorByAuthUserId(authUserId);
    if (byAuth) return byAuth.specialtyId;
  }
  if (email) {
    const byEmail = findDoctorByEmail(email);
    if (byEmail) return byEmail.specialtyId;
  }
  return "general_medicine";
}
