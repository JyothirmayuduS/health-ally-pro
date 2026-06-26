const STORAGE_KEY = "medora-consult-fees-v1";

export const DEFAULT_FEE_BY_DOCTOR: Record<string, number> = {
  "DOC-001": 600,
  "DOC-002": 800,
  "DOC-003": 1200,
  "DOC-004": 1500,
  "DOC-005": 1800,
};

export type ServiceFee = {
  doctorId: string;
  doctorName: string;
  specialty: string;
  fee: number;
};

export const DEFAULT_SERVICES: ServiceFee[] = [
  { doctorId: "DOC-001", doctorName: "Dr. Aarav Mehta", specialty: "General Medicine", fee: 600 },
  { doctorId: "DOC-002", doctorName: "Dr. Priya Nair", specialty: "Pediatrics", fee: 800 },
  { doctorId: "DOC-003", doctorName: "Dr. Rohan Bhatt", specialty: "Orthopedics", fee: 1200 },
  { doctorId: "DOC-004", doctorName: "Dr. Sara Iyer", specialty: "Dermatology", fee: 1500 },
  { doctorId: "DOC-005", doctorName: "Dr. Vikram Shah", specialty: "Cardiology", fee: 1800 },
];

export function loadServiceFees(): ServiceFee[] {
  if (typeof window === "undefined") return [...DEFAULT_SERVICES];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SERVICES];
    const parsed = JSON.parse(raw) as ServiceFee[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_SERVICES];
    return parsed;
  } catch {
    return [...DEFAULT_SERVICES];
  }
}

export function saveServiceFees(services: ServiceFee[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

export function feesByDoctor(services?: ServiceFee[]): Record<string, number> {
  const list = services ?? loadServiceFees();
  return Object.fromEntries(list.map((s) => [s.doctorId, s.fee]));
}

export function updateServiceFee(doctorId: string, fee: number, services?: ServiceFee[]): ServiceFee[] {
  const list = services ?? loadServiceFees();
  const next = list.map((s) => (s.doctorId === doctorId ? { ...s, fee } : s));
  saveServiceFees(next);
  return next;
}
