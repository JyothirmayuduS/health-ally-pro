/**
 * Hospital-wide master data (AXON-style Masters module).
 * Persisted via hospital_desk_records desk=admin.
 */
import { deskForKey, loadPersistedJson, savePersistedJson } from "@/lib/shared/persisted-store";

export type IcdDiagnosis = {
  code: string;
  description: string;
  category?: string;
};

export type InvestigationMaster = {
  code: string;
  name: string;
  department: "lab" | "radiology" | "cardiology" | "other";
  defaultPrice?: number;
};

export type ReferringDoctor = {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  email?: string;
  commissionPct?: number;
  active: boolean;
};

export type VaccineScheduleEntry = {
  id: string;
  vaccine: string;
  ageLabel: string;
  ageMonths: number;
  dose: string;
  route: string;
  notes?: string;
};

export type AdviseTemplate = {
  id: string;
  label: string;
  body: string;
  locale: "en" | "hi" | "mr" | "gu";
};

export type AddressBookEntry = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  organization?: string;
  tags?: string[];
};

export type PatientReminder = {
  id: string;
  patientName: string;
  mrn: string;
  phone: string;
  type: "follow-up" | "vaccine" | "investigation" | "birthday" | "payment";
  dueDate: string;
  note: string;
  done: boolean;
};

export type CommunicationTemplate = {
  id: string;
  channel: "sms" | "email" | "whatsapp";
  name: string;
  body: string;
};

const KEYS = {
  icd: "medora-master-icd-v1",
  investigations: "medora-master-investigations-v1",
  referring: "medora-master-referring-doctors-v1",
  vaccines: "medora-master-vaccine-schedule-v1",
  advise: "medora-master-advise-v1",
  addressBook: "medora-master-address-book-v1",
  reminders: "medora-master-patient-reminders-v1",
  comms: "medora-master-comms-templates-v1",
} as const;

const DESK = "admin" as const;

export const SEED_ICD: IcdDiagnosis[] = [
  { code: "J45.9", description: "Asthma, unspecified", category: "Respiratory" },
  { code: "J06.9", description: "Acute upper respiratory infection", category: "Respiratory" },
  {
    code: "E11.9",
    description: "Type 2 diabetes mellitus without complications",
    category: "Endocrine",
  },
  { code: "I10", description: "Essential (primary) hypertension", category: "Cardiovascular" },
  { code: "K21.0", description: "Gastro-oesophageal reflux with oesophagitis", category: "GI" },
  { code: "M54.5", description: "Low back pain", category: "Musculoskeletal" },
  { code: "R50.9", description: "Fever, unspecified", category: "Symptoms" },
  { code: "Z00.0", description: "General adult medical examination", category: "Preventive" },
  { code: "Z23", description: "Encounter for immunization", category: "Preventive" },
  { code: "O80", description: "Single spontaneous delivery", category: "Obstetrics" },
];

export const SEED_INVESTIGATIONS: InvestigationMaster[] = [
  { code: "CBC", name: "Complete blood count", department: "lab", defaultPrice: 350 },
  { code: "LFT", name: "Liver function test", department: "lab", defaultPrice: 650 },
  { code: "RFT", name: "Renal function test", department: "lab", defaultPrice: 550 },
  { code: "TSH", name: "Thyroid stimulating hormone", department: "lab", defaultPrice: 450 },
  { code: "HBA1C", name: "HbA1c", department: "lab", defaultPrice: 500 },
  { code: "CXR", name: "Chest X-ray PA view", department: "radiology", defaultPrice: 450 },
  { code: "USG-ABD", name: "Ultrasound abdomen", department: "radiology", defaultPrice: 1200 },
  { code: "ECG", name: "12-lead ECG", department: "cardiology", defaultPrice: 300 },
  { code: "ECHO", name: "2D echocardiography", department: "cardiology", defaultPrice: 2500 },
];

export const SEED_REFERRING: ReferringDoctor[] = [
  {
    id: "REF-01",
    name: "Dr. Kavita Menon",
    specialty: "General Medicine",
    clinic: "City Clinic, Andheri",
    phone: "+91 98200 11223",
    commissionPct: 10,
    active: true,
  },
  {
    id: "REF-02",
    name: "Dr. Suresh Patil",
    specialty: "Pediatrics",
    clinic: "Kids Care, Bandra",
    phone: "+91 98190 44556",
    commissionPct: 8,
    active: true,
  },
  {
    id: "REF-03",
    name: "Dr. Anil Deshmukh",
    specialty: "Orthopedics",
    clinic: "Bone & Joint Centre",
    phone: "+91 98765 77889",
    commissionPct: 12,
    active: true,
  },
];

export const SEED_VACCINES: VaccineScheduleEntry[] = [
  { id: "V-BCG", vaccine: "BCG", ageLabel: "At birth", ageMonths: 0, dose: "0.05 ml", route: "ID" },
  {
    id: "V-OPV0",
    vaccine: "OPV-0",
    ageLabel: "At birth",
    ageMonths: 0,
    dose: "2 drops",
    route: "Oral",
  },
  {
    id: "V-HEPB0",
    vaccine: "HepB birth",
    ageLabel: "At birth",
    ageMonths: 0,
    dose: "0.5 ml",
    route: "IM",
  },
  {
    id: "V-DPT1",
    vaccine: "Pentavalent-1",
    ageLabel: "6 weeks",
    ageMonths: 1.5,
    dose: "0.5 ml",
    route: "IM",
  },
  {
    id: "V-DPT2",
    vaccine: "Pentavalent-2",
    ageLabel: "10 weeks",
    ageMonths: 2.5,
    dose: "0.5 ml",
    route: "IM",
  },
  {
    id: "V-DPT3",
    vaccine: "Pentavalent-3",
    ageLabel: "14 weeks",
    ageMonths: 3.5,
    dose: "0.5 ml",
    route: "IM",
  },
  {
    id: "V-MR1",
    vaccine: "MR-1",
    ageLabel: "9 months",
    ageMonths: 9,
    dose: "0.5 ml",
    route: "SC",
  },
  {
    id: "V-MMR1",
    vaccine: "MMR-1",
    ageLabel: "12 months",
    ageMonths: 12,
    dose: "0.5 ml",
    route: "SC",
  },
  {
    id: "V-DPT-B",
    vaccine: "DPT booster",
    ageLabel: "16-24 months",
    ageMonths: 18,
    dose: "0.5 ml",
    route: "IM",
  },
  {
    id: "V-MR2",
    vaccine: "MR-2",
    ageLabel: "16-24 months",
    ageMonths: 18,
    dose: "0.5 ml",
    route: "SC",
  },
  {
    id: "V-DPT-B2",
    vaccine: "DPT 2nd booster",
    ageLabel: "5-6 years",
    ageMonths: 60,
    dose: "0.5 ml",
    route: "IM",
  },
  { id: "V-TD", vaccine: "Td", ageLabel: "10 years", ageMonths: 120, dose: "0.5 ml", route: "IM" },
  {
    id: "V-HPV1",
    vaccine: "HPV-1",
    ageLabel: "9-14 years",
    ageMonths: 108,
    dose: "0.5 ml",
    route: "IM",
    notes: "Girls preferred; catch-up available",
  },
  {
    id: "V-FLU",
    vaccine: "Influenza",
    ageLabel: "Annual ≥6 months",
    ageMonths: 6,
    dose: "0.5 ml",
    route: "IM",
  },
];

export const SEED_ADVISE: AdviseTemplate[] = [
  {
    id: "A-01",
    label: "Fever care",
    body: "Plenty of fluids, tepid sponging if T>101°F, paracetamol as prescribed. Return if breathless or persistent fever >3 days.",
    locale: "en",
  },
  {
    id: "A-02",
    label: "Asthma action",
    body: "Use inhaler with spacer. Avoid triggers. Seek ER if peak flow <50% personal best.",
    locale: "en",
  },
  {
    id: "A-03",
    label: "बुखार — सामान्य सलाह",
    body: "खूब पानी पिएं। तेज बुखार पर ठंडा पानी से sponging करें। 3 दिन से अधिक बुखार पर वापस आएं।",
    locale: "hi",
  },
];

export const SEED_ADDRESS_BOOK: AddressBookEntry[] = [
  {
    id: "AB-01",
    name: "Dr. Rajan",
    role: "Lab supervisor",
    phone: "+91 22 4000 1201",
    organization: "Oak Haven Lab",
    tags: ["internal"],
  },
  {
    id: "AB-02",
    name: "City Diagnostics",
    role: "Reference lab",
    phone: "+91 22 2654 8800",
    tags: ["external", "lab"],
  },
  {
    id: "AB-03",
    name: "Star Insurance TPA",
    role: "TPA desk",
    phone: "1800-123-4567",
    tags: ["insurance"],
  },
];

export const SEED_REMINDERS: PatientReminder[] = [
  {
    id: "R-01",
    patientName: "Sneha Rao",
    mrn: "MRN-100231",
    phone: "+91 98765 43210",
    type: "follow-up",
    dueDate: new Date().toISOString().slice(0, 10),
    note: "Asthma review — peak flow log",
    done: false,
  },
  {
    id: "R-02",
    patientName: "Arjun Kapoor",
    mrn: "MRN-100234",
    phone: "+91 98123 45678",
    type: "vaccine",
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    note: "MMR-2 due",
    done: false,
  },
];

export const SEED_COMMS: CommunicationTemplate[] = [
  {
    id: "SMS-01",
    channel: "sms",
    name: "Appointment reminder",
    body: "Reminder: {{patient}} has appointment at Oak Haven on {{date}} at {{time}}. Reply STOP to opt out.",
  },
  {
    id: "SMS-02",
    channel: "sms",
    name: "Lab result ready",
    body: "Your lab report is ready at Oak Haven. View in patient app or collect from reception.",
  },
  {
    id: "WA-01",
    channel: "whatsapp",
    name: "Prescription share",
    body: "Dr {{doctor}} has sent your prescription. Download: {{link}}",
  },
  {
    id: "EM-01",
    channel: "email",
    name: "Discharge summary",
    body: "Dear {{patient}}, please find attached your discharge summary from Oak Haven Medical.",
  },
];

function load<T>(key: string, seed: T[]): T[] {
  const data = loadPersistedJson<T[]>(key, []);
  return data.length ? data : seed;
}

function save<T>(key: string, data: T[]) {
  savePersistedJson(key, deskForKey(key, DESK), data);
}

export function loadIcdMaster() {
  return load(KEYS.icd, SEED_ICD);
}
export function saveIcdMaster(rows: IcdDiagnosis[]) {
  save(KEYS.icd, rows);
}

export function loadInvestigationMaster() {
  return load(KEYS.investigations, SEED_INVESTIGATIONS);
}
export function saveInvestigationMaster(rows: InvestigationMaster[]) {
  save(KEYS.investigations, rows);
}

export function loadReferringDoctors() {
  return load(KEYS.referring, SEED_REFERRING);
}
export function saveReferringDoctors(rows: ReferringDoctor[]) {
  save(KEYS.referring, rows);
}

export function loadVaccineSchedule() {
  return load(KEYS.vaccines, SEED_VACCINES);
}
export function saveVaccineSchedule(rows: VaccineScheduleEntry[]) {
  save(KEYS.vaccines, rows);
}

export function loadAdviseTemplates() {
  return load(KEYS.advise, SEED_ADVISE);
}
export function saveAdviseTemplates(rows: AdviseTemplate[]) {
  save(KEYS.advise, rows);
}

export function loadAddressBook() {
  return load(KEYS.addressBook, SEED_ADDRESS_BOOK);
}
export function saveAddressBook(rows: AddressBookEntry[]) {
  save(KEYS.addressBook, rows);
}

export function loadPatientReminders() {
  return load(KEYS.reminders, SEED_REMINDERS);
}
export function savePatientReminders(rows: PatientReminder[]) {
  save(KEYS.reminders, rows);
}

export function loadCommsTemplates() {
  return load(KEYS.comms, SEED_COMMS);
}
export function saveCommsTemplates(rows: CommunicationTemplate[]) {
  save(KEYS.comms, rows);
}

export function searchIcd(query: string, limit = 20): IcdDiagnosis[] {
  const q = query.trim().toLowerCase();
  if (!q) return loadIcdMaster().slice(0, limit);
  return loadIcdMaster()
    .filter((r) => r.code.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
    .slice(0, limit);
}

/** Pediatric anthropometry helpers (AXON-style Exp.Ht / BMI / BSA). */
export function computeBmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function computeBsa(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  return Math.round(Math.sqrt((weightKg * heightCm) / 3600) * 100) / 100;
}
