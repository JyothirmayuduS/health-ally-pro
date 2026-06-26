/** Canonical patient master — shared IDs/MRNs across reception, lab, and pharmacy. */

export type SharedPatient = {
  id: string;
  mrn: string;
  name: string;
  dob?: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergency?: { name: string; phone: string; relation: string };
  bloodGroup?: string;
  allergies: string;
  insurance?: { provider: string; policyId: string };
  balance?: number;
  createdAt?: string;
};

/** Doctor-portal aliases → canonical MRN (legacy dp* ids). */
export const PATIENT_ID_ALIASES: Record<string, string> = {
  dp1: "MRN-100231",
  dp2: "MRN-100232",
  dp3: "MRN-100233",
  dp4: "MRN-100234",
  p1: "MRN-100231",
  p2: "MRN-100232",
  p3: "MRN-100235",
  p4: "MRN-100234",
  p5: "MRN-100233",
  p6: "MRN-100236",
  "p-1001": "MRN-100231",
  "p-1002": "MRN-100232",
  "p-1003": "MRN-100233",
  "p-1004": "MRN-100234",
  "p-1005": "MRN-100235",
  "p-1006": "MRN-100236",
  "p-1007": "MRN-100237",
  "p-1008": "MRN-100238",
};

export const SHARED_PATIENTS: SharedPatient[] = [
  {
    id: "MRN-100231",
    mrn: "MRN-100231",
    name: "Anjali Krishnan",
    dob: "1989-03-14",
    gender: "Female",
    phone: "+91 98201 33421",
    email: "anjali.k@example.com",
    address: "12 Linking Road, Bandra W, Mumbai",
    emergency: { name: "Rahul Krishnan", phone: "+91 98201 33422", relation: "Spouse" },
    bloodGroup: "O+",
    allergies: "Penicillin",
    insurance: { provider: "Star Health", policyId: "SH-882-3341" },
    balance: 0,
    createdAt: "2024-08-12",
  },
  {
    id: "MRN-100232",
    mrn: "MRN-100232",
    name: "Mohammed Faraz",
    dob: "1972-11-02",
    gender: "Male",
    phone: "+91 99876 11203",
    email: "faraz72@example.com",
    address: "B-204, Marigold Apartments, Andheri E, Mumbai",
    emergency: { name: "Sana Faraz", phone: "+91 99876 11204", relation: "Daughter" },
    bloodGroup: "B+",
    allergies: "—",
    insurance: { provider: "HDFC Ergo", policyId: "HE-771-9921" },
    balance: 1450,
    createdAt: "2023-02-04",
  },
  {
    id: "MRN-100233",
    mrn: "MRN-100233",
    name: "Priyanka Desai",
    dob: "1996-07-21",
    gender: "Female",
    phone: "+91 97045 88210",
    email: "p.desai@example.com",
    address: "44 Pali Hill, Bandra W, Mumbai",
    emergency: { name: "Neha Desai", phone: "+91 97045 88211", relation: "Sister" },
    bloodGroup: "A-",
    allergies: "Sulfa drugs, Latex",
    insurance: { provider: "ICICI Lombard", policyId: "IL-664-2210" },
    balance: 0,
    createdAt: "2025-01-18",
  },
  {
    id: "MRN-100234",
    mrn: "MRN-100234",
    name: "Vijay Subramaniam",
    dob: "1958-09-30",
    gender: "Male",
    phone: "+91 98330 02145",
    email: "v.subramaniam@example.com",
    address: "9 Cuffe Parade, Colaba, Mumbai",
    emergency: { name: "Lakshmi S.", phone: "+91 98330 02146", relation: "Spouse" },
    bloodGroup: "AB+",
    allergies: "Aspirin",
    insurance: { provider: "Self-pay", policyId: "—" },
    balance: 2300,
    createdAt: "2022-06-09",
  },
  {
    id: "MRN-100235",
    mrn: "MRN-100235",
    name: "Kavya Reddy",
    dob: "2014-12-05",
    gender: "Female",
    phone: "+91 99000 71234",
    address: "B-12 Lokhandwala, Andheri W, Mumbai",
    emergency: { name: "Anita Reddy", phone: "+91 99000 71234", relation: "Mother" },
    bloodGroup: "O-",
    allergies: "Peanuts",
    insurance: { provider: "Niva Bupa", policyId: "NB-441-5523" },
    balance: 0,
    createdAt: "2024-11-22",
  },
  {
    id: "MRN-100236",
    mrn: "MRN-100236",
    name: "Daniel Pereira",
    dob: "1981-04-17",
    gender: "Male",
    phone: "+91 98191 44021",
    email: "dan.p@example.com",
    address: "21 Carter Road, Bandra W, Mumbai",
    emergency: { name: "Maria Pereira", phone: "+91 98191 44022", relation: "Spouse" },
    bloodGroup: "A+",
    allergies: "—",
    insurance: { provider: "Star Health", policyId: "SH-220-7711" },
    balance: 500,
    createdAt: "2024-03-11",
  },
  {
    id: "MRN-100237",
    mrn: "MRN-100237",
    name: "Neha Gupta",
    dob: "1992-08-08",
    gender: "Female",
    phone: "+91 97744 33012",
    email: "neha.g@example.com",
    address: "11 Hiranandani, Powai, Mumbai",
    emergency: { name: "Rajiv Gupta", phone: "+91 97744 33013", relation: "Father" },
    bloodGroup: "B-",
    allergies: "Iodine",
    insurance: { provider: "Tata AIG", policyId: "TA-118-6677" },
    balance: 0,
    createdAt: "2025-05-29",
  },
  {
    id: "MRN-100238",
    mrn: "MRN-100238",
    name: "Arjun Malhotra",
    dob: "1965-01-23",
    gender: "Male",
    phone: "+91 99812 67342",
    email: "arjun.m@example.com",
    address: "5 Worli Sea Face, Worli, Mumbai",
    emergency: { name: "Pooja Malhotra", phone: "+91 99812 67343", relation: "Spouse" },
    bloodGroup: "O+",
    allergies: "—",
    insurance: { provider: "Care Health", policyId: "CH-993-2841" },
    balance: 0,
    createdAt: "2021-10-14",
  },
];

export function resolvePatientId(id: string): string {
  return PATIENT_ID_ALIASES[id] ?? id;
}

export function getSharedPatient(id: string): SharedPatient | undefined {
  const canonical = resolvePatientId(id);
  return SHARED_PATIENTS.find((p) => p.id === canonical);
}

export function calcAge(dob?: string): number {
  if (!dob) return 0;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export function toLabPatient(p: SharedPatient) {
  return {
    id: p.id,
    name: p.name,
    mrn: p.mrn,
    age: calcAge(p.dob),
    sex: p.gender.startsWith("M") ? "M" : p.gender.startsWith("F") ? "F" : "O",
    phone: p.phone,
  };
}

export function toPharmacyPatient(p: SharedPatient) {
  return {
    id: p.id,
    name: p.name,
    mrn: p.mrn,
    age: calcAge(p.dob),
    sex: p.gender.startsWith("M") ? "M" : p.gender.startsWith("F") ? "F" : "O",
    phone: p.phone,
    allergies: p.allergies === "—" ? [] : p.allergies.split(/,\s*/),
  };
}

export const LAB_PATIENTS = SHARED_PATIENTS.map(toLabPatient);
export const PHARMACY_PATIENTS = SHARED_PATIENTS.map(toPharmacyPatient);
