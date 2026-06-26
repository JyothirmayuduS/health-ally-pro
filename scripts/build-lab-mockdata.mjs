import fs from "fs";
import {
  SECTIONS,
  LAB_CATALOG,
  PATIENTS,
  DOCTORS,
  SEED_ORDERS,
  STAFF,
  HOSPITAL,
} from "../src/lib/lab-desk/mockData.seed.mjs";

const doctorMap = Object.fromEntries(DOCTORS.map((d) => [d.id, d.name]));
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString();

const enrich = (o) => ({ ...o, doctor_name: doctorMap[o.doctor_id] || "—" });
const extra = enrich({
  id: "LO-100237",
  accession: "ACC-A4413",
  patient_id: "p-1004",
  doctor_id: "d-201",
  test_code: "LFT",
  test_name: "Liver Function Test",
  status: "validation",
  priority: "urgent",
  source: "doctor",
  notes: "Elevated ALT on prior visit.",
  fasting: false,
  ordered_at: hoursAgo(6),
  collected_at: hoursAgo(5),
  completed_at: minutesAgo(25),
  validated_at: null,
  released_at: null,
  cancelled_at: null,
  cancel_reason: null,
  assigned_to: "Tech: Marcus Lin",
  collector: "Nia Brooks (Phleb)",
  results: { ALT: "72", AST: "42", ALP: "110", TBIL: "1.0", ALB: "4.1" },
  history: [
    { at: hoursAgo(6), actor: "Dr. Mei Tan", action: "Order placed" },
    { at: hoursAgo(5), actor: "Nia Brooks", action: "Sample collected" },
    {
      at: minutesAgo(40),
      actor: "Marcus Lin",
      action: "Results entered",
      note: "Submitted for validation",
    },
  ],
});

const hospital = { ...HOSPITAL, name: "Maple Hospital", tagline: "Clinical laboratory services" };
const orders = [...SEED_ORDERS.map(enrich), extra];

const header = `// Ported from health-ally-pro lab branch

export type LabOrderStatus = 'ordered' | 'collected' | 'processing' | 'validation' | 'validated' | 'cancelled';
export type LabPriority = 'routine' | 'urgent' | 'stat';
export type LabSource = 'doctor' | 'reception' | 'walk-in';

export type CatalogParameter = {
  key: string;
  label: string;
  unit: string;
  ref_low?: number;
  ref_high?: number;
  ref_text?: string;
  critical_low?: number;
  critical_high?: number;
};

export type LabCatalogItem = {
  code: string;
  name: string;
  section: string;
  sample_type: string;
  tube: string;
  tat_hours: number;
  fasting: boolean;
  price: number;
  parameters: CatalogParameter[];
};

export type LabPatient = { id: string; name: string; mrn: string; age: number; sex: string; phone: string };
export type LabDoctor = { id: string; name: string; specialty: string };
export type OrderHistoryEntry = { at: string; actor: string; action: string; note?: string };
export type LabOrder = {
  id: string;
  accession: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  test_code: string;
  test_name: string;
  status: LabOrderStatus;
  priority: LabPriority;
  source: LabSource;
  notes?: string;
  fasting: boolean;
  ordered_at: string;
  collected_at: string | null;
  completed_at: string | null;
  validated_at: string | null;
  released_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  assigned_to: string | null;
  collector: string | null;
  validated_by?: string;
  results?: Record<string, string>;
  history: OrderHistoryEntry[];
};

`;

const body = `export const SECTIONS = ${JSON.stringify(SECTIONS, null, 2)} as const;

export const LAB_CATALOG: LabCatalogItem[] = ${JSON.stringify(LAB_CATALOG, null, 2)};

export const PATIENTS: LabPatient[] = ${JSON.stringify(PATIENTS, null, 2)};

export const DOCTORS: LabDoctor[] = ${JSON.stringify(DOCTORS, null, 2)};

export const SEED_ORDERS: LabOrder[] = ${JSON.stringify(orders, null, 2)};

export const STAFF = ${JSON.stringify(STAFF, null, 2)};

export const HOSPITAL = ${JSON.stringify(hospital, null, 2)};

export function findCatalog(code: string) {
  return LAB_CATALOG.find((t) => t.code === code);
}
`;

fs.writeFileSync("src/lib/lab-desk/mockData.ts", header + body);
console.log("mockData.ts written with", orders.length, "orders");
