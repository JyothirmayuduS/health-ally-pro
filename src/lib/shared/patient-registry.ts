import { SHARED_PATIENTS, type SharedPatient } from "./patients";

const KEY = "medora-patient-registry-v1";
let mrnSeq = 100239;

export const PATIENT_REGISTRY_EVENT = "medora-patient-registry-updated";

function nextMrn() {
  const id = `MRN-${mrnSeq}`;
  mrnSeq += 1;
  return id;
}

function read(): SharedPatient[] {
  if (typeof window === "undefined") return [...SHARED_PATIENTS];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [...SHARED_PATIENTS];
    const parsed = JSON.parse(raw) as SharedPatient[];
    const byId = new Map<string, SharedPatient>();
    for (const p of SHARED_PATIENTS) byId.set(p.id, p);
    for (const p of parsed) byId.set(p.id, p);
    return Array.from(byId.values());
  } catch {
    return [...SHARED_PATIENTS];
  }
}

function write(list: SharedPatient[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(PATIENT_REGISTRY_EVENT));
  }
}

export function loadPatientRegistry(): SharedPatient[] {
  return read();
}

export function savePatientRegistry(list: SharedPatient[]) {
  write(list);
}

export function registerPatient(
  input: Omit<SharedPatient, "id" | "mrn"> & { id?: string; mrn?: string },
): SharedPatient {
  const list = read();
  const mrn = input.mrn ?? nextMrn();
  const patient: SharedPatient = {
    ...input,
    id: input.id ?? mrn,
    mrn,
    allergies: input.allergies ?? "—",
    balance: input.balance ?? 0,
    createdAt: input.createdAt ?? new Date().toISOString().slice(0, 10),
  };
  list.unshift(patient);
  write(list);
  return patient;
}

export function updatePatientRegistry(id: string, patch: Partial<SharedPatient>) {
  const list = read();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  write(list);
}

/** Demo patient for patient portal ↔ staff bridge */
export const PORTAL_DEMO_PATIENT_ID = "MRN-100231";
