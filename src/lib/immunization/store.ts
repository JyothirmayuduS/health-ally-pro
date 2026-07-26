/**
 * Doctor immunization clinical store — administrations, reminders, AEFI,
 * deferrals & refusals. Persisted via hospital_desk_records (doctor desk).
 */
import { deskForKey, loadPersistedJson, savePersistedJson } from "@/lib/shared/persisted-store";
import { getSharedPatient } from "@/lib/shared/patients";
import { apkDoctor } from "@/lib/doctor-apk-data";
import {
  loadPatientReminders,
  savePatientReminders,
  type PatientReminder,
} from "@/lib/hospital-masters";
import type { ScheduleDose, VaccineRoute } from "./schedule";
import { SCHEDULE_DOSES } from "./schedule";

export type ImmStatus =
  | "administered"
  | "historical"
  | "deferred"
  | "refused"
  | "entered-in-error";

export type ImmunizationRecord = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  scheduleDoseId?: string;
  vaccine: string;
  shortName: string;
  doseLabel: string;
  doseNumber?: number;
  series?: string;
  status: ImmStatus;
  administeredAt: string; // ISO date or datetime
  route: VaccineRoute | string;
  site?: string;
  doseVolume?: string;
  brand?: string;
  manufacturer?: string;
  lotNumber?: string;
  expiryDate?: string;
  vaccinator: string;
  facility?: string;
  encounterId?: string;
  consentObtained: boolean;
  guardianName?: string;
  contraindicationsCleared: boolean;
  observationMins?: number;
  notes?: string;
  deferReason?: string;
  refuseReason?: string;
  createdAt: string;
  createdBy: string;
};

export type ImmReminder = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  phone: string;
  scheduleDoseId?: string;
  vaccine: string;
  shortName: string;
  dueDate: string;
  channel: "sms" | "whatsapp" | "call" | "app";
  note: string;
  status: "pending" | "sent" | "done" | "cancelled";
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
};

export type AefiSeverity = "mild" | "moderate" | "severe";

export type AefiRecord = {
  id: string;
  immunizationId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  vaccine: string;
  lotNumber?: string;
  onsetAt: string;
  severity: AefiSeverity;
  symptoms: string[];
  description: string;
  treatment?: string;
  outcome: "recovering" | "recovered" | "hospitalized" | "sequelae" | "unknown";
  reportedToAuthority: boolean;
  reportedAt: string;
  reportedBy: string;
};

const IMM_KEY = "medora-immunizations-v2";
const REM_KEY = "medora-immunization-reminders-v2";
const AEFI_KEY = "medora-immunization-aefi-v2";
export const IMM_STORE_EVENT = "medora-immunization-store-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(IMM_STORE_EVENT));
  }
}

function loadImm(): ImmunizationRecord[] {
  return loadPersistedJson(IMM_KEY, []);
}
function saveImm(list: ImmunizationRecord[]) {
  savePersistedJson(IMM_KEY, deskForKey(IMM_KEY), list);
  emit();
}
function loadRem(): ImmReminder[] {
  return loadPersistedJson(REM_KEY, []);
}
function saveRem(list: ImmReminder[]) {
  savePersistedJson(REM_KEY, deskForKey(REM_KEY), list);
  emit();
}
function loadAefi(): AefiRecord[] {
  return loadPersistedJson(AEFI_KEY, []);
}
function saveAefi(list: AefiRecord[]) {
  savePersistedJson(AEFI_KEY, deskForKey(AEFI_KEY), list);
  emit();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Seed realistic history so the workspace isn't empty on first open. */
function seedIfEmpty() {
  if (loadImm().length > 0) return;

  const kavya = getSharedPatient("MRN-100235");
  const ahaan = getSharedPatient("MRN-100239");
  const anjali = getSharedPatient("MRN-100231");
  const faraz = getSharedPatient("MRN-100232");
  const doctor = apkDoctor.name;
  const now = Date.now();

  const seed: ImmunizationRecord[] = [];

  if (kavya?.dob) {
    // Adolescent — most childhood given historically, Td-10 due-ish
    const hist: { id: string; at: string }[] = [
      { id: "BCG", at: "2014-12-06" },
      { id: "OPV-0", at: "2014-12-06" },
      { id: "HEPB-0", at: "2014-12-06" },
      { id: "PENTA-1", at: "2015-01-20" },
      { id: "PENTA-2", at: "2015-02-20" },
      { id: "PENTA-3", at: "2015-03-25" },
      { id: "MR-1", at: "2015-09-10" },
      { id: "MR-2", at: "2016-06-15" },
      { id: "DPT-B1", at: "2016-06-15" },
      { id: "DPT-B2", at: "2020-01-12" },
      { id: "MMR-2", at: "2020-01-12" },
    ];
    for (const h of hist) {
      const def = SCHEDULE_DOSES.find((d) => d.id === h.id);
      if (!def) continue;
      seed.push({
        id: uid("IMM"),
        patientId: kavya.id,
        patientName: kavya.name,
        mrn: kavya.mrn,
        scheduleDoseId: def.id,
        vaccine: def.vaccine,
        shortName: def.shortName,
        doseLabel: def.doseLabel,
        doseNumber: def.doseNumber,
        series: def.series,
        status: "historical",
        administeredAt: h.at,
        route: def.route,
        site: def.site,
        doseVolume: def.doseVolume,
        vaccinator: "Prior clinic",
        facility: "Outside / historical",
        consentObtained: true,
        contraindicationsCleared: true,
        notes: "Imported from parent vaccine card",
        createdAt: new Date(now - 86400000 * 30).toISOString(),
        createdBy: doctor,
      });
    }
  }

  if (ahaan?.dob) {
    // Infant on schedule through 14 weeks — 9–12 mo visit is what's due now
    const hist: { id: string; at: string }[] = [
      { id: "BCG", at: "2025-06-16" },
      { id: "OPV-0", at: "2025-06-16" },
      { id: "HEPB-0", at: "2025-06-16" },
      { id: "PENTA-1", at: "2025-08-01" },
      { id: "OPV-1", at: "2025-08-01" },
      { id: "IPV-1", at: "2025-08-01" },
      { id: "ROTA-1", at: "2025-08-01" },
      { id: "PCV-1", at: "2025-08-01" },
      { id: "PENTA-2", at: "2025-09-01" },
      { id: "OPV-2", at: "2025-09-01" },
      { id: "ROTA-2", at: "2025-09-01" },
      { id: "PCV-2", at: "2025-09-01" },
      { id: "PENTA-3", at: "2025-10-01" },
      { id: "OPV-3", at: "2025-10-01" },
      { id: "IPV-2", at: "2025-10-01" },
      { id: "ROTA-3", at: "2025-10-01" },
      { id: "PCV-3", at: "2025-10-01" },
    ];
    for (const h of hist) {
      const def = SCHEDULE_DOSES.find((d) => d.id === h.id);
      if (!def) continue;
      seed.push({
        id: uid("IMM"),
        patientId: ahaan.id,
        patientName: ahaan.name,
        mrn: ahaan.mrn,
        scheduleDoseId: def.id,
        vaccine: def.vaccine,
        shortName: def.shortName,
        doseLabel: def.doseLabel,
        doseNumber: def.doseNumber,
        series: def.series,
        status: "administered",
        administeredAt: h.at,
        route: def.route,
        site: def.site,
        doseVolume: def.doseVolume,
        manufacturer: "Serum Institute of India",
        lotNumber: `LOT-${def.shortName}-A1`,
        vaccinator: doctor,
        facility: "Oak Haven Medical",
        consentObtained: true,
        guardianName: "Priya Mehta",
        contraindicationsCleared: true,
        observationMins: 30,
        createdAt: new Date(now - 86400000 * 10).toISOString(),
        createdBy: doctor,
      });
    }
  }

  if (anjali) {
    seed.push({
      id: uid("IMM"),
      patientId: anjali.id,
      patientName: anjali.name,
      mrn: anjali.mrn,
      scheduleDoseId: "FLU-ANN",
      vaccine: "Influenza",
      shortName: "Flu",
      doseLabel: "Annual",
      series: "Flu",
      doseNumber: 1,
      status: "administered",
      administeredAt: new Date(now - 86400000 * 40).toISOString().slice(0, 10),
      route: "IM",
      site: "Left deltoid",
      doseVolume: "0.5 ml",
      brand: "Fluarix",
      manufacturer: "GSK",
      lotNumber: "LOT-V88",
      expiryDate: "2026-12-01",
      vaccinator: doctor,
      facility: "Oak Haven Medical",
      consentObtained: true,
      contraindicationsCleared: true,
      observationMins: 15,
      createdAt: new Date(now - 86400000 * 40).toISOString(),
      createdBy: doctor,
    });
  }

  if (faraz) {
    seed.push({
      id: uid("IMM"),
      patientId: faraz.id,
      patientName: faraz.name,
      mrn: faraz.mrn,
      scheduleDoseId: "PPSV23",
      vaccine: "Pneumococcal PPSV23",
      shortName: "PPSV23",
      doseLabel: "≥65y / risk",
      series: "PPSV",
      status: "deferred",
      administeredAt: new Date().toISOString().slice(0, 10),
      route: "IM",
      vaccinator: doctor,
      consentObtained: false,
      contraindicationsCleared: false,
      deferReason: "Acute febrile illness — reschedule in 2 weeks",
      createdAt: new Date().toISOString(),
      createdBy: doctor,
    });
  }

  saveImm(seed);

  // Reminders for due doses
  const remSeed: ImmReminder[] = [];
  if (ahaan) {
    remSeed.push({
      id: uid("IR"),
      patientId: ahaan.id,
      patientName: ahaan.name,
      mrn: ahaan.mrn,
      phone: ahaan.phone,
      scheduleDoseId: "PENTA-2",
      vaccine: "Pentavalent (DPT-HepB-Hib)",
      shortName: "Penta-2",
      dueDate: new Date(now + 86400000 * 3).toISOString().slice(0, 10),
      channel: "whatsapp",
      note: "10-week visit — Penta-2, OPV-2, Rota-2, PCV-2",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
  if (kavya) {
    remSeed.push({
      id: uid("IR"),
      patientId: kavya.id,
      patientName: kavya.name,
      mrn: kavya.mrn,
      phone: kavya.phone,
      scheduleDoseId: "TD-10",
      vaccine: "Td / Tdap",
      shortName: "Td-10y",
      dueDate: new Date(now + 86400000 * 14).toISOString().slice(0, 10),
      channel: "sms",
      note: "Adolescent Td booster due",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    remSeed.push({
      id: uid("IR"),
      patientId: kavya.id,
      patientName: kavya.name,
      mrn: kavya.mrn,
      phone: kavya.phone,
      scheduleDoseId: "HPV-1",
      vaccine: "HPV",
      shortName: "HPV-1",
      dueDate: new Date(now + 86400000 * 21).toISOString().slice(0, 10),
      channel: "whatsapp",
      note: "HPV series start — discuss with parent",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
  if (anjali) {
    remSeed.push({
      id: uid("IR"),
      patientId: anjali.id,
      patientName: anjali.name,
      mrn: anjali.mrn,
      phone: anjali.phone,
      scheduleDoseId: "FLU-ANN",
      vaccine: "Influenza",
      shortName: "Flu",
      dueDate: new Date(now + 86400000 * 320).toISOString().slice(0, 10),
      channel: "app",
      note: "Next season flu shot",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
  if (remSeed.length) saveRem(remSeed);
}

seedIfEmpty();

// ── Public API ───────────────────────────────────────────────────────────────

export function listImmunizations(patientId?: string): ImmunizationRecord[] {
  seedIfEmpty();
  const all = loadImm().filter((r) => r.status !== "entered-in-error");
  if (!patientId) return all.sort((a, b) => b.administeredAt.localeCompare(a.administeredAt));
  return all
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.administeredAt.localeCompare(a.administeredAt));
}

export function listReminders(opts?: {
  patientId?: string;
  status?: ImmReminder["status"];
}): ImmReminder[] {
  seedIfEmpty();
  let list = loadRem();
  if (opts?.patientId) list = list.filter((r) => r.patientId === opts.patientId);
  if (opts?.status) list = list.filter((r) => r.status === opts.status);
  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function listAefi(patientId?: string): AefiRecord[] {
  seedIfEmpty();
  const all = loadAefi();
  if (!patientId) return all.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  return all
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

export function givenDoseIds(patientId: string): Set<string> {
  return new Set(
    listImmunizations(patientId)
      .filter((r) => (r.status === "administered" || r.status === "historical") && r.scheduleDoseId)
      .map((r) => r.scheduleDoseId!),
  );
}

export function deferredDoseIds(patientId: string): Set<string> {
  return new Set(
    listImmunizations(patientId)
      .filter((r) => r.status === "deferred" && r.scheduleDoseId)
      .map((r) => r.scheduleDoseId!),
  );
}

export function refusedDoseIds(patientId: string): Set<string> {
  return new Set(
    listImmunizations(patientId)
      .filter((r) => r.status === "refused" && r.scheduleDoseId)
      .map((r) => r.scheduleDoseId!),
  );
}

export type AdministerInput = {
  patientId: string;
  dose: ScheduleDose;
  administeredAt: string;
  route: string;
  site?: string;
  doseVolume?: string;
  brand?: string;
  manufacturer?: string;
  lotNumber?: string;
  expiryDate?: string;
  vaccinator?: string;
  guardianName?: string;
  consentObtained: boolean;
  contraindicationsCleared: boolean;
  observationMins?: number;
  notes?: string;
  encounterId?: string;
  asHistorical?: boolean;
};

export function administerVaccine(input: AdministerInput): ImmunizationRecord {
  const p = getSharedPatient(input.patientId);
  if (!p) throw new Error("Patient not found");
  const rec: ImmunizationRecord = {
    id: uid("IMM"),
    patientId: p.id,
    patientName: p.name,
    mrn: p.mrn,
    scheduleDoseId: input.dose.id,
    vaccine: input.dose.vaccine,
    shortName: input.dose.shortName,
    doseLabel: input.dose.doseLabel,
    doseNumber: input.dose.doseNumber,
    series: input.dose.series,
    status: input.asHistorical ? "historical" : "administered",
    administeredAt: input.administeredAt,
    route: input.route,
    site: input.site,
    doseVolume: input.doseVolume || input.dose.doseVolume,
    brand: input.brand,
    manufacturer: input.manufacturer,
    lotNumber: input.lotNumber,
    expiryDate: input.expiryDate,
    vaccinator: input.vaccinator || apkDoctor.name,
    facility: "Oak Haven Medical",
    encounterId: input.encounterId,
    consentObtained: input.consentObtained,
    guardianName: input.guardianName,
    contraindicationsCleared: input.contraindicationsCleared,
    observationMins: input.observationMins,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    createdBy: apkDoctor.name,
  };
  const list = loadImm();
  list.unshift(rec);
  saveImm(list);

  // Auto-complete matching pending reminders
  const rems = loadRem().map((r) => {
    if (
      r.patientId === p.id &&
      r.status === "pending" &&
      (r.scheduleDoseId === input.dose.id || r.shortName === input.dose.shortName)
    ) {
      return { ...r, status: "done" as const, completedAt: new Date().toISOString() };
    }
    return r;
  });
  saveRem(rems);
  syncReceptionReminderDone(p.mrn, input.dose.shortName);

  return rec;
}

export function deferVaccine(input: {
  patientId: string;
  dose: ScheduleDose;
  reason: string;
  rescheduleDate?: string;
}): ImmunizationRecord {
  const p = getSharedPatient(input.patientId);
  if (!p) throw new Error("Patient not found");
  const rec: ImmunizationRecord = {
    id: uid("IMM"),
    patientId: p.id,
    patientName: p.name,
    mrn: p.mrn,
    scheduleDoseId: input.dose.id,
    vaccine: input.dose.vaccine,
    shortName: input.dose.shortName,
    doseLabel: input.dose.doseLabel,
    doseNumber: input.dose.doseNumber,
    series: input.dose.series,
    status: "deferred",
    administeredAt: new Date().toISOString().slice(0, 10),
    route: input.dose.route,
    doseVolume: input.dose.doseVolume,
    vaccinator: apkDoctor.name,
    consentObtained: false,
    contraindicationsCleared: false,
    deferReason: input.reason,
    createdAt: new Date().toISOString(),
    createdBy: apkDoctor.name,
  };
  const list = loadImm();
  list.unshift(rec);
  saveImm(list);
  if (input.rescheduleDate) {
    createReminder({
      patientId: p.id,
      dose: input.dose,
      dueDate: input.rescheduleDate,
      note: `Deferred: ${input.reason}`,
      channel: "whatsapp",
    });
  }
  return rec;
}

export function refuseVaccine(input: {
  patientId: string;
  dose: ScheduleDose;
  reason: string;
}): ImmunizationRecord {
  const p = getSharedPatient(input.patientId);
  if (!p) throw new Error("Patient not found");
  const rec: ImmunizationRecord = {
    id: uid("IMM"),
    patientId: p.id,
    patientName: p.name,
    mrn: p.mrn,
    scheduleDoseId: input.dose.id,
    vaccine: input.dose.vaccine,
    shortName: input.dose.shortName,
    doseLabel: input.dose.doseLabel,
    status: "refused",
    administeredAt: new Date().toISOString().slice(0, 10),
    route: input.dose.route,
    vaccinator: apkDoctor.name,
    consentObtained: false,
    contraindicationsCleared: true,
    refuseReason: input.reason,
    createdAt: new Date().toISOString(),
    createdBy: apkDoctor.name,
  };
  const list = loadImm();
  list.unshift(rec);
  saveImm(list);
  return rec;
}

export function createReminder(input: {
  patientId: string;
  dose: ScheduleDose;
  dueDate: string;
  note?: string;
  channel?: ImmReminder["channel"];
}): ImmReminder {
  const p = getSharedPatient(input.patientId);
  if (!p) throw new Error("Patient not found");
  const rem: ImmReminder = {
    id: uid("IR"),
    patientId: p.id,
    patientName: p.name,
    mrn: p.mrn,
    phone: p.phone,
    scheduleDoseId: input.dose.id,
    vaccine: input.dose.vaccine,
    shortName: input.dose.shortName,
    dueDate: input.dueDate,
    channel: input.channel || "whatsapp",
    note: input.note || `${input.dose.shortName} due`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const list = loadRem();
  list.unshift(rem);
  saveRem(list);
  pushReceptionReminder(rem);
  return rem;
}

export function markReminderSent(id: string) {
  const list = loadRem().map((r) =>
    r.id === id ? { ...r, status: "sent" as const, sentAt: new Date().toISOString() } : r,
  );
  saveRem(list);
}

export function markReminderDone(id: string) {
  const list = loadRem().map((r) =>
    r.id === id ? { ...r, status: "done" as const, completedAt: new Date().toISOString() } : r,
  );
  saveRem(list);
}

export function cancelReminder(id: string) {
  const list = loadRem().map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r));
  saveRem(list);
}

export function reportAefi(input: {
  immunizationId: string;
  onsetAt: string;
  severity: AefiSeverity;
  symptoms: string[];
  description: string;
  treatment?: string;
  outcome: AefiRecord["outcome"];
  reportedToAuthority: boolean;
}): AefiRecord {
  const imm = loadImm().find((r) => r.id === input.immunizationId);
  if (!imm) throw new Error("Immunization not found");
  const rec: AefiRecord = {
    id: uid("AEFI"),
    immunizationId: imm.id,
    patientId: imm.patientId,
    patientName: imm.patientName,
    mrn: imm.mrn,
    vaccine: imm.vaccine,
    lotNumber: imm.lotNumber,
    onsetAt: input.onsetAt,
    severity: input.severity,
    symptoms: input.symptoms,
    description: input.description,
    treatment: input.treatment,
    outcome: input.outcome,
    reportedToAuthority: input.reportedToAuthority,
    reportedAt: new Date().toISOString(),
    reportedBy: apkDoctor.name,
  };
  const list = loadAefi();
  list.unshift(rec);
  saveAefi(list);
  return rec;
}

function pushReceptionReminder(rem: ImmReminder) {
  try {
    const list = loadPatientReminders();
    const exists = list.some(
      (r) => r.mrn === rem.mrn && r.type === "vaccine" && r.dueDate === rem.dueDate && !r.done,
    );
    if (exists) return;
    const row: PatientReminder = {
      id: rem.id,
      patientName: rem.patientName,
      mrn: rem.mrn,
      phone: rem.phone,
      type: "vaccine",
      dueDate: rem.dueDate,
      note: `${rem.shortName} — ${rem.note}`,
      done: false,
    };
    savePatientReminders([row, ...list]);
  } catch {
    /* masters may be unavailable in tests */
  }
}

function syncReceptionReminderDone(mrn: string, shortName: string) {
  try {
    const list = loadPatientReminders().map((r) => {
      if (r.mrn === mrn && r.type === "vaccine" && !r.done && r.note.includes(shortName)) {
        return { ...r, done: true };
      }
      return r;
    });
    savePatientReminders(list);
  } catch {
    /* ignore */
  }
}
