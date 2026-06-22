import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { TODAY_STR } from "@/lib/mockData";
import { computeTotals } from "@/lib/billingData";
import { printDaySheet } from "@/lib/print";
import { Printer, Hash, ClipboardCheck, AlertCircle, IndianRupee, Stethoscope } from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function DaySheet() {
  const { appointments, patients, doctors, invoices, shifts, staff } = useStore();
  const today = appointments.filter((a) => a.date === TODAY_STR);

  const kpis = useMemo(() => {
    const footfall = today.length;
    const noShow = today.filter((a) => a.status === "no-show").length;
    const revenue = invoices
      .filter((i) => i.status === "paid" && i.date === TODAY_STR)
      .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);
    return {
      footfall,
      noShow,
      noShowRate: footfall ? Math.round((noShow / footfall) * 100) : 0,
      avgWait: footfall ? 14 + (footfall % 4) : 0,
      revenue,
    };
  }, [today, invoices]);

  const byMethod = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid" && i.date === TODAY_STR);
    const map = { cash: 0, card: 0, upi: 0, insurance: 0 };
    paid.forEach((i) => {
      const t = computeTotals(i.items, i.discount).total;
      if (i.method && map[i.method] !== undefined) map[i.method] += t;
    });
    return Object.entries(map).map(([k, v]) => ({ method: k.toUpperCase(), value: v }));
  }, [invoices]);

  const byDoctor = useMemo(
    () =>
      doctors.map((d) => {
        const docToday = today.filter((a) => a.doctorId === d.id);
        const rev = invoices
          .filter((i) => i.status === "paid" && i.date === TODAY_STR && i.doctorId === d.id)
          .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);
        return { name: d.name, booked: docToday.length, revenue: rev };
      }),
    [doctors, today, invoices],
  );

  const shiftRows = shifts
    .filter((s) => s.date === TODAY_STR)
    .map((s) => {
      const st = staff.find((x) => x.id === s.staffId);
      return {
        label: s.label,
        staff: st?.name || "—",
        opened: s.openedAt ? s.openedAt.slice(11, 16) : "—",
        closed: s.closedAt ? s.closedAt.slice(11, 16) : null,
        cash: s.cashCollected || 0,
        variance: s.variance || 0,
      };
    });

  const noShows = today
    .filter((a) => a.status === "no-show")
    .map((a) => {
      const p = patients.find((x) => x.id === a.patientId);
      const d = doctors.find((x) => x.id === a.doctorId);
      return { time: a.time, patient: p?.name || "—", doctor: d?.name || "—" };
    });

  const doPrint = () =>
    printDaySheet({
      date: TODAY_STR,
      kpis,
      byMethod,
      byDoctor,
      shifts: shiftRows,
      noShows,
    });

  return (
    <div data-testid="day-sheet-page" className="space-y-5">
      <div className="module-hero bg-clay-soft border-clay/30 flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-clay text-white grid place-items-center">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[11px] uppercase tracking-[0.14em] text-clay font-mono font-medium">
            End-of-day · {TODAY_STR}
          </div>
          <div className="text-[15px] font-heading font-semibold text-ink-900">
            Single signed-off summary for the day. Print, sign, hand over to admin.
          </div>
        </div>
        <button
          data-testid="day-sheet-print"
          onClick={doPrint}
          className="btn-clay btn-lg"
        >
          <Printer className="w-4 h-4" />
          Print day sheet
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI tint="sage" icon={Hash} label="Footfall" value={kpis.footfall} />
        <KPI tint="clay" icon={AlertCircle} label="No-shows" value={`${kpis.noShow} · ${kpis.noShowRate}%`} />
        <KPI tint="mustard" icon={Hash} label="Avg wait" value={`${kpis.avgWait} min`} />
        <KPI tint="money" icon={IndianRupee} label="Revenue" value={fmt(kpis.revenue)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-2">
            <span className="dot-money" />
            <h2 className="text-[15px] font-heading font-semibold text-ink-900">
              Collected by method
            </h2>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-bone border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-400 font-mono">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Method</th>
                <th className="text-right font-medium px-5 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {byMethod.map((m) => (
                <tr key={m.method}>
                  <td className="px-5 py-2.5 text-ink-900">{m.method}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-ink-900">
                    {fmt(m.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-2">
            <span className="dot-sage" />
            <h2 className="text-[15px] font-heading font-semibold text-ink-900">
              Revenue by doctor
            </h2>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-bone border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-400 font-mono">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Doctor</th>
                <th className="text-right font-medium px-3 py-2.5">Appts</th>
                <th className="text-right font-medium px-5 py-2.5">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {byDoctor.map((d) => (
                <tr key={d.name}>
                  <td className="px-5 py-2.5 text-ink-900 inline-flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5 text-sage" />
                    {d.name}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{d.booked}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-ink-900">
                    {fmt(d.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="surface lg:col-span-2">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-2">
            <span className="dot-mustard" />
            <h2 className="text-[15px] font-heading font-semibold text-ink-900">
              Shifts &amp; cash drawer
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-bone border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Shift</th>
                  <th className="text-left font-medium px-3 py-2.5">Staff</th>
                  <th className="text-left font-medium px-3 py-2.5">Opened</th>
                  <th className="text-left font-medium px-3 py-2.5">Closed</th>
                  <th className="text-right font-medium px-3 py-2.5">Cash</th>
                  <th className="text-right font-medium px-5 py-2.5">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {shiftRows.map((s, i) => (
                  <tr key={i}>
                    <td className="px-5 py-2.5">{s.label}</td>
                    <td className="px-3 py-2.5">{s.staff}</td>
                    <td className="px-3 py-2.5 font-mono">{s.opened}</td>
                    <td className="px-3 py-2.5 font-mono">{s.closed || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmt(s.cash)}</td>
                    <td
                      className={`px-5 py-2.5 text-right font-mono ${
                        s.variance === 0
                          ? "text-money"
                          : s.variance > 0
                            ? "text-mustard"
                            : "text-clay"
                      }`}
                    >
                      {s.variance > 0 ? "+" : ""}
                      {fmt(s.variance)}
                    </td>
                  </tr>
                ))}
                {shiftRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-[12.5px] text-ink-400">
                      No shifts opened today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function KPI({ tint, icon: Icon, label, value }) {
  const map = {
    sage: { bg: "bg-sage-soft/60", border: "border-sage/30", text: "text-sage", iconBg: "bg-sage" },
    clay: { bg: "bg-clay-soft/60", border: "border-clay/30", text: "text-clay", iconBg: "bg-clay" },
    mustard: { bg: "bg-mustard-soft/60", border: "border-mustard/30", text: "text-mustard", iconBg: "bg-mustard" },
    money: { bg: "bg-money-soft/60", border: "border-money/30", text: "text-money", iconBg: "bg-money" },
  }[tint] || { bg: "bg-white", border: "border-ink-200", text: "", iconBg: "bg-ink-900" };
  return (
    <div className={`rounded-xl border p-4 ${map.bg} ${map.border}`}>
      <div className="flex items-center justify-between">
        <div className={`text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium ${map.text}`}>
          {label}
        </div>
        <div className={`w-7 h-7 rounded-full grid place-items-center ${map.iconBg} text-white`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-[24px] font-heading font-semibold text-ink-900 tabular-nums mt-2">
        {value}
      </div>
    </div>
  );
}
