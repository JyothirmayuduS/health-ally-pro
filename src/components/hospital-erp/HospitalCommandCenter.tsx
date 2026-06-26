import { Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErpStatusPill } from "./ErpStatusPill";
import {
  FINANCE_KPIS,
  fmtInr,
  IMAGING_ORDERS,
  IPD_ADMISSIONS_CURRENT,
  IPD_ADMISSIONS_PENDING,
  IPD_SUMMARY,
  LAB_ORDERS_SNAPSHOT,
  OPD_TODAY,
  OT_ROOMS,
  OT_UTILIZATION,
  PAYMENT_METHODS,
  RECENT_BILLS,
  REVENUE_VS_EXPENSES,
  WARD_OCCUPANCY,
} from "@/lib/hospital-erp-data";
import { DeskPanel, DeskTable, DeskThead, DeskTh } from "@/components/desk-shell/ui";
import { HospitalAiInsights } from "./HospitalAiInsights";
import { MedoraAiChatBar } from "@/components/ai/MedoraAiChatBar";
import { ArrowRight, BedDouble, FlaskConical, Scan, Stethoscope, Wallet } from "lucide-react";

const CHART_COLORS = ["#2C7873", "#B85C38", "#A87826", "#7A4A6B"];
const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E5E0",
  borderRadius: 8,
  fontSize: 12,
};

function FinanceKpi({
  label,
  value,
  delta,
  vs,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  vs: string;
  accent?: string;
}) {
  return (
    <div className="surface border-l-4 border-l-teal px-5 py-4">
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">{label}</p>
      <p className="mt-2 font-heading text-[28px] font-semibold tabular-nums text-ink-900">{value}</p>
      <p className={`mt-1 text-[11px] font-medium ${accent ?? "text-sage"}`}>
        {delta} <span className="text-ink-400">{vs}</span>
      </p>
    </div>
  );
}

function WardBar({ ward, occupied, total }: { ward: string; occupied: number; total: number }) {
  const pct = Math.round((occupied / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-ink-700">{ward}</span>
        <span className="text-ink-400">
          {occupied}/{total} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function HospitalCommandCenter() {
  return (
    <div className="space-y-6" data-testid="hospital-command-center">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">Medora ERP</p>
          <h2 className="font-heading text-xl font-semibold text-ink-900 sm:text-2xl">Hospital command center</h2>
          <p className="mt-0.5 text-sm text-ink-500">Clinical · Diagnostics · Operations · Finance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/reception" className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-stone-50">
            OPD →
          </Link>
          <Link to="/nursing/beds" className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-stone-50">
            IPD →
          </Link>
          <Link to="/lab" className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-stone-50">
            Lab →
          </Link>
          <Link to="/billing" className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-stone-50">
            Billing →
          </Link>
        </div>
      </div>

      {/* Finance KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceKpi label="Revenue today" value={fmtInr(FINANCE_KPIS.revenueToday.value)} delta={FINANCE_KPIS.revenueToday.delta} vs={FINANCE_KPIS.revenueToday.vs} />
        <FinanceKpi label="Pending payments" value={fmtInr(FINANCE_KPIS.pendingPayments.value)} delta={FINANCE_KPIS.pendingPayments.delta} vs={FINANCE_KPIS.pendingPayments.vs} accent="text-clay" />
        <FinanceKpi label="Total collected" value={fmtInr(FINANCE_KPIS.totalCollected.value)} delta={FINANCE_KPIS.totalCollected.delta} vs={FINANCE_KPIS.totalCollected.vs} />
        <FinanceKpi label="Insurance claims" value={String(FINANCE_KPIS.insuranceClaims.value)} delta={FINANCE_KPIS.insuranceClaims.delta} vs={FINANCE_KPIS.insuranceClaims.vs} accent="text-plum" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DeskPanel title="Revenue vs expenses">
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_VS_EXPENSES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => fmtInr(v)} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#2C7873" fill="#2C787320" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#B85C38" fill="#B85C3820" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DeskPanel>

        <DeskPanel title="Payment methods">
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PAYMENT_METHODS} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 11 }} width={72} />
                <Tooltip formatter={(v: number) => fmtInr(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="amount" fill="#2C7873" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DeskPanel>
      </div>

      {/* Bills + OPD */}
      <div className="grid gap-4 xl:grid-cols-2">
        <DeskPanel
          title="Recent bills"
          action={
            <Link to="/billing/invoices" className="text-[12px] font-medium text-teal hover:underline">
              View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <DeskTable>
            <DeskThead>
              <DeskTh>Bill</DeskTh>
              <DeskTh>Patient</DeskTh>
              <DeskTh align="right">Amount</DeskTh>
              <DeskTh>Status</DeskTh>
            </DeskThead>
            <tbody>
              {RECENT_BILLS.map((b) => (
                <tr key={b.id} className="border-b border-stone-100 hover:bg-bone/50">
                  <td className="px-4 py-2.5 font-mono text-xs">{b.id}</td>
                  <td className="px-4 py-2.5 text-sm">{b.patient}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm">{fmtInr(b.amount)}</td>
                  <td className="px-4 py-2.5">
                    <ErpStatusPill status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DeskTable>
        </DeskPanel>

        <DeskPanel
          title="OPD — today's schedule"
          action={
            <Link to="/reception/appointments" className="text-[12px] font-medium text-teal hover:underline">
              Full schedule <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <ul className="divide-y divide-ink-100">
            {OPD_TODAY.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-soft text-xs font-bold text-teal">
                  {a.patient.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{a.patient}</span>
                    <ErpStatusPill status={a.status} />
                  </div>
                  <p className="text-xs text-ink-500">
                    {a.type} · {a.dept} · {a.doctor}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-mono text-ink-400">{a.time}</span>
              </li>
            ))}
          </ul>
        </DeskPanel>
      </div>

      {/* IPD + Lab */}
      <div className="grid gap-4 xl:grid-cols-2">
        <DeskPanel
          title="IPD & bed occupancy"
          action={
            <Link to="/nursing/beds" className="text-[12px] font-medium text-teal hover:underline">
              Manage beds <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-ink-200 bg-stone-50 p-3 text-center">
                <BedDouble className="mx-auto h-5 w-5 text-teal" />
                <p className="mt-1 text-lg font-semibold tabular-nums">{IPD_SUMMARY.totalBeds}</p>
                <p className="text-[10px] uppercase text-ink-400">Total</p>
              </div>
              <div className="rounded-lg border border-ink-200 bg-stone-50 p-3 text-center">
                <p className="mt-6 text-lg font-semibold tabular-nums text-plum">{IPD_SUMMARY.occupied}</p>
                <p className="text-[10px] uppercase text-ink-400">Occupied</p>
              </div>
              <div className="rounded-lg border border-ink-200 bg-stone-50 p-3 text-center">
                <p className="mt-6 text-lg font-semibold tabular-nums text-sage">{IPD_SUMMARY.available}</p>
                <p className="text-[10px] uppercase text-ink-400">Available</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-24 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: IPD_SUMMARY.occupancyRate }, { value: 100 - IPD_SUMMARY.occupancyRate }]}
                      innerRadius={28}
                      outerRadius={40}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#2C7873" />
                      <Cell fill="#EDEAE6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute inset-0 grid place-items-center text-sm font-bold text-teal">
                  {IPD_SUMMARY.occupancyRate}%
                </span>
              </div>
              <p className="text-[10px] uppercase text-ink-400">Occupancy</p>
            </div>
          </div>
          <div className="space-y-3 border-t border-ink-200 px-5 py-4">
            {WARD_OCCUPANCY.map((w) => (
              <WardBar key={w.ward} {...w} />
            ))}
          </div>
        </DeskPanel>

        <DeskPanel
          title="Laboratory orders"
          action={
            <Link to="/lab/orders" className="text-[12px] font-medium text-teal hover:underline">
              Lab inbox <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <DeskTable>
            <DeskThead>
              <DeskTh>Test</DeskTh>
              <DeskTh>Patient</DeskTh>
              <DeskTh>Priority</DeskTh>
              <DeskTh>Status</DeskTh>
            </DeskThead>
            <tbody>
              {LAB_ORDERS_SNAPSHOT.map((o) => (
                <tr key={o.id} className="border-b border-stone-100">
                  <td className="px-4 py-2.5 text-sm font-medium">{o.test}</td>
                  <td className="px-4 py-2.5 text-sm text-ink-600">{o.patient}</td>
                  <td className="px-4 py-2.5">
                    <ErpStatusPill status={o.priority} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ErpStatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </DeskTable>
        </DeskPanel>
      </div>

      {/* OT + Imaging */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DeskPanel
          title="Operation theatre"
          action={
            <Link to="/admin/ot" className="text-[12px] font-medium text-teal hover:underline">
              OT board <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <div className="flex items-center gap-6 border-b border-ink-200 px-5 py-4">
            <div className="text-center">
              <p className="font-heading text-3xl font-semibold text-teal">{OT_UTILIZATION}%</p>
              <p className="text-[10px] uppercase text-ink-400">Utilization</p>
            </div>
            <div className="flex-1 space-y-2">
              {OT_ROOMS.map((ot) => (
                <div key={ot.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{ot.name}</span>
                  <div className="flex items-center gap-2">
                    {ot.procedure && <span className="text-xs text-ink-400">{ot.procedure}</span>}
                    <ErpStatusPill status={ot.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DeskPanel>

        <DeskPanel
          title="Radiology & imaging"
          action={
            <Link to="/lab/radiology" className="text-[12px] font-medium text-teal hover:underline">
              Imaging queue <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          }
        >
          <ul className="divide-y divide-ink-100">
            {IMAGING_ORDERS.map((img) => (
              <li key={img.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">{img.study}</p>
                  <p className="text-xs text-ink-500">
                    {img.patient} · {img.mrn} · {img.modality}
                  </p>
                </div>
                <ErpStatusPill status={img.status} />
              </li>
            ))}
          </ul>
        </DeskPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HospitalAiInsights />
        <div className="space-y-2">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
            Ask Medora
          </p>
          <MedoraAiChatBar context="general" placeholder="Ask about beds, revenue, lab backlog, OT status…" />
        </div>
      </div>

      {/* Sector quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/reception", icon: Stethoscope, label: "OPD & reception", color: "bg-sage-soft text-sage" },
          { to: "/nursing/beds", icon: BedDouble, label: "IPD & beds", color: "bg-plum-soft text-plum" },
          { to: "/lab", icon: FlaskConical, label: "Laboratory", color: "bg-teal-soft text-teal" },
          { to: "/pharmacy", icon: Wallet, label: "Pharmacy", color: "bg-mustard-soft text-mustard" },
          { to: "/lab/radiology", icon: Scan, label: "Radiology", color: "bg-clay-soft text-clay" },
          { to: "/admin/ot", icon: Stethoscope, label: "Operation theatre", color: "bg-plum-soft text-plum" },
          { to: "/billing", icon: Wallet, label: "Billing & finance", color: "bg-money-soft text-money" },
          { to: "/admin/staff", icon: Stethoscope, label: "Staff & inventory", color: "bg-stone-100 text-ink-600" },
        ].map((item) => (
          <Link
            key={item.to + item.label}
            to={item.to}
            className="surface flex items-center gap-3 px-4 py-3 transition hover:border-teal"
          >
            <div className={`grid h-9 w-9 place-items-center rounded-sm ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-ink-900">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
