export type HospitalProfile = {
  name: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
  registrationNo: string;
  timezone: string;
};

export type Branch = { id: string; name: string; city: string; beds: number };
export type Department = { id: string; name: string; head: string; floor: string };

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  active: boolean;
};

const HOSPITAL_KEY = "medora-admin-hospital-v1";
const BRANCH_KEY = "medora-admin-branches-v1";
const DEPT_KEY = "medora-admin-departments-v1";

const DEFAULT_HOSPITAL: HospitalProfile = {
  name: "Oak Haven Medical Center",
  legalName: "Oak Haven Healthcare Pvt Ltd",
  address: "14 Marine Drive, Mumbai 400001",
  phone: "+91 22 4000 1200",
  email: "admin@oakhaven.demo",
  registrationNo: "MH-HOS-2018-4421",
  timezone: "Asia/Kolkata",
};

const DEFAULT_BRANCHES: Branch[] = [
  { id: "BR-01", name: "Main campus", city: "Mumbai", beds: 220 },
  { id: "BR-02", name: "Andheri outpatient", city: "Mumbai", beds: 40 },
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: "DEP-01", name: "General Medicine", head: "Dr. Aarav Mehta", floor: "2" },
  { id: "DEP-02", name: "Pediatrics", head: "Dr. Priya Nair", floor: "3" },
  { id: "DEP-03", name: "Orthopedics", head: "Dr. Rohan Bhatt", floor: "4" },
  { id: "DEP-04", name: "Laboratory", head: "Dr. Rajan", floor: "1" },
  { id: "DEP-05", name: "Pharmacy", head: "Riley Chen", floor: "G" },
];

export const DEFAULT_STAFF: StaffMember[] = [
  { id: "ST-01", name: "Maya Kapoor", role: "Receptionist", email: "reception@oakhaven.demo", department: "Front desk", active: true },
  { id: "ST-02", name: "J. Mensah", role: "Lab technician", email: "lab@oakhaven.demo", department: "Laboratory", active: true },
  { id: "ST-03", name: "Dr. Rajan", role: "Lab supervisor", email: "lab.supervisor@oakhaven.demo", department: "Laboratory", active: true },
  { id: "ST-04", name: "Riley Chen", role: "Pharmacist", email: "pharmacy@oakhaven.demo", department: "Pharmacy", active: true },
  { id: "ST-05", name: "Anita Rao", role: "Billing staff", email: "billing@oakhaven.demo", department: "Finance", active: true },
  { id: "ST-06", name: "Sunita Pillai", role: "Nurse", email: "nursing@oakhaven.demo", department: "Ward", active: true },
  { id: "ST-07", name: "Admin User", role: "Hospital admin", email: "admin@oakhaven.demo", department: "Administration", active: true },
];

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(data));
}

export function loadHospital(): HospitalProfile {
  return load(HOSPITAL_KEY, DEFAULT_HOSPITAL);
}

export function saveHospital(profile: HospitalProfile) {
  save(HOSPITAL_KEY, profile);
}

export function loadBranches(): Branch[] {
  return load(BRANCH_KEY, DEFAULT_BRANCHES);
}

export function saveBranches(branches: Branch[]) {
  save(BRANCH_KEY, branches);
}

export function loadDepartments(): Department[] {
  return load(DEPT_KEY, DEFAULT_DEPARTMENTS);
}

export function saveDepartments(departments: Department[]) {
  save(DEPT_KEY, departments);
}
