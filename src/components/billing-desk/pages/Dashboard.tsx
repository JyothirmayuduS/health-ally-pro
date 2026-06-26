import { Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Receipt, CreditCard, Layers, ArrowRight } from "lucide-react";
import { useBillingStore, fmtLedger } from "@/lib/billing-desk/store";
import { FINANCE_KPIS, PAYMENT_METHODS, REVENUE_VS_EXPENSES, fmtInr } from "@/lib/hospital-erp-data";
import { MedoraAiChatBar } from "@/components/ai/MedoraAiChatBar";
import { DeskKpi, DeskPanel, DeskQuickAction, DeskTable, DeskThead, DeskTh, DeskEmpty } from "@/components/desk-shell/ui";

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E5E0",
  borderRadius: 8,
  fontSize: 12,
};

export default function BillingDashboard() {
  const { invoices, payments, encounters } = useBillingStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayInvoices = invoices.filter((i) => i.date === today);
  const unpaid = invoices.filter((i) => i.status !== "paid");
  const todayCollected = payments
    .filter((p) => p.at.startsWith(today))
    .reduce((s, p) => s + p.amount, 0);
  const openEncounters = encounters.filter((e) => e.status === "open");

  const bySource = ["reception", "lab", "pharmacy"] as const;
  const sourceTotals = Object.fromEntries(
    bySource.map((src) => [
      src,
      invoices.filter((i) => i.source === src).reduce((s, i) => s + i.amountPaid, 0),
    ]),
  );

  return (
    <div className="space-y-6" data-testid="billing-dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeskKpi
          testId="kpi-today-revenue"
          label="Today's collections"
          value={fmtLedger(todayCollected)}
          sub={`${FINANCE_KPIS.revenueToday.delta} vs last week`}
        />
        <DeskKpi
          testId="kpi-outstanding"
          label="Outstanding"
          value={fmtLedger(unpaid.reduce((s, i) => s + (i.total - i.amountPaid), 0))}
          sub={`${unpaid.length} open`}
          accent="text-clay"
        />
        <DeskKpi testId="kpi-payments" label="Payments logged" value={payments.length} />
        <DeskKpi
          testId="kpi-encounters"
          label="Open encounters"
          value={openEncounters.length}
          accent="text-teal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <DeskQuickAction to="/billing/invoices" icon={Receipt} label="Review invoices" testId="qa-invoices" />
          <DeskQuickAction
            to="/billing/payments"
            icon={CreditCard}
            label="Payment log"
            testId="qa-payments"
            accentClass="bg-teal-soft text-teal group-hover:bg-teal group-hover:text-white"
          />
          <DeskQuickAction
            to="/billing/encounters"
            icon={Layers}
            label="Link encounters"
            testId="qa-encounters"
            accentClass="bg-plum-soft text-plum group-hover:bg-plum group-hover:text-white"
          />
        </div>

        <DeskPanel title="Revenue by department" className="lg:col-span-2">
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {bySource.map((src) => (
              <div key={src} className="rounded-lg border border-ink-200 bg-stone-50 px-4 py-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{src}</div>
                <div className="mt-2 font-heading text-xl font-semibold tabular-nums">
                  {fmtLedger(sourceTotals[src])}
                </div>
                <div className="mt-1 text-[11px] text-ink-500">collected</div>
              </div>
            ))}
          </div>
        </DeskPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DeskPanel title="Revenue vs expenses (6 months)">
          <div className="h-56 p-4">
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
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PAYMENT_METHODS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE6" />
                <XAxis dataKey="method" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmtInr(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="amount" fill="#2C7873" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DeskPanel>
      </div>

      <DeskPanel
        title="Unpaid invoices"
        action={
          <Link to="/billing/invoices" className="text-[12px] font-medium text-teal hover:underline">
            View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
          </Link>
        }
      >
        <DeskTable>
          <DeskThead>
            <DeskTh>Invoice</DeskTh>
            <DeskTh>Patient</DeskTh>
            <DeskTh>Source</DeskTh>
            <DeskTh align="right">Balance</DeskTh>
          </DeskThead>
          <tbody>
            {unpaid.slice(0, 8).map((inv) => (
              <tr key={inv.id} className="border-b border-stone-100 hover:bg-bone/50">
                <td className="px-4 py-3 font-mono text-xs">{inv.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{inv.patientName}</div>
                  <div className="text-[11px] text-ink-400">{inv.mrn}</div>
                </td>
                <td className="px-4 py-3 capitalize text-ink-500">{inv.source}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-clay">
                  {fmtLedger(inv.total - inv.amountPaid)}
                </td>
              </tr>
            ))}
            {unpaid.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <DeskEmpty>All invoices settled — nothing outstanding.</DeskEmpty>
                </td>
              </tr>
            )}
          </tbody>
        </DeskTable>
      </DeskPanel>

      <DeskPanel title="Finance AI assistant">
        <div className="p-4">
          <MedoraAiChatBar
            context="billing"
            compact
            placeholder="Ask about revenue, unpaid invoices, payment mix…"
          />
        </div>
      </DeskPanel>
    </div>
  );
}
