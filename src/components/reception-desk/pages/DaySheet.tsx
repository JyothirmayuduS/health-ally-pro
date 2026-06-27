import { useMemo } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { computeTotals } from "@/lib/reception-desk/billingData";
import { printDaySheet } from "@/lib/reception-desk/print";
import { DeskKpi, DeskPanel } from "@/components/desk-shell/ui";
import { Printer, ClipboardCheck, Stethoscope } from "lucide-react";

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function DaySheet() {
  const { appointments, patients, doctors, invoices, shifts, staff } = useStore();
  const today = appointments.filter((a) => a.date === TODAY_STR);

  const kpis = useMemo(() => {
    const footfall = today.length;
    const noShow = today.filter((a) => a.status === "no-show").length;
    
    // Invoices paid today (gross)
    const paidInvoices = invoices.filter(
      (i) => (i.status === "paid" || i.status === "partial-refund" || i.status === "refunded") && i.date === TODAY_STR
    );
    const grossRevenue = paidInvoices.reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);
    
    // Refunds processed today
    const totalRefundsToday = invoices.reduce((sum, i) => {
      const todayRefunds = (i.refunds || []).filter((r) => r.processedAt.startsWith(TODAY_STR));
      return sum + todayRefunds.reduce((sSum, r) => sSum + r.amount, 0);
    }, 0);
    
    const netRevenue = grossRevenue - totalRefundsToday;
    return {
      footfall,
      noShow,
      noShowRate: footfall ? Math.round((noShow / footfall) * 100) : 0,
      avgWait: footfall ? 14 + (footfall % 4) : 0,
      revenue: netRevenue,
    };
  }, [today, invoices]);

  const byMethod = useMemo(() => {
    const paid = invoices.filter(
      (i) => (i.status === "paid" || i.status === "partial-refund" || i.status === "refunded") && i.date === TODAY_STR
    );
    const map: Record<string, number> = { cash: 0, card: 0, upi: 0, insurance: 0 };
    paid.forEach((i) => {
      const t = computeTotals(i.items, i.discount).total;
      const invoiceRefundsToday = (i.refunds || [])
        .filter((r) => r.processedAt.startsWith(TODAY_STR))
        .reduce((sum, r) => sum + r.amount, 0);
      if (i.method && map[i.method] !== undefined) map[i.method] += (t - invoiceRefundsToday);
    });
    return Object.entries(map).map(([k, v]) => ({ method: k.toUpperCase(), value: v }));
  }, [invoices]);

  const byDoctor = useMemo(
    () =>
      doctors.map((d) => {
        const docToday = today.filter((a) => a.doctorId === d.id);
        const rev = invoices
          .filter(
            (i) =>
              (i.status === "paid" || i.status === "partial-refund" || i.status === "refunded") &&
              i.date === TODAY_STR &&
              i.doctorId === d.id
          )
          .reduce((s, i) => {
            const invoiceTotal = computeTotals(i.items, i.discount).total;
            const invoiceRefundsToday = (i.refunds || [])
              .filter((r) => r.processedAt.startsWith(TODAY_STR))
              .reduce((sum, r) => sum + r.amount, 0);
            return s + (invoiceTotal - invoiceRefundsToday);
          }, 0);
        return { name: d.name, booked: docToday.length, revenue: rev };
      }),
    [doctors, today, invoices],
  );

  const shiftRows = shifts
    .filter((s) => s.date === TODAY_STR)
    .map((s) => {
      const st = staff.find((x) => x.id === s.staffId);
      const refunds = invoices.reduce((sum, i) => {
        const shiftRefunds = (i.refunds || []).filter(
          (r) =>
            r.method === "cash" &&
            r.processedAt >= s.openedAt &&
            (!s.closedAt || r.processedAt <= s.closedAt)
        );
        return sum + shiftRefunds.reduce((sSum, r) => sSum + r.amount, 0);
      }, 0);

      return {
        label: s.label,
        staff: st?.name || "—",
        opened: s.openedAt ? s.openedAt.slice(11, 16) : "—",
        closed: s.closedAt ? s.closedAt.slice(11, 16) : null,
        cash: s.cashCollected || 0,
        refunds,
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

  const cancellations = useMemo(() => today.filter((a) => a.status === "cancelled"), [today]);

  const cancelReasons = useMemo(() => {
    const map: Record<string, number> = {};
    cancellations.forEach((a) => {
      const r = a.cancellationReason || "Other";
      map[r] = (map[r] || 0) + 1;
    });
    return map;
  }, [cancellations]);

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
    <div data-testid="day-sheet-page" className="space-y-6">
      <div className="module-hero flex flex-wrap items-center gap-4 border-clay/30 bg-clay-soft">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-clay text-white">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-clay">
            End-of-day · {TODAY_STR}
          </div>
          <p className="mt-0.5 font-heading text-[15px] font-semibold text-ink-900">
            Signed summary for handover to admin and finance.
          </p>
        </div>
        <button data-testid="day-sheet-print" onClick={doPrint} className="btn-clay btn-lg">
          <Printer className="h-4 w-4" />
          Print day sheet
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DeskKpi label="Footfall" value={kpis.footfall} sub="appointments" />
        <DeskKpi
          label="No-shows"
          value={kpis.noShow}
          sub={`${kpis.noShowRate}% rate`}
          accent="text-clay"
        />
        <DeskKpi label="Avg wait" value={`${kpis.avgWait} min`} accent="text-mustard" />
        <DeskKpi label="Revenue" value={fmt(kpis.revenue)} accent="text-money" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DeskPanel title="Collected by method">
          <table className="w-full text-[13px]">
            <thead className="border-b border-ink-200 bg-bone font-mono text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Method</th>
                <th className="px-5 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {byMethod.map((m) => (
                <tr key={m.method}>
                  <td className="px-5 py-2.5 text-ink-900">{m.method}</td>
                  <td className="px-5 py-2.5 text-right font-mono">{fmt(m.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DeskPanel>

        <DeskPanel title="Revenue by doctor">
          <table className="w-full text-[13px]">
            <thead className="border-b border-ink-200 bg-bone font-mono text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Doctor</th>
                <th className="px-3 py-2.5 text-right font-medium">Appts</th>
                <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {byDoctor.map((d) => (
                <tr key={d.name}>
                  <td className="px-5 py-2.5">
                    <span className="inline-flex items-center gap-2 text-ink-900">
                      <Stethoscope className="h-3.5 w-3.5 text-sage" />
                      {d.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{d.booked}</td>
                  <td className="px-5 py-2.5 text-right font-mono">{fmt(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DeskPanel>

        {noShows.length > 0 && (
          <DeskPanel title={`No-shows · ${noShows.length}`} className="lg:col-span-2">
            <div className="divide-y divide-ink-100">
              {noShows.map((n, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 text-[13px]">
                  <span className="w-14 font-mono text-ink-500">{n.time}</span>
                  <span className="flex-1 font-medium text-ink-900">{n.patient}</span>
                  <span className="text-ink-500">{n.doctor}</span>
                </div>
              ))}
            </div>
          </DeskPanel>
        )}

        {cancellations.length > 0 && (
          <DeskPanel title={`Cancellations · ${cancellations.length}`} className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">Reason Breakdown</div>
                <table className="w-full text-[13px]">
                  <tbody className="divide-y divide-ink-100">
                    {Object.entries(cancelReasons).map(([reason, count]) => (
                      <tr key={reason}>
                        <td className="py-2 text-ink-900">{reason}</td>
                        <td className="py-2 text-right font-mono font-medium">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">Cancelled Appointments</div>
                <div className="divide-y divide-ink-100 max-h-[200px] overflow-y-auto pr-2">
                  {cancellations.map((a, i) => {
                    const p = patients.find((x) => x.id === a.patientId);
                    const d = doctors.find((x) => x.id === a.doctorId);
                    return (
                      <div key={i} className="flex justify-between py-2 text-[12.5px]">
                        <div>
                          <span className="font-mono text-ink-500 mr-2">{a.time}</span>
                          <span className="font-medium text-ink-900">{p?.name || "—"}</span>
                          <span className="text-ink-400 text-[11px] block">Doctor: {d?.name || "—"}</span>
                        </div>
                        <span className="text-status-noshowText font-medium text-[11.5px] uppercase tracking-wider">{a.cancellationReason || "Other"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DeskPanel>
        )}

        <DeskPanel title="Shifts & cash drawer" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-ink-200 bg-bone font-mono text-[11px] uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Shift</th>
                  <th className="px-3 py-2.5 text-left font-medium">Staff</th>
                  <th className="px-3 py-2.5 text-left font-medium">Opened</th>
                  <th className="px-3 py-2.5 text-left font-medium">Closed</th>
                  <th className="px-3 py-2.5 text-right font-medium">Cash</th>
                  <th className="px-3 py-2.5 text-right font-medium">Refunds</th>
                  <th className="px-5 py-2.5 text-right font-medium">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {shiftRows.map((s, i) => (
                  <tr key={i}>
                    <td className="px-5 py-2.5 font-medium">{s.label}</td>
                    <td className="px-3 py-2.5">{s.staff}</td>
                    <td className="px-3 py-2.5 font-mono">{s.opened}</td>
                    <td className="px-3 py-2.5 font-mono">{s.closed || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmt(s.cash)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-status-noshowText">{fmt(s.refunds)}</td>
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
                    <td colSpan={7} className="px-5 py-8 text-center text-[13px] text-ink-400">
                      No shifts opened today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DeskPanel>
      </div>
    </div>
  );
}
