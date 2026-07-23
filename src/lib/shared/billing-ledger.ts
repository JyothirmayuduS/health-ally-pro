import { deskForKey, loadPersistedJson, savePersistedJson } from "./persisted-store";

export type LedgerSource = "reception" | "lab" | "pharmacy";

export type LedgerInvoice = {
  id: string;
  source: LedgerSource;
  patientId: string;
  patientName: string;
  mrn: string;
  date: string;
  items: { label: string; qty: number; unit: number; amount: number }[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  status: "unpaid" | "partial" | "paid" | "refunded" | "partial-refund";
  method?: string;
  encounterId?: string;
  referenceId?: string;
  paidAt?: string;
};

export type LedgerPayment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  at: string;
  actor: string;
};

const INV_KEY = "medora-billing-ledger-invoices-v1";
const PAY_KEY = "medora-billing-ledger-payments-v1";

const SEED: LedgerInvoice[] = [
  {
    id: "INV-90011",
    source: "reception",
    patientId: "MRN-100231",
    patientName: "Anjali Krishnan",
    mrn: "MRN-100231",
    date: new Date().toISOString().slice(0, 10),
    items: [
      { label: "Consultation — General Medicine", qty: 1, unit: 600, amount: 600 },
      { label: "Vitals & BP check", qty: 1, unit: 100, amount: 100 },
    ],
    subtotal: 700,
    tax: 35,
    total: 735,
    amountPaid: 735,
    status: "paid",
    method: "cash",
    paidAt: new Date().toISOString(),
  },
  {
    id: "INV-90013",
    source: "reception",
    patientId: "MRN-100234",
    patientName: "Ravi Deshmukh",
    mrn: "MRN-100234",
    date: new Date().toISOString().slice(0, 10),
    items: [
      { label: "Consultation — Orthopedics", qty: 1, unit: 1200, amount: 1200 },
      { label: "X-ray (left knee)", qty: 1, unit: 850, amount: 850 },
    ],
    subtotal: 2050,
    tax: 102.5,
    total: 2152.5,
    amountPaid: 0,
    status: "unpaid",
  },
];

function load<T>(key: string, seed: T[]): T[] {
  const loaded = loadPersistedJson<T[]>(key, []);
  if (loaded.length) return loaded;
  if (typeof window !== "undefined") savePersistedJson(key, deskForKey(key), seed);
  return seed;
}

function save<T>(key: string, data: T[]) {
  savePersistedJson(key, deskForKey(key), data);
  if (key === INV_KEY) {
    void import("@/lib/supabase/phi-api").then(({ upsertClinicalEntities }) =>
      upsertClinicalEntities(
        "invoices",
        (data as LedgerInvoice[]).map((inv) => ({
          legacy_id: inv.id,
          payload: inv as unknown as Record<string, unknown>,
        })),
      ),
    );
  }
  if (key === PAY_KEY) {
    void import("@/lib/supabase/phi-api").then(({ upsertClinicalEntities }) =>
      upsertClinicalEntities(
        "payments",
        (data as LedgerPayment[]).map((p) => ({
          legacy_id: p.id,
          payload: p as unknown as Record<string, unknown>,
        })),
      ),
    );
  }
}

export function loadLedgerInvoices(): LedgerInvoice[] {
  return load(INV_KEY, SEED);
}

export function saveLedgerInvoices(invoices: LedgerInvoice[]) {
  save(INV_KEY, invoices);
}

export function loadLedgerPayments(): LedgerPayment[] {
  return load(PAY_KEY, []);
}

export function saveLedgerPayments(payments: LedgerPayment[]) {
  save(PAY_KEY, payments);
}

export function upsertLedgerInvoice(inv: LedgerInvoice) {
  const list = loadLedgerInvoices();
  const idx = list.findIndex((i) => i.id === inv.id);
  if (idx >= 0) list[idx] = inv;
  else list.unshift(inv);
  saveLedgerInvoices(list);
  return list;
}

export function recordLedgerPayment(
  invoiceId: string,
  amount: number,
  method: string,
  actor = "Billing staff",
) {
  const invoices = loadLedgerInvoices();
  const inv = invoices.find((i) => i.id === invoiceId);
  if (!inv) return invoices;
  const paid = Math.min(inv.total, Math.round((inv.amountPaid + amount) * 100) / 100);
  const status: LedgerInvoice["status"] = paid >= inv.total ? "paid" : paid > 0 ? "partial" : "unpaid";
  const updated: LedgerInvoice = { ...inv, amountPaid: paid, status, method, paidAt: status === "paid" ? new Date().toISOString() : inv.paidAt };
  upsertLedgerInvoice(updated);
  const payments = loadLedgerPayments();
  payments.unshift({
    id: `PAY-${Date.now()}`,
    invoiceId,
    amount,
    method,
    at: new Date().toISOString(),
    actor,
  });
  saveLedgerPayments(payments);
  return loadLedgerInvoices();
}

export const LEDGER_EVENT = "medora-ledger-updated";

export function notifyLedgerUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEDGER_EVENT));
  }
}
