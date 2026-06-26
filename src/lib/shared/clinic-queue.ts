import { resolvePatientId } from "./patients";

export type ClinicQueueEntry = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  tokenNumber: number;
  status: "waiting" | "in-consultation" | "completed";
  checkInTime: string;
  waitMinutes: number;
  encounterId?: string;
};

/** Doctor portal user maps to reception doctor row */
export const DOCTOR_PORTAL_STAFF_ID = "DOC-001";

const KEY = "medora-clinic-queue-v1";
export const CLINIC_QUEUE_EVENT = "medora-clinic-queue-updated";

const SEED: ClinicQueueEntry[] = [
  {
    id: "dq1",
    appointmentId: "da1",
    patientId: "MRN-100231",
    doctorId: "DOC-001",
    tokenNumber: 101,
    status: "in-consultation",
    checkInTime: "08:55",
    waitMinutes: 0,
    encounterId: undefined,
  },
  {
    id: "dq2",
    appointmentId: "APT-50013",
    patientId: "MRN-100232",
    doctorId: "DOC-001",
    tokenNumber: 102,
    status: "waiting",
    checkInTime: "09:30",
    waitMinutes: 12,
  },
];

function load(): ClinicQueueEntry[] {
  if (typeof window === "undefined") return [...SEED];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    return JSON.parse(raw) as ClinicQueueEntry[];
  } catch {
    return [...SEED];
  }
}

function save(list: ClinicQueueEntry[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(CLINIC_QUEUE_EVENT));
  }
}

export function listClinicQueue(doctorId?: string): ClinicQueueEntry[] {
  const all = load();
  if (!doctorId) return all;
  return all.filter((e) => e.doctorId === doctorId);
}

export function enqueueFromCheckIn(input: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  tokenNumber: number;
  encounterId?: string;
}): ClinicQueueEntry {
  const pid = resolvePatientId(input.patientId);
  const now = new Date();
  const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const list = load();
  const existing = list.find((e) => e.appointmentId === input.appointmentId);
  if (existing) {
    const updated = {
      ...existing,
      tokenNumber: input.tokenNumber,
      status: "waiting" as const,
      encounterId: input.encounterId ?? existing.encounterId,
    };
    const idx = list.findIndex((e) => e.id === existing.id);
    list[idx] = updated;
    save(list);
    return updated;
  }
  const entry: ClinicQueueEntry = {
    id: `q-${Date.now()}`,
    appointmentId: input.appointmentId,
    patientId: pid,
    doctorId: input.doctorId,
    tokenNumber: input.tokenNumber,
    status: "waiting",
    checkInTime,
    waitMinutes: 0,
    encounterId: input.encounterId,
  };
  list.push(entry);
  save(list);
  return entry;
}

export function updateQueueEntry(id: string, patch: Partial<ClinicQueueEntry>) {
  const list = load();
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  save(list);
}

export function updateQueueByAppointment(appointmentId: string, patch: Partial<ClinicQueueEntry>) {
  const list = load();
  const idx = list.findIndex((e) => e.appointmentId === appointmentId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  save(list);
}

export function doctorPatientIdFromMrn(mrn: string): string {
  const map: Record<string, string> = {
    "MRN-100231": "dp1",
    "MRN-100232": "dp2",
    "MRN-100233": "dp3",
    "MRN-100234": "dp4",
  };
  return map[mrn] ?? mrn;
}

export function mrnFromDoctorPatientId(dpId: string): string {
  const map: Record<string, string> = {
    dp1: "MRN-100231",
    dp2: "MRN-100232",
    dp3: "MRN-100233",
    dp4: "MRN-100234",
  };
  return map[dpId] ?? resolvePatientId(dpId);
}
