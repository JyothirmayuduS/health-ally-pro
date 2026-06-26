/** Lab unpaid charges pushed to reception billing (sessionStorage queue). */

export type ReceptionInvoicePayload = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  labOrderId: string;
  items: { label: string; qty: number; unit: number; amount: number }[];
  note?: string;
  createdAt: string;
};

const STORAGE_KEY = "medora_lab_to_reception_invoices";
export const RECEPTION_INVOICE_EVENT = "medora-reception-invoice-incoming";

function readQueue(): ReceptionInvoicePayload[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReceptionInvoicePayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: ReceptionInvoicePayload[]) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export function pushReceptionInvoice(payload: ReceptionInvoicePayload) {
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RECEPTION_INVOICE_EVENT));
  }
}

export function drainReceptionInvoices(): ReceptionInvoicePayload[] {
  const items = readQueue();
  writeQueue([]);
  return items;
}

let invSeq = 90100;
export function nextBridgeInvoiceId() {
  invSeq += 1;
  return `INV-BR-${invSeq}`;
}
