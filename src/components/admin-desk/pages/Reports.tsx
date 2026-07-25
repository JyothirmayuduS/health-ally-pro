import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Printer, RefreshCw } from "lucide-react";
import {
  LEDGER_EVENT,
  loadLedgerInvoices,
  loadLedgerPayments,
  type LedgerInvoice,
  type LedgerPayment,
  type LedgerSource,
} from "@/lib/shared/billing-ledger";
import { DeskKpi } from "@/components/desk-shell/ui";
import {
  REPORT_RANGES,
  SOURCE_LABELS,
  arAging,
  collectionTrend,
  dailyCollectionReport,
  discountRegister,
  exportCsv,
  filterInvoices,
  filterPayments,
  financeSummary,
  inr,
  invoiceBalance,
  invoiceDiscount,
  outstandingRegister,
  paymentModeSplit,
  refundRegister,
  revenueByCategory,
  revenueBySource,
  taxSummary,
  type ReportRange,
} from "@/lib/admin-desk/reportsData";

const COLORS = ["#2c7873", "#a87826", "#5a3e85", "#b85c38", "#1a5f7a", "#2c5e4e"];

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E5E0",
  borderRadius: 8,
  fontSize: 12,
};

type ReportId =
  | "summary"
  | "dcr"
  | "mode"
  | "source"
  | "category"
  | "aging"
  | "outstanding"
  | "discount"
  | "refund"
  | "tax"
  | "register";

const REPORTS: { group: string; items: { id: ReportId; label: string }[] }[] = [
  {
    group: "Overview",
    items: [{ id: "summary", label: "Executive summary" }],
  },
  {
    group: "Collections",
    items: [
      { id: "dcr", label: "Daily collection (DCR)" },
      { id: "mode", label: "Payment mode split" },
    ],
  },
  {
    group: "Revenue",
    items: [
      { id: "source", label: "Revenue by source" },
      { id: "category", label: "Revenue by service" },
    ],
  },
  {
    group: "Receivables",
    items: [
      { id: "aging", label: "AR aging" },
      { id: "outstanding", label: "Outstanding register" },
    ],
  },
  {
    group: "Compliance",
    items: [
      { id: "discount", label: "Discount register" },
      { id: "refund", label: "Refund / credit register" },
      { id: "tax", label: "GST / tax summary" },
      { id: "register", label: "Invoice register" },
    ],
  },
];

const SOURCE_FILTERS: { id: LedgerSource | "all"; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "reception", label: "Reception" },
  { id: "lab", label: "Laboratory" },
  { id: "pharmacy", label: "Pharmacy" },
];

// ── Small presentational helpers ─────────────────────────────────────────────

function ReportShell({
  title,
  subtitle,
  onExport,
  children,
}: {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-3">
        <div>
          <h3 className="font-heading text-[14px] font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-ink-400">{subtitle}</p>}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-sm border border-ink-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-ink-600 transition-colors hover:border-plum hover:text-plum print:hidden"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function money(n: number) {
  return <span className="font-mono tabular-nums">{inr(n)}</span>;
}

// ──────────────────────────────────────────────────────────────────────────────

export default function AdminReports() {
  const [range, setRange] = useState<ReportRange>("30d");
  const [source, setSource] = useState<LedgerSource | "all">("all");
  const [report, setReport] = useState<ReportId>("summary");
  const [tick, setTick] = useState(0);

  // Live ledger — re-read whenever another desk records a payment/invoice.
  const [allInvoices, setAllInvoices] = useState<LedgerInvoice[]>([]);
  const [allPayments, setAllPayments] = useState<LedgerPayment[]>([]);

  useEffect(() => {
    const load = () => {
      setAllInvoices(loadLedgerInvoices());
      setAllPayments(loadLedgerPayments());
    };
    load();
    window.addEventListener(LEDGER_EVENT, load);
    return () => window.removeEventListener(LEDGER_EVENT, load);
  }, [tick]);

  const invoices = useMemo(
    () => filterInvoices(allInvoices, range, source),
    [allInvoices, range, source],
  );
  const payments = useMemo(
    () => filterPayments(allPayments, allInvoices, range, source),
    [allPayments, allInvoices, range, source],
  );

  const summary = useMemo(() => financeSummary(invoices, payments), [invoices, payments]);
  const rangeLabel = REPORT_RANGES.find((r) => r.id === range)?.label ?? "";
  const sourceLabel = SOURCE_FILTERS.find((s) => s.id === source)?.label ?? "";
  const scope = `${rangeLabel} · ${sourceLabel}`;

  return (
    <div className="space-y-5" data-testid="admin-reports">
      {/* Toolbar */}
      <div className="surface flex flex-col gap-3 p-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-sm bg-stone-100 p-0.5">
            {REPORT_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-sm px-2.5 py-1 text-[11.5px] font-medium transition-all ${
                  range === r.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LedgerSource | "all")}
            className="h-8 rounded-sm border border-ink-200 bg-white px-2.5 text-[12px] focus:border-plum focus:outline-none"
          >
            {SOURCE_FILTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTick((t) => t + 1)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-ink-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-ink-600 hover:border-ink-400"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-sm bg-plum px-3 py-1.5 text-[11.5px] font-medium text-white hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* KPI header — always visible, part of every printed report */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DeskKpi label="Invoiced" value={inr(summary.invoiced)} sub={`${summary.invoiceCount} inv`} />
        <DeskKpi
          label="Collected"
          value={inr(summary.collected)}
          sub={`${summary.collectionRate}% rate`}
          accent="text-money"
        />
        <DeskKpi
          label="Outstanding"
          value={inr(summary.outstanding)}
          sub={`${summary.unpaidCount} open`}
          accent="text-clay"
        />
        <DeskKpi label="GST / tax" value={inr(summary.tax)} sub={`disc ${inr(summary.discount)}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
        {/* Report rail */}
        <nav className="surface h-max overflow-hidden print:hidden">
          {REPORTS.map((grp) => (
            <div key={grp.group} className="border-b border-ink-100 last:border-0">
              <div className="bg-stone-50 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-ink-400">
                {grp.group}
              </div>
              {grp.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setReport(it.id)}
                  className={`block w-full px-3 py-2 text-left text-[12.5px] transition-colors ${
                    report === it.id
                      ? "bg-plum-soft font-medium text-plum"
                      : "text-ink-600 hover:bg-bone"
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Report content */}
        <div className="min-w-0 space-y-5">
          {report === "summary" && (
            <SummaryReport invoices={invoices} payments={payments} scope={scope} summary={summary} />
          )}
          {report === "dcr" && <DcrReport payments={payments} scope={scope} />}
          {report === "mode" && <ModeReport payments={payments} scope={scope} />}
          {report === "source" && <SourceReport invoices={invoices} scope={scope} />}
          {report === "category" && <CategoryReport invoices={invoices} scope={scope} />}
          {report === "aging" && <AgingReport invoices={invoices} scope={scope} />}
          {report === "outstanding" && <OutstandingReport invoices={invoices} scope={scope} />}
          {report === "discount" && <DiscountReport invoices={invoices} scope={scope} />}
          {report === "refund" && <RefundReport invoices={invoices} scope={scope} />}
          {report === "tax" && <TaxReport invoices={invoices} scope={scope} />}
          {report === "register" && <RegisterReport invoices={invoices} scope={scope} />}
        </div>
      </div>
    </div>
  );
}

// ── Individual reports ───────────────────────────────────────────────────────

function SummaryReport({
  invoices,
  payments,
  scope,
  summary,
}: {
  invoices: LedgerInvoice[];
  payments: LedgerPayment[];
  scope: string;
  summary: ReturnType<typeof financeSummary>;
}) {
  const trend = useMemo(() => collectionTrend(invoices, payments), [invoices, payments]);
  const modes = useMemo(() => paymentModeSplit(payments), [payments]);
  const sources = useMemo(() => revenueBySource(invoices), [invoices]);
  const aging = useMemo(() => arAging(invoices), [invoices]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DeskKpi label="Avg invoice" value={inr(summary.avgInvoice)} />
        <DeskKpi label="Paid invoices" value={summary.paidCount} accent="text-money" />
        <DeskKpi label="Refunds" value={inr(summary.refunds)} sub={`${summary.refundCount}`} accent="text-clay" />
        <DeskKpi label="Discounts" value={inr(summary.discount)} />
      </div>

      <ReportShell title="Collection trend" subtitle={scope}>
        <div className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rpInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a87826" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a87826" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rpCol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2c7873" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2c7873" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="invoiced" stroke="#a87826" fill="url(#rpInv)" name="Invoiced" strokeWidth={2} />
              <Area type="monotone" dataKey="collected" stroke="#2c7873" fill="url(#rpCol)" name="Collected" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ReportShell>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportShell title="Payment mode" subtitle={scope}>
          <div className="flex items-center gap-4 p-4">
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={modes} dataKey="amount" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={72}>
                    {modes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {modes.map((m, i) => (
                <div key={m.mode} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-ink-600">{m.label}</span>
                  <span className="font-semibold text-ink-900">{m.percent}%</span>
                </div>
              ))}
              {modes.length === 0 && <span className="text-[12px] text-ink-400">No payments yet.</span>}
            </div>
          </div>
        </ReportShell>

        <ReportShell title="Revenue by source" subtitle={scope}>
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sources} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="invoiced" fill="#a87826" name="Invoiced" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" fill="#2c7873" name="Collected" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportShell>
      </div>

      <ReportShell title="AR aging" subtitle={scope}>
        <div className="h-52 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aging} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="amount" name="Outstanding" radius={[3, 3, 0, 0]}>
                {aging.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportShell>
    </div>
  );
}

function DcrReport({ payments, scope }: { payments: LedgerPayment[]; scope: string }) {
  const rows = useMemo(() => dailyCollectionReport(payments), [payments]);
  const totals = rows.reduce(
    (a, r) => ({
      cash: a.cash + r.cash,
      card: a.card + r.card,
      upi: a.upi + r.upi,
      insurance: a.insurance + r.insurance,
      other: a.other + r.other,
      total: a.total + r.total,
      txns: a.txns + r.txns,
    }),
    { cash: 0, card: 0, upi: 0, insurance: 0, other: 0, total: 0, txns: 0 },
  );
  return (
    <ReportShell
      title="Daily collection report (DCR)"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "daily-collection.csv",
          ["Date", "Cash", "Card", "UPI", "Insurance", "Other", "Txns", "Total"],
          rows.map((r) => [r.date, r.cash, r.card, r.upi, r.insurance, r.other, r.txns, r.total]),
        )
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr>
              <Th>Date</Th>
              <Th right>Cash</Th>
              <Th right>Card</Th>
              <Th right>UPI</Th>
              <Th right>Insurance</Th>
              <Th right>Other</Th>
              <Th right>Txns</Th>
              <Th right>Total</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.date} className="hover:bg-bone/40">
                <td className="px-4 py-2.5 font-medium text-ink-900">{r.date}</td>
                <td className="px-4 py-2.5 text-right">{money(r.cash)}</td>
                <td className="px-4 py-2.5 text-right">{money(r.card)}</td>
                <td className="px-4 py-2.5 text-right">{money(r.upi)}</td>
                <td className="px-4 py-2.5 text-right">{money(r.insurance)}</td>
                <td className="px-4 py-2.5 text-right">{money(r.other)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-500">{r.txns}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-money">{money(r.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-ink-400">
                  No collections in this period.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-ink-200 bg-stone-50 font-semibold text-ink-900">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right">{money(totals.cash)}</td>
                <td className="px-4 py-2.5 text-right">{money(totals.card)}</td>
                <td className="px-4 py-2.5 text-right">{money(totals.upi)}</td>
                <td className="px-4 py-2.5 text-right">{money(totals.insurance)}</td>
                <td className="px-4 py-2.5 text-right">{money(totals.other)}</td>
                <td className="px-4 py-2.5 text-right">{totals.txns}</td>
                <td className="px-4 py-2.5 text-right text-money">{money(totals.total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </ReportShell>
  );
}

function ModeReport({ payments, scope }: { payments: LedgerPayment[]; scope: string }) {
  const rows = useMemo(() => paymentModeSplit(payments), [payments]);
  return (
    <ReportShell
      title="Payment mode split"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "payment-modes.csv",
          ["Mode", "Amount", "Txns", "Share%"],
          rows.map((r) => [r.label, r.amount, r.txns, r.percent]),
        )
      }
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Mode</Th>
            <Th right>Amount</Th>
            <Th right>Txns</Th>
            <Th right>Share</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r, i) => (
            <tr key={r.mode} className="hover:bg-bone/40">
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {r.label}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right font-semibold text-money">{money(r.amount)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-ink-500">{r.txns}</td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-teal" style={{ width: `${r.percent}%` }} />
                  </div>
                  <span className="tabular-nums text-ink-600">{r.percent}%</span>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-ink-400">
                No payments in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ReportShell>
  );
}

function SourceReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => revenueBySource(invoices), [invoices]);
  return (
    <ReportShell
      title="Revenue by source"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "revenue-by-source.csv",
          ["Source", "Invoices", "Invoiced", "Collected", "Outstanding", "Rate%"],
          rows.map((r) => [r.label, r.count, r.invoiced, r.collected, r.outstanding, r.rate]),
        )
      }
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Source</Th>
            <Th right>Invoices</Th>
            <Th right>Invoiced</Th>
            <Th right>Collected</Th>
            <Th right>Outstanding</Th>
            <Th right>Rate</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.source} className="hover:bg-bone/40">
              <td className="px-4 py-2.5 font-medium text-ink-900">{r.label}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-ink-500">{r.count}</td>
              <td className="px-4 py-2.5 text-right">{money(r.invoiced)}</td>
              <td className="px-4 py-2.5 text-right text-money">{money(r.collected)}</td>
              <td className="px-4 py-2.5 text-right text-clay">{money(r.outstanding)}</td>
              <td className="px-4 py-2.5 text-right font-semibold">{r.rate}%</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-ink-400">
                No invoices in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ReportShell>
  );
}

function CategoryReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => revenueByCategory(invoices), [invoices]);
  return (
    <ReportShell
      title="Revenue by service"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "revenue-by-service.csv",
          ["Category", "Amount", "Qty", "Lines", "Share%"],
          rows.map((r) => [r.category, r.amount, r.qty, r.lines, r.percent]),
        )
      }
    >
      <div className="h-56 border-b border-ink-100 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="amount" name="Revenue" radius={[0, 3, 3, 0]}>
              {rows.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Category</Th>
            <Th right>Amount</Th>
            <Th right>Qty</Th>
            <Th right>Lines</Th>
            <Th right>Share</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.category} className="hover:bg-bone/40">
              <td className="px-4 py-2.5 font-medium text-ink-900">{r.category}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-money">{money(r.amount)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-ink-500">{r.qty}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-ink-500">{r.lines}</td>
              <td className="px-4 py-2.5 text-right">{r.percent}%</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-ink-400">
                No billed services in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ReportShell>
  );
}

function AgingReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => arAging(invoices), [invoices]);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <ReportShell
      title="AR aging"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "ar-aging.csv",
          ["Bucket", "Invoices", "Amount"],
          rows.map((r) => [r.bucket, r.count, r.amount]),
        )
      }
    >
      <div className="h-52 border-b border-ink-100 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => inr(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="amount" name="Outstanding" radius={[3, 3, 0, 0]}>
              {rows.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Bucket</Th>
            <Th right>Invoices</Th>
            <Th right>Amount</Th>
            <Th right>Share</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.bucket} className="hover:bg-bone/40">
              <td className="px-4 py-2.5 font-medium text-ink-900">{r.bucket}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-ink-500">{r.count}</td>
              <td className="px-4 py-2.5 text-right text-clay">{money(r.amount)}</td>
              <td className="px-4 py-2.5 text-right">{total > 0 ? Math.round((r.amount / total) * 100) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportShell>
  );
}

function OutstandingReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => outstandingRegister(invoices), [invoices]);
  return (
    <ReportShell
      title="Outstanding register"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "outstanding.csv",
          ["Invoice", "Patient", "MRN", "Source", "Date", "Total", "Paid", "Balance", "Days"],
          rows.map((r) => [r.id, r.patientName, r.mrn, r.source, r.date, r.total, r.paid, r.balance, r.days]),
        )
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr>
              <Th>Invoice</Th>
              <Th>Patient</Th>
              <Th>Source</Th>
              <Th right>Balance</Th>
              <Th right>Age</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-bone/40">
                <td className="px-4 py-2.5 font-mono text-[11px]">{r.id}</td>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-ink-900">{r.patientName}</div>
                  <div className="text-[10px] text-ink-400">{r.mrn}</div>
                </td>
                <td className="px-4 py-2.5 capitalize text-ink-500">{r.source}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-clay">{money(r.balance)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                      r.days > 60
                        ? "bg-red-100 text-red-700"
                        : r.days > 30
                          ? "bg-status-waitBg text-status-waitText"
                          : "bg-stone-100 text-ink-600"
                    }`}
                  >
                    {r.days}d
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-ink-400">
                  Nothing outstanding — all settled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportShell>
  );
}

function DiscountReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => discountRegister(invoices), [invoices]);
  const total = rows.reduce((s, r) => s + r.discount, 0);
  return (
    <ReportShell
      title="Discount register"
      subtitle={`${scope} · ${inr(total)} discounted`}
      onExport={() =>
        exportCsv(
          "discounts.csv",
          ["Invoice", "Patient", "Source", "Date", "Subtotal", "Discount", "Percent", "Net"],
          rows.map((r) => [r.id, r.patientName, r.source, r.date, r.subtotal, r.discount, r.percent, r.total]),
        )
      }
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Invoice</Th>
            <Th>Patient</Th>
            <Th right>Subtotal</Th>
            <Th right>Discount</Th>
            <Th right>%</Th>
            <Th right>Net</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-bone/40">
              <td className="px-4 py-2.5 font-mono text-[11px]">{r.id}</td>
              <td className="px-4 py-2.5 font-medium text-ink-900">{r.patientName}</td>
              <td className="px-4 py-2.5 text-right">{money(r.subtotal)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-clay">{money(r.discount)}</td>
              <td className="px-4 py-2.5 text-right">{r.percent}%</td>
              <td className="px-4 py-2.5 text-right">{money(r.total)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-ink-400">
                No discounts applied in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ReportShell>
  );
}

function RefundReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => refundRegister(invoices), [invoices]);
  const total = rows.reduce((s, r) => s + r.refunded, 0);
  return (
    <ReportShell
      title="Refund / credit register"
      subtitle={`${scope} · ${inr(total)} refunded`}
      onExport={() =>
        exportCsv(
          "refunds.csv",
          ["Invoice", "Patient", "Source", "Date", "Total", "Refunded", "Status"],
          rows.map((r) => [r.id, r.patientName, r.source, r.date, r.total, r.refunded, r.status]),
        )
      }
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Invoice</Th>
            <Th>Patient</Th>
            <Th>Source</Th>
            <Th right>Total</Th>
            <Th right>Refunded</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-bone/40">
              <td className="px-4 py-2.5 font-mono text-[11px]">{r.id}</td>
              <td className="px-4 py-2.5 font-medium text-ink-900">{r.patientName}</td>
              <td className="px-4 py-2.5 capitalize text-ink-500">{r.source}</td>
              <td className="px-4 py-2.5 text-right">{money(r.total)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-clay">{money(r.refunded)}</td>
              <td className="px-4 py-2.5">
                <span className="rounded-sm bg-clay-soft px-2 py-0.5 text-[10px] font-medium uppercase text-clay">
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-ink-400">
                No refunds in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ReportShell>
  );
}

function TaxReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(() => taxSummary(invoices), [invoices]);
  const totals = rows.reduce(
    (a, r) => ({ taxable: a.taxable + r.taxable, tax: a.tax + r.tax, gross: a.gross + r.gross }),
    { taxable: 0, tax: 0, gross: 0 },
  );
  return (
    <ReportShell
      title="GST / tax summary"
      subtitle={scope}
      onExport={() =>
        exportCsv(
          "tax-summary.csv",
          ["Source", "Taxable value", "Tax", "Gross"],
          rows.map((r) => [r.label, r.taxable, r.tax, r.gross]),
        )
      }
    >
      <table className="w-full text-[13px]">
        <thead className="border-b border-ink-200 bg-stone-50">
          <tr>
            <Th>Source</Th>
            <Th right>Taxable value</Th>
            <Th right>Tax (GST)</Th>
            <Th right>Gross</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => (
            <tr key={r.source} className="hover:bg-bone/40">
              <td className="px-4 py-2.5 font-medium text-ink-900">{r.label}</td>
              <td className="px-4 py-2.5 text-right">{money(r.taxable)}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-plum">{money(r.tax)}</td>
              <td className="px-4 py-2.5 text-right">{money(r.gross)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-ink-400">
                No taxable invoices in this period.
              </td>
            </tr>
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="border-t border-ink-200 bg-stone-50 font-semibold text-ink-900">
              <td className="px-4 py-2.5">Total</td>
              <td className="px-4 py-2.5 text-right">{money(totals.taxable)}</td>
              <td className="px-4 py-2.5 text-right text-plum">{money(totals.tax)}</td>
              <td className="px-4 py-2.5 text-right">{money(totals.gross)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </ReportShell>
  );
}

function RegisterReport({ invoices, scope }: { invoices: LedgerInvoice[]; scope: string }) {
  const rows = useMemo(
    () => [...invoices].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [invoices],
  );
  return (
    <ReportShell
      title="Invoice register"
      subtitle={`${scope} · ${rows.length} invoices`}
      onExport={() =>
        exportCsv(
          "invoice-register.csv",
          ["Invoice", "Date", "Patient", "MRN", "Source", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance", "Status"],
          rows.map((i) => [
            i.id,
            i.date,
            i.patientName,
            i.mrn,
            i.source,
            i.subtotal,
            invoiceDiscount(i),
            i.tax,
            i.total,
            i.amountPaid,
            invoiceBalance(i),
            i.status,
          ]),
        )
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-ink-200 bg-stone-50">
            <tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Patient</Th>
              <Th>Source</Th>
              <Th right>Total</Th>
              <Th right>Balance</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((i) => (
              <tr key={i.id} className="hover:bg-bone/40">
                <td className="px-4 py-2.5 font-mono text-[11px]">{i.id}</td>
                <td className="px-4 py-2.5 text-ink-500">{i.date}</td>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-ink-900">{i.patientName}</div>
                  <div className="text-[10px] text-ink-400">{i.mrn}</div>
                </td>
                <td className="px-4 py-2.5 capitalize text-ink-500">{i.source}</td>
                <td className="px-4 py-2.5 text-right">{money(i.total)}</td>
                <td className="px-4 py-2.5 text-right text-clay">{money(invoiceBalance(i))}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase ${
                      i.status === "paid"
                        ? "bg-status-doneBg text-status-doneText"
                        : i.status === "partial"
                          ? "bg-mustard-soft text-mustard"
                          : i.status.includes("refund")
                            ? "bg-clay-soft text-clay"
                            : "bg-stone-100 text-ink-600"
                    }`}
                  >
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-ink-400">
                  No invoices in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportShell>
  );
}
