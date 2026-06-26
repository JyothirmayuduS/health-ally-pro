import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import type { PrescriptionDraft } from "@/lib/doctor-prescription-workflow";
import { PORTAL_DEMO_PATIENT_ID } from "@/lib/shared/patient-registry";
import { resolvePatientId } from "@/lib/shared/patients";
import type { PatientRxSyncEnvelope } from "@/lib/shared/patient-rx-sync-types";

export type PatientRxSnapshot = {
  name: string;
  age: number;
  gender: "M" | "F";
  patientRef: string;
  allergyWarning?: string;
};

export type PatientRxRecord = {
  id: string;
  rx_number: string;
  patientId: string;
  panelPatientId?: string;
  patientSnapshot: PatientRxSnapshot;
  draft: PrescriptionDraft;
  doctor_name: string;
  doctor_specialty: string;
  sent_at: string;
  status: "active" | "dispensed" | "expired" | "cancelled" | "amended";
  cancelled_at?: string;
  cancel_reason?: string;
  amended_at?: string;
  amended_from_rx_number?: string;
};

export const PATIENT_RX_EVENT = "medora-patient-rx-updated";

const STORAGE_KEY = "medora_patient_prescriptions_v1";

function readAll(): PatientRxRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PatientRxRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: PatientRxRecord[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(PATIENT_RX_EVENT));
  }
}

function seedIfEmpty() {
  const items = readAll();
  if (items.length > 0) return items;

  const seed: PatientRxRecord = {
    id: "rx-patient-seed-1",
    rx_number: "RX-2025-501",
    patientId: PORTAL_DEMO_PATIENT_ID,
    panelPatientId: "p1",
    patientSnapshot: {
      name: "Anjali Krishnan",
      age: 36,
      gender: "F",
      patientRef: "MRN-100231",
      allergyWarning: "Penicillin",
    },
    draft: {
      patientId: "p1",
      diagnosis: "Upper respiratory tract infection",
      diagnosisIcd: "J06.9",
      lines: [
        {
          key: "seed-1",
          drug_id: "drug-azt250",
          sig: "250 mg/5 mL oral OD x 5 days",
          qty_prescribed: 30,
          days_supply: 5,
          refills_allowed: 0,
          route: "Oral",
          frequency: "OD",
          timing: ["After food"],
          durationDays: 5,
          allowGeneric: true,
          drugNotes: "",
        },
      ],
      patientInstructions: "Rest and adequate fluids. Return if fever persists beyond 3 days.",
      instructionTags: ["Rest", "Hydration"],
      pharmacistNotes: "",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      rxType: "regular",
      followUpRequired: false,
      followUpNote: "",
      pharmacyId: "oak-central",
      patientLanguage: "en",
      printInPatientLanguage: false,
      priority: "routine",
      updatedAt: new Date().toISOString(),
    },
    doctor_name: "Dr. Rajesh Mehta",
    doctor_specialty: "Internal Medicine",
    sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "active",
  };

  writeAll([seed]);
  return [seed];
}

export function listPatientPrescriptions(patientId?: string): PatientRxRecord[] {
  const canonical = patientId ? resolvePatientId(patientId) : PORTAL_DEMO_PATIENT_ID;
  const items = seedIfEmpty();
  return items
    .filter((r) => r.patientId === canonical || r.panelPatientId === patientId)
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
}

export function getPatientPrescription(rxId: string): PatientRxRecord | undefined {
  return seedIfEmpty().find((r) => r.id === rxId || r.rx_number === rxId);
}

export function pushPatientPrescription(input: Omit<PatientRxRecord, "id" | "status"> & { id?: string; status?: PatientRxRecord["status"] }) {
  const record: PatientRxRecord = {
    ...input,
    id: input.id ?? `rx-patient-${Date.now()}`,
    patientId: resolvePatientId(input.patientId),
    status: input.status ?? "active",
  };
  const items = readAll();
  items.unshift(record);
  writeAll(items);

  if (typeof window !== "undefined") {
    void import("@/lib/shared/patient-rx-sync").then(({ publishPatientRxSync, rxRecordToSyncEnvelope }) =>
      publishPatientRxSync(rxRecordToSyncEnvelope(record)),
    );
  }

  return record;
}

function envelopeToDraft(envelope: PatientRxSyncEnvelope): PrescriptionDraft {
  return {
    patientId: envelope.patientId,
    diagnosis: envelope.diagnosis,
    diagnosisIcd: envelope.diagnosisIcd,
    lines: envelope.lines.map((line, i) => ({
      key: `sync-${line.drug_id}-${i}`,
      drug_id: line.drug_id,
      sig: line.sig,
      qty_prescribed: line.qty_prescribed,
      days_supply: line.days_supply,
      refills_allowed: 0,
      route: "Oral",
      frequency: "OD",
      timing: [],
      durationDays: line.days_supply,
      allowGeneric: true,
      drugNotes: "",
    })),
    patientInstructions: envelope.patientInstructions ?? "",
    instructionTags: [],
    pharmacistNotes: "",
    validFrom: envelope.sent_at.slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    rxType: "regular",
    followUpRequired: false,
    followUpNote: "",
    pharmacyId: "oak-central",
    patientLanguage: "en",
    printInPatientLanguage: false,
    priority: "routine",
    updatedAt: envelope.sent_at,
  };
}

export function upsertPatientPrescriptionFromSync(envelope: PatientRxSyncEnvelope): PatientRxRecord {
  const items = seedIfEmpty();
  const existingIdx = items.findIndex((r) => r.rx_number === envelope.rx_number);
  const record: PatientRxRecord = {
    id: envelope.id,
    rx_number: envelope.rx_number,
    patientId: resolvePatientId(envelope.patientId),
    patientSnapshot: {
      name: envelope.patientName,
      age: 0,
      gender: "F",
      patientRef: envelope.patientRef,
    },
    draft: envelopeToDraft(envelope),
    doctor_name: envelope.doctor_name,
    doctor_specialty: envelope.doctor_specialty,
    sent_at: envelope.sent_at,
    status: envelope.status,
  };

  if (existingIdx >= 0) {
    items[existingIdx] = record;
  } else {
    items.unshift(record);
  }
  writeAll(items);
  return record;
}

export function panelPatientToSnapshot(p: PanelPatient): PatientRxSnapshot {
  return {
    name: p.name,
    age: p.age,
    gender: p.gender,
    patientRef: p.patientRef,
    allergyWarning: p.allergyWarning,
  };
}

export function snapshotToPanelPatient(snapshot: PatientRxSnapshot, ids: { patientId: string; panelPatientId?: string }): PanelPatient {
  return {
    id: ids.panelPatientId ?? ids.patientId,
    name: snapshot.name,
    initials: snapshot.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    condition: "—",
    age: snapshot.age,
    gender: snapshot.gender,
    patientRef: snapshot.patientRef,
    status: "Stable",
    timeline: "",
    accent: "#2C7873",
    categories: ["all"],
    pills: [],
    priority: 0,
    visits: 0,
    rxCount: 0,
    lastSeen: "—",
    allergyWarning: snapshot.allergyWarning,
  };
}

export function cancelPatientPrescription(rxNumber: string, reason?: string): PatientRxRecord | undefined {
  const items = seedIfEmpty();
  const idx = items.findIndex((r) => r.rx_number === rxNumber && r.status === "active");
  if (idx < 0) return undefined;
  items[idx] = {
    ...items[idx],
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancel_reason: reason?.trim() || "Cancelled by prescriber",
  };
  writeAll(items);
  return items[idx];
}

export function flagPatientPrescriptionAmended(rxNumber: string): PatientRxRecord | undefined {
  const items = seedIfEmpty();
  const idx = items.findIndex((r) => r.rx_number === rxNumber && r.status === "active");
  if (idx < 0) return undefined;
  items[idx] = {
    ...items[idx],
    status: "amended",
    amended_at: new Date().toISOString(),
    amended_from_rx_number: rxNumber,
  };
  writeAll(items);
  return items[idx];
}

export function formatRxRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
