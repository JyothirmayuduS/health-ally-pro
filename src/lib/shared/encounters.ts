import { getSharedPatient, resolvePatientId } from "./patients";

export type EncounterSoap = {
  complaint?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  signedAt?: string;
};

export type Encounter = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  date: string;
  status: "open" | "closed";
  chiefComplaint?: string;
  appointmentId?: string;
  doctorName?: string;
  invoiceIds: string[];
  labOrderIds: string[];
  rxIds: string[];
  soap?: EncounterSoap;
  createdAt: string;
};

const KEY = "medora-encounters-v1";
export const ENCOUNTERS_EVENT = "medora-encounters-updated";
let seq = 500;

export function nextEncounterId() {
  seq += 1;
  return `ENC-${seq}`;
}

function load(): Encounter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Encounter[]) : [];
  } catch {
    return [];
  }
}

function save(list: Encounter[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(ENCOUNTERS_EVENT));
  }
}

export function listEncounters(): Encounter[] {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getEncounter(id: string) {
  return load().find((e) => e.id === id);
}

export function openEncounter(input: {
  patientId: string;
  chiefComplaint?: string;
  appointmentId?: string;
  doctorName?: string;
}): Encounter {
  const pid = resolvePatientId(input.patientId);
  const p = getSharedPatient(pid);
  const enc: Encounter = {
    id: nextEncounterId(),
    patientId: pid,
    patientName: p?.name ?? "Unknown",
    mrn: p?.mrn ?? pid,
    date: new Date().toISOString().slice(0, 10),
    status: "open",
    chiefComplaint: input.chiefComplaint,
    appointmentId: input.appointmentId,
    doctorName: input.doctorName,
    invoiceIds: [],
    labOrderIds: [],
    rxIds: [],
    createdAt: new Date().toISOString(),
  };
  const list = load();
  list.unshift(enc);
  save(list);
  return enc;
}

export function linkToEncounter(
  encounterId: string,
  link: { invoiceId?: string; labOrderId?: string; rxId?: string },
) {
  const list = load();
  const idx = list.findIndex((e) => e.id === encounterId);
  if (idx < 0) return;
  const e = { ...list[idx] };
  if (link.invoiceId && !e.invoiceIds.includes(link.invoiceId)) e.invoiceIds.push(link.invoiceId);
  if (link.labOrderId && !e.labOrderIds.includes(link.labOrderId)) e.labOrderIds.push(link.labOrderId);
  if (link.rxId && !e.rxIds.includes(link.rxId)) e.rxIds.push(link.rxId);
  list[idx] = e;
  save(list);
}

export function findOpenEncounterForPatient(patientId: string): Encounter | undefined {
  const pid = resolvePatientId(patientId);
  return load().find((e) => e.patientId === pid && e.status === "open");
}

export function closeEncounter(id: string) {
  const list = load();
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], status: "closed" };
  save(list);
}

export function saveEncounterSoap(id: string, soap: EncounterSoap, close = false) {
  const list = load();
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return;
  const e = { ...list[idx], soap: { ...list[idx].soap, ...soap } };
  if (close || soap.signedAt) e.status = "closed";
  list[idx] = e;
  save(list);
  return e;
}

export function openEncounterForCheckIn(input: {
  patientId: string;
  appointmentId: string;
  doctorName?: string;
  chiefComplaint?: string;
}): Encounter {
  const existing = load().find(
    (e) =>
      e.appointmentId === input.appointmentId ||
      (e.patientId === resolvePatientId(input.patientId) && e.status === "open"),
  );
  if (existing) return existing;
  return openEncounter({
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    doctorName: input.doctorName,
    chiefComplaint: input.chiefComplaint,
  });
}
