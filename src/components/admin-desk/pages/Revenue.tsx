import { useState, useMemo } from "react";
import {
  DAILY_REVENUE,
  DEPARTMENT_REVENUE,
  OUTSTANDING_INVOICES,
  PAYER_MIX,
  INSURANCE_BREAKDOWN,
  PAYER_MONTH_COMPARISON,
  TOP_SERVICES,
} from "@/lib/admin-desk/revenueData";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const TABS = ["Overview", "By Department", "Outstanding Dues", "Payer Mix"] as const;
type Tab = (typeof TABS)[number];

const COLORS = ["#2c7873", "#2c5e4e", "#a87826", "#b85c38", "#5a3e85", "#1a5f7a"];

function inrFmt(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────────────────────────────────────
// Overview Tab
// ──────────────────────────────────────────────────────────────────────────────
function OverviewTab() {
  const totalInvoiced = DAILY_REVENUE.reduce((s, d) => s + d.invoiced, 0);
  const totalCollected = DAILY_REVENUE.reduce((s, d) => s + d.collected, 0);
  const collectionRate = Math.round((totalCollected / totalInvoiced) * 100);

  const chartData = DAILY_REVENUE.slice(-14).map((d) => ({
    date: d.date.slice(5), // MM-DD
    invoiced: d.invoiced,
    collected: d.collected,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Invoiced (30d)", value: inrFmt(totalInvoiced), color: "text-ink-900" },
          { label: "Collected (30d)", value: inrFmt(totalCollected), color: "text-money" },
          { label: "Collection rate", value: `${collectionRate}%`, color: collectionRate >= 80 ? "text-teal" : "text-clay" },
        ].map((k) => (
          <div key={k.label} className="surface px-5 py-4">
            <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">{k.label}</div>
            <div className={`mt-1.5 text-3xl font-heading font-semibold tabular-nums ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">14-day revenue trend</span>
          <button
            onClick={() =>
              downloadCSV("revenue-14d.csv", [
                ["Date", "Invoiced", "Collected"],
                ...DAILY_REVENUE.slice(-14).map((d) => [d.date, String(d.invoiced), String(d.collected)]),
              ])
            }
            className="text-[11px] text-plum hover:underline"
          >
            Export CSV
          </button>
        </div>
        <div className="px-4 py-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => inrFmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="invoiced" stroke="#a87826" strokeWidth={2} dot={false} name="Invoiced" />
              <Line type="monotone" dataKey="collected" stroke="#2c7873" strokeWidth={2} dot={false} name="Collected" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Top revenue services
        </div>
        <div className="divide-y divide-ink-100">
          {TOP_SERVICES.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-3 text-[13px]">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-ink-400 w-4">{i + 1}.</span>
                <span className="text-ink-700">{s.name}</span>
              </div>
              <span className="font-mono font-semibold text-money">{inrFmt(s.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// By Department Tab
// ──────────────────────────────────────────────────────────────────────────────
function DepartmentTab() {
  const chartData = DEPARTMENT_REVENUE.map((d) => ({
    dept: d.department.length > 16 ? d.department.slice(0, 14) + "…" : d.department,
    invoiced: d.invoiced,
    collected: d.collected,
  }));

  return (
    <div className="space-y-5">
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Revenue by department</span>
          <button
            onClick={() =>
              downloadCSV("revenue-by-dept.csv", [
                ["Department", "Invoiced", "Collected", "Outstanding", "Rate%"],
                ...DEPARTMENT_REVENUE.map((d) => [d.department, String(d.invoiced), String(d.collected), String(d.outstanding), String(d.rate)]),
              ])
            }
            className="text-[11px] text-plum hover:underline"
          >
            Export CSV
          </button>
        </div>
        <div className="px-4 py-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => inrFmt(v)} />
              <Legend />
              <Bar dataKey="invoiced" fill="#a87826" name="Invoiced" radius={[3, 3, 0, 0]} />
              <Bar dataKey="collected" fill="#2c7873" name="Collected" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="border-b border-ink-100 bg-bone/60">
            <tr>
              {["Department", "Invoiced", "Collected", "Outstanding", "Collection rate"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {DEPARTMENT_REVENUE.map((d) => (
              <tr key={d.department} className="hover:bg-bone/40">
                <td className="px-5 py-3 font-medium">{d.department}</td>
                <td className="px-5 py-3 font-mono">{inrFmt(d.invoiced)}</td>
                <td className="px-5 py-3 font-mono text-money">{inrFmt(d.collected)}</td>
                <td className="px-5 py-3 font-mono text-clay">{inrFmt(d.outstanding)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full rounded-full bg-teal" style={{ width: `${d.rate}%` }} />
                    </div>
                    <span className={d.rate >= 90 ? "text-teal font-semibold" : d.rate >= 75 ? "text-money" : "text-clay"}>
                      {d.rate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Outstanding Dues Tab
// ──────────────────────────────────────────────────────────────────────────────
function OutstandingTab() {
  const totalDue = OUTSTANDING_INVOICES.reduce((s, i) => s + i.amountDue, 0);
  const critical = OUTSTANDING_INVOICES.filter((i) => i.daysOutstanding > 60).length;

  function ageBadge(days: number) {
    if (days > 60) return "bg-red-100 text-red-700";
    if (days > 30) return "bg-status-waitBg text-status-waitText";
    return "bg-stone-100 text-ink-600";
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase text-ink-400 tracking-widest">Total outstanding</div>
          <div className="mt-1.5 text-3xl font-semibold text-clay tabular-nums font-heading">{inrFmt(totalDue)}</div>
        </div>
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase text-ink-400 tracking-widest">Invoices outstanding</div>
          <div className="mt-1.5 text-3xl font-semibold text-ink-900 tabular-nums font-heading">{OUTSTANDING_INVOICES.length}</div>
        </div>
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase text-ink-400 tracking-widest">Critical (&gt;60 days)</div>
          <div className={`mt-1.5 text-3xl font-semibold tabular-nums font-heading ${critical > 0 ? "text-clay" : "text-teal"}`}>{critical}</div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Outstanding invoices</span>
          <button
            onClick={() =>
              downloadCSV("outstanding.csv", [
                ["Invoice ID", "Patient", "MRN", "Dept", "Amount Due", "Days Outstanding"],
                ...OUTSTANDING_INVOICES.map((i) => [i.id, i.patientName, i.patientId, i.department, String(i.amountDue), String(i.daysOutstanding)]),
              ])
            }
            className="text-[11px] text-plum hover:underline"
          >
            Export CSV
          </button>
        </div>
        <table className="w-full text-[13px]">
          <thead className="border-b border-ink-100 bg-bone/60">
            <tr>
              {["Invoice", "Patient", "Department", "Amount Due", "Age", "Invoice Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {OUTSTANDING_INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-bone/40">
                <td className="px-4 py-3 font-mono text-[11px]">{inv.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{inv.patientName}</div>
                  <div className="text-[10px] text-ink-400">{inv.patientId}</div>
                </td>
                <td className="px-4 py-3 text-ink-600">{inv.department}</td>
                <td className="px-4 py-3 font-mono font-semibold text-clay">{inrFmt(inv.amountDue)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${ageBadge(inv.daysOutstanding)}`}>
                    {inv.daysOutstanding}d
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-500">{inv.invoiceDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Payer Mix Tab
// ──────────────────────────────────────────────────────────────────────────────
function PayerMixTab() {
  const totalRevenue = PAYER_MIX.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Payer distribution
          </div>
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="h-52 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PAYER_MIX}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="amount"
                    nameKey="payer"
                  >
                    {PAYER_MIX.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => inrFmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {PAYER_MIX.map((p, i) => (
                <div key={p.payer} className="flex items-center gap-2 text-[12px]">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-ink-600">{p.payer}</span>
                  <span className="font-semibold text-ink-900">{p.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Month-over-month comparison
          </div>
          <div className="px-4 py-4 h-[224px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PAYER_MONTH_COMPARISON}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="payer" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => inrFmt(v)} />
                <Legend />
                <Bar dataKey="current" fill="#2c7873" name="Current month" radius={[3, 3, 0, 0]} />
                <Bar dataKey="previous" fill="#a87826" name="Previous month" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Insurance breakdown
        </div>
        <table className="w-full text-[13px]">
          <thead className="border-b border-ink-100 bg-bone/60">
            <tr>
              {["Provider", "Patients", "Invoiced", "Collected", "Collection rate"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {INSURANCE_BREAKDOWN.map((p) => {
              const rate = Math.round((p.collected / p.invoiced) * 100);
              return (
                <tr key={p.provider} className="hover:bg-bone/40">
                  <td className="px-5 py-3 font-medium">{p.provider}</td>
                  <td className="px-5 py-3 tabular-nums">{p.patients}</td>
                  <td className="px-5 py-3 font-mono">{inrFmt(p.invoiced)}</td>
                  <td className="px-5 py-3 font-mono text-money">{inrFmt(p.collected)}</td>
                  <td className="px-5 py-3">
                    <span className={rate >= 85 ? "text-teal font-semibold" : rate >= 70 ? "text-money" : "text-clay"}>
                      {rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminRevenue() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="space-y-5" data-testid="admin-revenue">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-ink-100 bg-bone/60 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
              tab === t ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab />}
      {tab === "By Department" && <DepartmentTab />}
      {tab === "Outstanding Dues" && <OutstandingTab />}
      {tab === "Payer Mix" && <PayerMixTab />}
    </div>
  );
}
