/**
 * Patient e-prescription ledger (demo / local session).
 * Mirrors the web `patient-prescription-store` shape for UI parity.
 */

export type PatientRxLine = {
  drug_id: string;
  drug_name: string;
  strength: string;
  sig: string;
  qty_prescribed: number;
  days_supply: number;
};

export type PatientRxRecord = {
  id: string;
  rx_number: string;
  diagnosis: string;
  diagnosisIcd?: string;
  lines: PatientRxLine[];
  doctor_name: string;
  doctor_specialty: string;
  patientInstructions?: string;
  sent_at: string;
  status: "active" | "dispensed" | "expired";
};

export const PATIENT_RX_EVENT = "medora-native-patient-rx-updated";

let records: PatientRxRecord[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
  if (typeof globalThis !== "undefined" && "dispatchEvent" in globalThis) {
    // RN web / dev tools
    try {
      (globalThis as typeof globalThis & { dispatchEvent?: (e: Event) => void }).dispatchEvent?.(
        new Event(PATIENT_RX_EVENT),
      );
    } catch {
      /* noop */
    }
  }
}

function seed(): PatientRxRecord[] {
  if (records) return records;

  const now = Date.now();
  records = [
    {
      id: "rx-native-seed-1",
      rx_number: "RX-2025-501",
      diagnosis: "Hypothyroidism — maintenance",
      diagnosisIcd: "E03.9",
      lines: [
        {
          drug_id: "drug-lev50",
          drug_name: "Levothyroxine",
          strength: "50 mcg",
          sig: "50 mcg orally once daily on empty stomach",
          qty_prescribed: 30,
          days_supply: 30,
        },
      ],
      doctor_name: "Dr. Lucien Park",
      doctor_specialty: "Endocrinology",
      patientInstructions: "Take 30–60 min before breakfast. Separate from calcium/iron by 4 hours.",
      sent_at: new Date(now - 12 * 86400000).toISOString(),
      status: "active",
    },
    {
      id: "rx-native-seed-2",
      rx_number: "RX-2025-488",
      diagnosis: "Vitamin D deficiency",
      diagnosisIcd: "E55.9",
      lines: [
        {
          drug_id: "drug-vitd",
          drug_name: "Vitamin D3",
          strength: "2000 IU",
          sig: "2000 IU orally once daily with food",
          qty_prescribed: 60,
          days_supply: 60,
        },
        {
          drug_id: "drug-mag200",
          drug_name: "Magnesium Glycinate",
          strength: "200 mg",
          sig: "200 mg orally at bedtime",
          qty_prescribed: 30,
          days_supply: 30,
        },
      ],
      doctor_name: "Dr. Saanvi Reddy",
      doctor_specialty: "General Physician",
      patientInstructions: "Recheck vitamin D level in 3 months.",
      sent_at: new Date(now - 45 * 86400000).toISOString(),
      status: "dispensed",
    },
    {
      id: "rx-native-seed-3",
      rx_number: "RX-2025-472",
      diagnosis: "Acne vulgaris — topical therapy",
      diagnosisIcd: "L70.0",
      lines: [
        {
          drug_id: "drug-adap",
          drug_name: "Adapalene",
          strength: "0.1%",
          sig: "Apply thin layer at bedtime",
          qty_prescribed: 1,
          days_supply: 30,
        },
      ],
      doctor_name: "Dr. Mira Okafor",
      doctor_specialty: "Dermatology",
      sent_at: new Date(now - 60 * 86400000).toISOString(),
      status: "dispensed",
    },
  ];
  return records;
}

export function subscribePatientRx(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listPatientPrescriptions(): PatientRxRecord[] {
  return [...seed()].sort((a, b) => b.sent_at.localeCompare(a.sent_at));
}

export function getPatientPrescription(rxId: string): PatientRxRecord | undefined {
  return seed().find((r) => r.id === rxId || r.rx_number === rxId);
}

export function pushPatientPrescription(
  input: Omit<PatientRxRecord, "id" | "status"> & { id?: string; status?: PatientRxRecord["status"] },
): PatientRxRecord {
  const record: PatientRxRecord = {
    ...input,
    id: input.id ?? `rx-native-${Date.now()}`,
    status: input.status ?? "active",
  };
  const list = seed();
  list.unshift(record);
  records = list;
  emit();
  return record;
}

export function importPatientPrescriptionFromSync(envelope: import("./patient-rx-sync-types").PatientRxSyncEnvelope): PatientRxRecord {
  const existing = seed().find((r) => r.rx_number === envelope.rx_number);
  const record: PatientRxRecord = {
    id: envelope.id,
    rx_number: envelope.rx_number,
    diagnosis: envelope.diagnosis,
    diagnosisIcd: envelope.diagnosisIcd,
    lines: envelope.lines,
    doctor_name: envelope.doctor_name,
    doctor_specialty: envelope.doctor_specialty,
    patientInstructions: envelope.patientInstructions,
    sent_at: envelope.sent_at,
    status: envelope.status,
  };

  if (existing) {
    const list = seed();
    const idx = list.findIndex((r) => r.rx_number === envelope.rx_number);
    if (idx >= 0) list[idx] = record;
    records = list;
  } else {
    const list = seed();
    list.unshift(record);
    records = list;
  }
  emit();
  return record;
}

export function formatRxRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
