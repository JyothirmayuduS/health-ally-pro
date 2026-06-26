import type { Drug, PaymentStatus, Prescription } from "./mockData";
import { HOSPITAL } from "./mockData";

export type PaymentMethod = import("./mockData").PaymentMethod;

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "upi", label: "UPI" },
  { id: "insurance", label: "Insurance" },
];

export type RxLineItem = {
  drug_id: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
};

export type PharmacyInvoice = {
  id: string;
  invoice_number: string;
  rx_id: string;
  rx_number: string;
  patient_id: string;
  patient_name: string;
  mrn: string;
  doctor_name: string;
  lines: RxLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  paid_at?: string;
  created_at: string;
};

const DEFAULT_TAX_RATE = 0.05;

function resolveDrug(drugId: string, drugs?: Drug[]) {
  return drugs?.find((d) => d.id === drugId);
}

export function fmtInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildLineItems(rx: Prescription, drugs?: Drug[]): RxLineItem[] {
  return rx.lines.map((line) => {
    const drug = resolveDrug(line.drug_id, drugs);
    const unit = drug?.unit_price ?? 0;
    const qty = line.qty_prescribed;
    return {
      drug_id: line.drug_id,
      description: drug ? `${drug.generic_name} ${drug.strength}` : line.drug_id,
      qty,
      unit_price: unit,
      amount: Math.round(unit * qty * 100) / 100,
    };
  });
}

export function computeRxTotals(rx: Prescription, drugs?: Drug[]) {
  const lines = buildLineItems(rx, drugs);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const tax = lines.reduce((s, line) => {
    const drug = resolveDrug(line.drug_id, drugs);
    const rate = (drug?.gst_rate ?? DEFAULT_TAX_RATE * 100) / 100;
    return s + line.amount * rate;
  }, 0);
  const roundedTax = Math.round(tax * 100) / 100;
  const total = Math.round((subtotal + roundedTax) * 100) / 100;
  return { lines, subtotal, tax: roundedTax, total };
}

export function invoiceFromRx(
  rx: Prescription,
  patientName: string,
  mrn: string,
  seq: number,
  drugs?: Drug[],
): PharmacyInvoice {
  const { lines, subtotal, tax, total } = computeRxTotals(rx, drugs);
  return {
    id: `ph-inv-${rx.id}`,
    invoice_number: `PH-INV-${String(seq).padStart(5, "0")}`,
    rx_id: rx.id,
    rx_number: rx.rx_number,
    patient_id: rx.patient_id,
    patient_name: patientName,
    mrn,
    doctor_name: rx.doctor_name,
    lines,
    subtotal,
    tax,
    total,
    amount_paid: rx.payment_status === "paid" ? total : rx.payment_status === "partial" ? total * 0.5 : 0,
    status: rx.payment_status,
    created_at: rx.received_at,
  };
}

export function balanceDue(inv: PharmacyInvoice) {
  return Math.max(0, Math.round((inv.total - inv.amount_paid) * 100) / 100);
}

export function printPharmacyReceipt(inv: PharmacyInvoice) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const rows = inv.lines
    .map(
      (l) =>
        `<tr><td>${l.description}</td><td class="r">${l.qty}</td><td class="r">${fmt(l.unit_price)}</td><td class="r">${fmt(l.amount)}</td></tr>`,
    )
    .join("");
  const paid =
    inv.status === "paid"
      ? `<span class="badge ok">Paid · ${(inv.payment_method ?? "—").toUpperCase()}</span>`
      : inv.status === "partial"
        ? `<span class="badge warn">Partial · ${fmt(inv.amount_paid)} of ${fmt(inv.total)}</span>`
        : `<span class="badge due">Unpaid</span>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${inv.invoice_number}</title>
<style>body{font-family:'IBM Plex Sans',sans-serif;padding:16px;font-size:12px;color:#1c1c19;max-width:80mm;margin:0 auto;}
.h{font-weight:600;font-size:14px;text-align:center}.sm{font-size:10px;color:#575753;text-align:center}
.row{display:flex;justify-content:space-between;margin:3px 0}.xs{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#8a8a86}
hr{border:none;border-top:1px dashed #c9c9c4;margin:10px 0}table{width:100%;border-collapse:collapse;font-size:11px}
th{text-align:left;font-size:9px;text-transform:uppercase;color:#575753;border-bottom:1px solid #e5e5e0;padding:4px 0}
td{padding:4px 0;border-bottom:1px dotted #e5e5e0}.r{text-align:right;font-family:monospace}
.total{font-size:15px;font-weight:700}.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:9px;font-weight:600;text-transform:uppercase}
.ok{border:1px solid #15803d;color:#15803d}.due{border:1px solid #b85c38;color:#b85c38}.warn{border:1px solid #a16207;color:#a16207}
</style></head><body>
<div class="h">${HOSPITAL.name} · Pharmacy</div>
<div class="sm">${HOSPITAL.address}</div>
<div class="sm">Tel ${HOSPITAL.phone}</div><hr/>
<div class="row"><span class="xs">Invoice</span><span style="font-family:monospace">${inv.invoice_number}</span></div>
<div class="row"><span class="xs">Rx</span><span style="font-family:monospace">${inv.rx_number}</span></div>
<div class="row"><span class="xs">Patient</span><span>${inv.patient_name}<br/><span class="sm">${inv.mrn}</span></span></div>
<div class="row"><span class="xs">Doctor</span><span>${inv.doctor_name}</span></div>
<div class="row"><span class="xs">Status</span>${paid}</div><hr/>
<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead><tbody>${rows}</tbody></table><hr/>
<div class="row"><span>Subtotal</span><span class="r">${fmt(inv.subtotal)}</span></div>
<div class="row"><span>Tax (GST)</span><span class="r">${fmt(inv.tax)}</span></div>
<div class="row total"><span>Total</span><span class="r">${fmt(inv.total)}</span></div>
${inv.amount_paid > 0 ? `<div class="row"><span>Paid</span><span class="r">${fmt(inv.amount_paid)}</span></div>` : ""}
<script>window.onload=function(){setTimeout(function(){window.print()},200)}</script></body></html>`;
  const w = window.open("", "_blank", "width=480,height=720");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
