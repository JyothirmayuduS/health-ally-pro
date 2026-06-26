import type { RxPriority } from "./mockData";

/** Payload when a doctor sends a prescription to pharmacy (shared via sessionStorage). */
export type DoctorRxLine = {
  drug_id: string;
  sig: string;
  qty_prescribed: number;
  days_supply: number;
  refills_allowed: number;
};

export type DoctorRxPatient = {
  id: string;
  name: string;
  mrn: string;
  age: number;
  sex: string;
  phone: string;
  allergies: string[];
};

export type DoctorRxPayload = {
  id: string;
  rx_number: string;
  patient: DoctorRxPatient;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  priority: RxPriority;
  lines: DoctorRxLine[];
  notes?: string;
  sent_at: string;
};

const STORAGE_KEY = "medora_doctor_to_pharmacy_rx";
export const PHARMACY_RX_EVENT = "medora-pharmacy-rx-incoming";

function readQueue(): DoctorRxPayload[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DoctorRxPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: DoctorRxPayload[]) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

/** Doctor portal calls this when "Send to Pharmacy" is clicked. */
export function pushDoctorPrescription(payload: DoctorRxPayload) {
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PHARMACY_RX_EVENT));
  }
}

/** Pharmacy store drains the queue and converts to internal prescriptions. */
export function drainDoctorPrescriptions(): DoctorRxPayload[] {
  const items = readQueue();
  writeQueue([]);
  return items;
}

let rxSeq = 500;

export function nextRxNumber() {
  rxSeq += 1;
  return `RX-2025-${rxSeq}`;
}
