import type { LabPriority } from "./mockData";

export type DoctorLabPatient = {
  id: string;
  name: string;
  mrn: string;
  age: number;
  sex: string;
  phone: string;
};

export type DoctorLabLine = {
  test_code: string;
  test_name: string;
  fasting: boolean;
};

export type DoctorLabPayload = {
  id: string;
  patient: DoctorLabPatient;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  priority: LabPriority;
  lines: DoctorLabLine[];
  notes?: string;
  sent_at: string;
  source: "doctor" | "reception";
};

const STORAGE_KEY = "medora_doctor_to_lab_orders";
export const LAB_ORDER_EVENT = "medora-lab-order-incoming";

function readQueue(): DoctorLabPayload[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DoctorLabPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: DoctorLabPayload[]) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export function pushLabOrder(payload: DoctorLabPayload) {
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LAB_ORDER_EVENT));
  }
}

export function drainLabOrders(): DoctorLabPayload[] {
  const items = readQueue();
  writeQueue([]);
  return items;
}

let orderSeq = 300;
let accSeq = 5000;

export function nextLabOrderId() {
  orderSeq += 1;
  return `LO-${orderSeq}`;
}

export function nextAccession() {
  accSeq += 1;
  return `ACC-A${accSeq}`;
}
