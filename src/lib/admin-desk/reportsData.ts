/**
 * Admin MIS reporting — live aggregation over the shared billing ledger.
 *
 * All functions here are pure: they take the ledger invoices/payments (loaded by
 * the page from `@/lib/shared/billing-ledger`) plus a date range and return
 * finance-grade report rows. This is the single source of truth for the admin
 * Reports centre and the billing desk dashboard so the numbers always agree.
 */
import type { LedgerInvoice, LedgerPayment, LedgerSource } from "@/lib/shared/billing-ledger";

export type ReportRange = "today" | "7d" | "30d" | "90d" | "mtd" | "all";

export const REPORT_RANGES: { id: ReportRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "mtd", label: "Month to date" },
  { id: "all", label: "All time" },
];

export type PaymentMode = "cash" | "card" | "upi" | "insurance" | "other";

export const PAYMENT_MODES: PaymentMode[] = ["cash", "card", "upi", "insurance", "other"];

export const SOURCE_LABELS: Record<LedgerSource, string> = {
  reception: "Reception / OPD",
  lab: "Laboratory",
  pharmacy: "Pharmacy",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive [start, end] YYYY-MM-DD bounds for a range, ending today. */
export function rangeBounds(range: ReportRange): { start: string; end: string } {
  const now = new Date();
  const end = ymd(now);
  if (range === "all") return { start: "0000-01-01", end };
  if (range === "today") return { start: end, end };
  if (range === "mtd") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: ymd(first), end };
  }
  const days = range === "7d" ? 6 : range === "30d" ? 29 : 89;
  return { start: ymd(new Date(now.getTime() - days * DAY_MS)), end };
}

export function inRange(dateStr: string, bounds: { start: string; end: string }): boolean {
  const d = dateStr.slice(0, 10);
  return d >= bounds.start && d <= bounds.end;
}

export function filterInvoices(
  invoices: LedgerInvoice[],
  range: ReportRange,
  source: LedgerSource | "all" = "all",
): LedgerInvoice[] {
  const bounds = rangeBounds(range);
  return invoices.filter(
    (i) => inRange(i.date, bounds) && (source === "all" || i.source === source),
  );
}

export function filterPayments(
  payments: LedgerPayment[],
  invoices: LedgerInvoice[],
  range: ReportRange,
  source: LedgerSource | "all" = "all",
): LedgerPayment[] {
  const bounds = rangeBounds(range);
  const bySource =
    source === "all"
      ? null
      : new Set(invoices.filter((i) => i.source === source).map((i) => i.id));
  return payments.filter(
    (p) => inRange(p.at, bounds) && (!bySource || bySource.has(p.invoiceId)),
  );
}

export function normalizeMode(method?: string): PaymentMode {
  const m = (method || "").toLowerCase();
  if (m.includes("cash")) return "cash";
  if (m.includes("card") || m.includes("credit") || m.includes("debit")) return "card";
  if (m.includes("upi") || m.includes("wallet") || m.includes("online")) return "upi";
  if (m.includes("insur") || m.includes("tpa") || m.includes("claim") || m.includes("corp"))
    return "insurance";
  return "other";
}

export type ServiceCategory =
  | "Consultation"
  | "Laboratory"
  | "Pharmacy"
  | "IPD / Bed"
  | "Radiology"
  | "Procedure"
  | "Other";

export function classifyItem(label: string): ServiceCategory {
  const l = label.toLowerCase();
  if (l.includes("consult")) return "Consultation";
  if (/x-?ray|ct|mri|scan|ultrasound|sonograph|radiolog|imaging/.test(l)) return "Radiology";
  if (l.includes("lab") || l.includes("test") || l.includes("panel") || l.includes("cbc"))
    return "Laboratory";
  if (l.includes("pharm") || l.includes("medicine") || l.includes("drug") || l.includes("rx"))
    return "Pharmacy";
  if (l.includes("bed") || l.includes("ipd") || l.includes("ward") || l.includes("admission"))
    return "IPD / Bed";
  if (/vaccin|inject|procedure|dressing|suture|surger|theatre|ot /.test(l)) return "Procedure";
  return "Other";
}

/** Discount inferred from ledger math: total = subtotal - discount + tax. */
export function invoiceDiscount(inv: LedgerInvoice): number {
  return Math.max(0, Math.round((inv.subtotal + inv.tax - inv.total) * 100) / 100);
}

export function invoiceBalance(inv: LedgerInvoice): number {
  return Math.max(0, Math.round((inv.total - inv.amountPaid) * 100) / 100);
}

export function refundedAmount(inv: LedgerInvoice): number {
  if (inv.status === "refunded") return inv.total;
  if (inv.status === "partial-refund") return Math.max(0, inv.total - inv.amountPaid);
  return 0;
}

// ── Summary KPIs ─────────────────────────────────────────────────────────────

export interface FinanceSummary {
  invoiced: number;
  collected: number;
  outstanding: number;
  collectionRate: number; // %
  tax: number;
  discount: number;
  refunds: number;
  refundCount: number;
  invoiceCount: number;
  paidCount: number;
  unpaidCount: number;
  avgInvoice: number;
}

export function financeSummary(
  invoices: LedgerInvoice[],
  payments: LedgerPayment[],
): FinanceSummary {
  const invoiced = invoices.reduce((s, i) => s + i.total, 0);
  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceBalance(i), 0);
  const tax = invoices.reduce((s, i) => s + i.tax, 0);
  const discount = invoices.reduce((s, i) => s + invoiceDiscount(i), 0);
  const refundInvoices = invoices.filter((i) => refundedAmount(i) > 0);
  const refunds = refundInvoices.reduce((s, i) => s + refundedAmount(i), 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid" || i.status === "partial").length;
  return {
    invoiced: round(invoiced),
    collected: round(collected),
    outstanding: round(outstanding),
    collectionRate: invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0,
    tax: round(tax),
    discount: round(discount),
    refunds: round(refunds),
    refundCount: refundInvoices.length,
    invoiceCount: invoices.length,
    paidCount,
    unpaidCount,
    avgInvoice: invoices.length ? round(invoiced / invoices.length) : 0,
  };
}

// ── Daily Collection Report (DCR) ────────────────────────────────────────────

export interface DcrRow {
  date: string;
  cash: number;
  card: number;
  upi: number;
  insurance: number;
  other: number;
  total: number;
  txns: number;
}

export function dailyCollectionReport(payments: LedgerPayment[]): DcrRow[] {
  const map = new Map<string, DcrRow>();
  for (const p of payments) {
    const date = p.at.slice(0, 10);
    const row =
      map.get(date) ||
      ({ date, cash: 0, card: 0, upi: 0, insurance: 0, other: 0, total: 0, txns: 0 } as DcrRow);
    row[normalizeMode(p.method)] += p.amount;
    row.total += p.amount;
    row.txns += 1;
    map.set(date, row);
  }
  return Array.from(map.values())
    .map((r) => ({
      ...r,
      cash: round(r.cash),
      card: round(r.card),
      upi: round(r.upi),
      insurance: round(r.insurance),
      other: round(r.other),
      total: round(r.total),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Payment mode split ───────────────────────────────────────────────────────

export interface ModeRow {
  mode: PaymentMode;
  label: string;
  amount: number;
  txns: number;
  percent: number;
}

const MODE_LABELS: Record<PaymentMode, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI / Online",
  insurance: "Insurance / TPA",
  other: "Other",
};

export function paymentModeSplit(payments: LedgerPayment[]): ModeRow[] {
  const total = payments.reduce((s, p) => s + p.amount, 0) || 1;
  const acc: Record<PaymentMode, { amount: number; txns: number }> = {
    cash: { amount: 0, txns: 0 },
    card: { amount: 0, txns: 0 },
    upi: { amount: 0, txns: 0 },
    insurance: { amount: 0, txns: 0 },
    other: { amount: 0, txns: 0 },
  };
  for (const p of payments) {
    const m = normalizeMode(p.method);
    acc[m].amount += p.amount;
    acc[m].txns += 1;
  }
  return PAYMENT_MODES.map((mode) => ({
    mode,
    label: MODE_LABELS[mode],
    amount: round(acc[mode].amount),
    txns: acc[mode].txns,
    percent: Math.round((acc[mode].amount / total) * 100),
  })).filter((r) => r.amount > 0 || r.txns > 0);
}

// ── Revenue by source ────────────────────────────────────────────────────────

export interface SourceRow {
  source: LedgerSource;
  label: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  rate: number;
  count: number;
}

export function revenueBySource(invoices: LedgerInvoice[]): SourceRow[] {
  const sources: LedgerSource[] = ["reception", "lab", "pharmacy"];
  return sources
    .map((source) => {
      const list = invoices.filter((i) => i.source === source);
      const invoiced = list.reduce((s, i) => s + i.total, 0);
      const collected = list.reduce((s, i) => s + i.amountPaid, 0);
      return {
        source,
        label: SOURCE_LABELS[source],
        invoiced: round(invoiced),
        collected: round(collected),
        outstanding: round(invoiced - collected),
        rate: invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0,
        count: list.length,
      };
    })
    .filter((r) => r.count > 0);
}

// ── Revenue by service category ──────────────────────────────────────────────

export interface CategoryRow {
  category: ServiceCategory;
  amount: number;
  qty: number;
  lines: number;
  percent: number;
}

export function revenueByCategory(invoices: LedgerInvoice[]): CategoryRow[] {
  const acc = new Map<ServiceCategory, { amount: number; qty: number; lines: number }>();
  let total = 0;
  for (const inv of invoices) {
    for (const it of inv.items) {
      const cat = classifyItem(it.label);
      const cur = acc.get(cat) || { amount: 0, qty: 0, lines: 0 };
      cur.amount += it.amount;
      cur.qty += it.qty;
      cur.lines += 1;
      acc.set(cat, cur);
      total += it.amount;
    }
  }
  const denom = total || 1;
  return Array.from(acc.entries())
    .map(([category, v]) => ({
      category,
      amount: round(v.amount),
      qty: v.qty,
      lines: v.lines,
      percent: Math.round((v.amount / denom) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ── AR aging ─────────────────────────────────────────────────────────────────

export interface AgingBucket {
  bucket: string;
  count: number;
  amount: number;
}

export function daysOutstanding(inv: LedgerInvoice): number {
  const d = new Date(inv.date + "T00:00:00");
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY_MS));
}

export function arAging(invoices: LedgerInvoice[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { bucket: "0–30 days", count: 0, amount: 0 },
    { bucket: "31–60 days", count: 0, amount: 0 },
    { bucket: "61–90 days", count: 0, amount: 0 },
    { bucket: "90+ days", count: 0, amount: 0 },
  ];
  for (const inv of invoices) {
    const bal = invoiceBalance(inv);
    if (bal <= 0) continue;
    const d = daysOutstanding(inv);
    const idx = d <= 30 ? 0 : d <= 60 ? 1 : d <= 90 ? 2 : 3;
    buckets[idx].count += 1;
    buckets[idx].amount += bal;
  }
  return buckets.map((b) => ({ ...b, amount: round(b.amount) }));
}

// ── Registers (row lists) ────────────────────────────────────────────────────

export interface OutstandingRow {
  id: string;
  patientName: string;
  mrn: string;
  source: LedgerSource;
  date: string;
  total: number;
  paid: number;
  balance: number;
  days: number;
}

export function outstandingRegister(invoices: LedgerInvoice[]): OutstandingRow[] {
  return invoices
    .filter((i) => invoiceBalance(i) > 0)
    .map((i) => ({
      id: i.id,
      patientName: i.patientName,
      mrn: i.mrn,
      source: i.source,
      date: i.date,
      total: i.total,
      paid: i.amountPaid,
      balance: invoiceBalance(i),
      days: daysOutstanding(i),
    }))
    .sort((a, b) => b.days - a.days);
}

export interface DiscountRow {
  id: string;
  patientName: string;
  source: LedgerSource;
  date: string;
  subtotal: number;
  discount: number;
  percent: number;
  total: number;
}

export function discountRegister(invoices: LedgerInvoice[]): DiscountRow[] {
  return invoices
    .map((i) => ({ inv: i, discount: invoiceDiscount(i) }))
    .filter((x) => x.discount > 0)
    .map(({ inv, discount }) => ({
      id: inv.id,
      patientName: inv.patientName,
      source: inv.source,
      date: inv.date,
      subtotal: inv.subtotal,
      discount,
      percent: inv.subtotal > 0 ? Math.round((discount / inv.subtotal) * 100) : 0,
      total: inv.total,
    }))
    .sort((a, b) => b.discount - a.discount);
}

export interface RefundRow {
  id: string;
  patientName: string;
  source: LedgerSource;
  date: string;
  total: number;
  refunded: number;
  status: LedgerInvoice["status"];
}

export function refundRegister(invoices: LedgerInvoice[]): RefundRow[] {
  return invoices
    .filter((i) => refundedAmount(i) > 0)
    .map((i) => ({
      id: i.id,
      patientName: i.patientName,
      source: i.source,
      date: i.date,
      total: i.total,
      refunded: refundedAmount(i),
      status: i.status,
    }))
    .sort((a, b) => b.refunded - a.refunded);
}

// ── GST / tax summary ────────────────────────────────────────────────────────

export interface TaxRow {
  source: LedgerSource;
  label: string;
  taxable: number;
  tax: number;
  gross: number;
}

export function taxSummary(invoices: LedgerInvoice[]): TaxRow[] {
  const sources: LedgerSource[] = ["reception", "lab", "pharmacy"];
  return sources
    .map((source) => {
      const list = invoices.filter((i) => i.source === source);
      const tax = list.reduce((s, i) => s + i.tax, 0);
      const taxable = list.reduce((s, i) => s + (i.subtotal - invoiceDiscount(i)), 0);
      return {
        source,
        label: SOURCE_LABELS[source],
        taxable: round(taxable),
        tax: round(tax),
        gross: round(taxable + tax),
      };
    })
    .filter((r) => r.gross > 0);
}

// ── Trend for charts (collected per day within range) ────────────────────────

export interface TrendPoint {
  date: string;
  invoiced: number;
  collected: number;
}

export function collectionTrend(
  invoices: LedgerInvoice[],
  payments: LedgerPayment[],
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  const touch = (date: string) =>
    map.get(date) || { date, invoiced: 0, collected: 0 };
  for (const i of invoices) {
    const date = i.date.slice(0, 10);
    const row = touch(date);
    row.invoiced += i.total;
    map.set(date, row);
  }
  for (const p of payments) {
    const date = p.at.slice(0, 10);
    const row = touch(date);
    row.collected += p.amount;
    map.set(date, row);
  }
  return Array.from(map.values())
    .map((r) => ({ date: r.date, invoiced: round(r.invoiced), collected: round(r.collected) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Build a CSV string and trigger a browser download. */
export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
