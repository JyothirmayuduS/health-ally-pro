import { TODAY_STR } from "./mockData";
import { DEFAULT_FEE_BY_DOCTOR } from "@/lib/shared/services";

// Per-doctor consultation fees — loaded from shared services in UI; defaults here for SSR.
export const FEE_BY_DOCTOR = DEFAULT_FEE_BY_DOCTOR;

export const TAX_RATE = 0.05; // 5% (mock GST equivalent)

// Pre-seeded invoices — one per past appointment, with mixed paid/unpaid state.
// Some unpaid so reception has work to do; some paid for revenue totals.
export const SEED_INVOICES = [
  {
    id: "INV-90011",
    appointmentId: "APT-50012",
    patientId: "MRN-100232",
    doctorId: "DOC-001",
    date: TODAY_STR,
    items: [
      { label: "Consultation — General Medicine", qty: 1, unit: 600, amount: 600 },
      { label: "Vitals & BP check", qty: 1, unit: 100, amount: 100 },
    ],
    discount: 0,
    method: "cash",
    status: "paid",
    paidAt: `${TODAY_STR}T09:42:00`,
    note: "Walk-in copay collected at desk",
  },
  {
    id: "INV-90012",
    appointmentId: "APT-50011",
    patientId: "MRN-100231",
    doctorId: "DOC-001",
    date: TODAY_STR,
    items: [
      { label: "Consultation — Follow-up", qty: 1, unit: 400, amount: 400 },
    ],
    discount: 0,
    method: "upi",
    status: "paid",
    paidAt: `${TODAY_STR}T09:12:00`,
  },
  {
    id: "INV-90013",
    appointmentId: "APT-50015",
    patientId: "MRN-100234",
    doctorId: "DOC-003",
    date: TODAY_STR,
    items: [
      { label: "Consultation — Orthopedics", qty: 1, unit: 1200, amount: 1200 },
      { label: "X-ray (left knee)", qty: 1, unit: 850, amount: 850 },
    ],
    discount: 100,
    method: null,
    status: "unpaid",
  },
  {
    id: "INV-90014",
    appointmentId: "APT-50013",
    patientId: "MRN-100233",
    doctorId: "DOC-002",
    date: TODAY_STR,
    items: [
      { label: "Consultation — Pediatrics", qty: 1, unit: 800, amount: 800 },
    ],
    discount: 0,
    method: "card",
    status: "paid",
    paidAt: `${TODAY_STR}T10:11:00`,
  },
  {
    id: "INV-90015",
    appointmentId: "APT-50018",
    patientId: "MRN-100238",
    doctorId: "DOC-005",
    date: TODAY_STR,
    items: [
      { label: "Consultation — Cardiology (follow-up)", qty: 1, unit: 1200, amount: 1200 },
    ],
    discount: 0,
    method: null,
    status: "unpaid",
  },
];

let invoiceCounter = 90020;
export const nextInvoiceId = () => `INV-${invoiceCounter++}`;

export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "upi", label: "UPI" },
  { id: "insurance", label: "Insurance" },
];

export const computeTotals = (items, discount = 0) => {
  const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const taxable = Math.max(0, subtotal - Number(discount || 0));
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax;
  return { subtotal, discount: Number(discount || 0), tax, total };
};
