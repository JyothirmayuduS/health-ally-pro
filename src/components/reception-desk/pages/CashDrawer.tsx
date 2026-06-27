import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { computeTotals } from "@/lib/reception-desk/billingData";
import { printDayReport } from "@/lib/reception-desk/print";
import { DENOMS } from "@/lib/reception-desk/opsData";
import { toast } from "sonner";
import { DeskKpi } from "@/components/desk-shell/ui";
import {
  Wallet,
  Lock,
  PlayCircle,
  FileText,
  ArrowRightLeft,
  X,
  CircleDot,
  CheckCircle2,
} from "lucide-react";

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

function timeStr(iso) {
  if (!iso) return "—";
  return iso.slice(11, 16);
}

function CloseShiftDialog({ shift, expected, onClose, onConfirm }) {
  const [denom, setDenom] = useState(
    Object.fromEntries(DENOMS.map((d) => [d, 0])),
  );
  const [note, setNote] = useState("");
  const counted = DENOMS.reduce((s, d) => s + d * (denom[d] || 0), 0);
  const variance = counted - expected;

  return (
    <div
      data-testid="close-shift-dialog"
      className="fixed inset-0 z-30 bg-black/40 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-ink-200 rounded-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-mustard-soft text-mustard grid place-items-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                Closing shift
              </div>
              <h3 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
                {shift.label} · {shift.id}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-2">
              Count denominations
            </div>
            <div className="space-y-2">
              {DENOMS.map((d) => (
                <div key={d} className="flex items-center gap-3">
                  <div className="w-14 text-right font-mono text-[13px] text-ink-900">
                    ₹{d}
                  </div>
                  <div className="text-ink-400 text-[12px]">×</div>
                  <input
                    type="number"
                    value={denom[d]}
                    onChange={(e) =>
                      setDenom({ ...denom, [d]: Number(e.target.value || 0) })
                    }
                    className="h-8 w-20 px-2 text-right text-[13px] bg-white border border-ink-200 rounded-md focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                    data-testid={`close-denom-${d}`}
                  />
                  <div className="ml-auto font-mono text-[13px] text-ink-900 tabular-nums">
                    {fmt(d * (denom[d] || 0))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-ink-200 flex justify-between text-[13px]">
              <span className="text-ink-600">Counted total</span>
              <span className="font-mono font-semibold text-ink-900">
                {fmt(counted)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-ink-200 bg-bone p-4">
              <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                Expected in drawer
              </div>
              <div className="font-mono text-[20px] font-semibold text-ink-900 mt-1">
                {fmt(expected)}
              </div>
              <div className="text-[11px] text-ink-400 mt-1">
                Opening float {fmt(shift.openingFloat)} + cash collected{" "}
                {fmt(expected - shift.openingFloat)}
              </div>
            </div>
            <div
              className={`rounded-lg border p-4 ${
                variance === 0
                  ? "border-money/30 bg-money-soft"
                  : variance > 0
                    ? "border-mustard/30 bg-mustard-soft"
                    : "border-clay/30 bg-clay-soft"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider font-mono text-ink-600">
                Variance
              </div>
              <div
                className={`font-mono text-[20px] font-semibold mt-1 ${
                  variance === 0
                    ? "text-money"
                    : variance > 0
                      ? "text-mustard"
                      : "text-clay"
                }`}
              >
                {variance >= 0 ? "+" : ""}
                {fmt(variance)}
              </div>
              <div className="text-[11px] text-ink-600 mt-1">
                {variance === 0
                  ? "Drawer balanced ✓"
                  : variance > 0
                    ? "Surplus — verify receipts"
                    : "Short — flag in handover"}
              </div>
            </div>
            <label className="block">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
                Handover note to next shift
              </div>
              <textarea
                data-testid="close-handover"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Pending invoices, issues, walk-ins to follow up…"
                className="w-full px-3 py-2 text-[13px] bg-white border border-ink-200 rounded-md focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              />
            </label>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-ink-200 flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            data-testid="close-shift-confirm"
            onClick={() =>
              onConfirm({ closingDenom: denom, variance, handover: note })
            }
            className="btn-mustard btn-lg flex-1"
          >
            <Lock className="w-4 h-4" />
            Close shift & handover
          </button>
        </div>
      </div>
    </div>
  );
}

function OpenShiftDialog({ staff, onClose, onConfirm }) {
  const [staffId, setStaffId] = useState(staff[0]?.id);
  const [label, setLabel] = useState("Evening");
  const [float, setFloat] = useState(3000);
  return (
    <div
      data-testid="open-shift-dialog"
      className="fixed inset-0 z-30 bg-black/40 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-ink-200 rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-money-soft text-money grid place-items-center">
              <PlayCircle className="w-4 h-4" />
            </div>
            <h3 className="text-[15px] font-heading font-semibold text-ink-900">
              Open new shift
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
              Staff
            </div>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              data-testid="open-staff"
              className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-md focus:outline-none focus:border-sage"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
              Shift label
            </div>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              data-testid="open-label"
              className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-md focus:outline-none focus:border-sage"
            >
              {["Morning", "Afternoon", "Evening", "Night"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
              Opening float (₹)
            </div>
            <input
              type="number"
              value={float}
              onChange={(e) => setFloat(Number(e.target.value || 0))}
              data-testid="open-float"
              className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-md focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
            />
          </label>
        </div>
        <div className="px-5 py-3 border-t border-ink-200 flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            data-testid="open-shift-confirm"
            onClick={() =>
              onConfirm({ staffId, label, openingFloat: Number(float) })
            }
            className="btn-money flex-1"
          >
            <PlayCircle className="w-4 h-4" />
            Open shift
          </button>
        </div>
      </div>
    </div>
  );
}

export function DayEndReportModal({ shift, collections, refunds, variance, topServices, cancellations, onClose, onPrint }) {
  return (
    <div className="fixed inset-0 z-30 bg-black/40 grid place-items-center p-4">
      <div className="bg-white border border-ink-200 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="px-5 py-4 border-b border-ink-200 flex justify-between items-center shrink-0">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">Shift Summary</div>
            <h3 className="text-[16px] font-heading font-semibold text-ink-900 mt-0.5">{shift.label} Shift End Report</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-4 text-[13px]">
          <div className="grid grid-cols-2 gap-4 p-3 bg-bone border border-ink-200 rounded-lg">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">Staff Lead</span>
              <div className="font-semibold text-ink-900">{shift.staffName}</div>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">Shift Timeline</span>
              <div className="text-ink-600 font-mono">{timeStr(shift.openedAt)} - {timeStr(shift.closedAt)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-ink-200 rounded-lg p-3 bg-bone/10">
              <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">Collections</div>
              <div className="space-y-1">
                {Object.entries(collections).map(([m, amt]) => (
                  <div key={m} className="flex justify-between font-mono">
                    <span className="capitalize text-ink-600">{m}</span>
                    <span className="text-ink-900 font-medium">{fmt(amt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-ink-200 rounded-lg p-3 bg-bone/10">
              <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">Drawer Cash</div>
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Opening Float</span>
                  <span>{fmt(shift.openingFloat)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Expected Cash</span>
                  <span>{fmt(shift.openingFloat + (shift.cashCollected || 0))}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Actual Cash</span>
                  <span>{fmt(shift.actualCash || 0)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Refunds</span>
                  <span className="text-status-noshowText">{fmt(refunds || 0)}</span>
                </div>
                <div className="flex justify-between font-mono border-t border-ink-200 pt-1 mt-1 font-semibold">
                  <span>Variance</span>
                  <span className={variance === 0 ? "text-money" : variance > 0 ? "text-mustard" : "text-clay"}>
                    {variance >= 0 ? "+" : ""}{fmt(variance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-ink-200 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">Top 5 Services Billed</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink-200 text-[10px] text-ink-400 font-mono uppercase">
                  <th className="pb-1">Service</th>
                  <th className="pb-1 text-right">Count</th>
                  <th className="pb-1 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {topServices.map((s: any, idx: number) => (
                  <tr key={s.name}>
                    <td className="py-1.5 font-medium text-ink-900">{idx + 1}. {s.name}</td>
                    <td className="py-1.5 text-right font-mono">{s.count}</td>
                    <td className="py-1.5 text-right font-mono text-ink-900">{fmt(s.revenue)}</td>
                  </tr>
                ))}
                {topServices.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-ink-400 italic">No services billed in this shift.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-ink-200 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-2">Cancellations Reasons</div>
            <div className="space-y-1">
              {Object.entries(cancellations).map(([r, count]) => (
                <div key={r} className="flex justify-between">
                  <span className="text-ink-600">{r}</span>
                  <span className="font-mono text-ink-900 font-semibold">{count}</span>
                </div>
              ))}
              {Object.keys(cancellations).length === 0 && (
                <div className="text-ink-400 italic text-center py-2">No cancellations today.</div>
              )}
            </div>
          </div>

          {shift.handover && (
            <div className="p-3 border border-mustard/30 bg-mustard-soft/30 rounded-lg">
              <span className="text-[11.5px] uppercase tracking-wider text-mustard font-mono font-medium block mb-1">Handover Note</span>
              <p className="text-ink-900 text-[12.5px] font-medium">{shift.handover}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-ink-200 flex justify-end gap-2 bg-bone shrink-0">
          <button onClick={onClose} className="btn-outline h-9">Close</button>
          <button onClick={onPrint} className="btn-primary h-9 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashDrawer() {
  const { shifts, staff, invoices, appointments, openShift, closeShift } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(null);
  const [reportShift, setReportShift] = useState<any>(null);

  const getCollectionsForShift = (s: any) => {
    const shiftInvoices = invoices.filter(
      (i) =>
        (i.status === "paid" || i.status === "refunded" || i.status === "partial-refund") &&
        i.paidAt &&
        i.paidAt >= s.openedAt &&
        (!s.closedAt || i.paidAt <= s.closedAt)
    );
    const methodTotals: Record<string, number> = { cash: 0, card: 0, upi: 0, insurance: 0 };
    shiftInvoices.forEach((i) => {
      const t = computeTotals(i.items, i.discount).total;
      const invoiceRefundsShift = (i.refunds || [])
        .filter((r) => r.processedAt >= s.openedAt && (!s.closedAt || r.processedAt <= s.closedAt))
        .reduce((sum, r) => sum + r.amount, 0);
      methodTotals[i.method] = (methodTotals[i.method] || 0) + (t - invoiceRefundsShift);
    });
    return methodTotals;
  };

  const getRefundsForShift = (s: any) => {
    return invoices.reduce((sum, i) => {
      const shiftRefunds = (i.refunds || []).filter(
        (r) =>
          r.processedAt >= s.openedAt &&
          (!s.closedAt || r.processedAt <= s.closedAt)
      );
      return sum + shiftRefunds.reduce((sSum, r) => sSum + r.amount, 0);
    }, 0);
  };

  const getTopServicesForShift = (s: any) => {
    const shiftInvoices = invoices.filter(
      (i) =>
        (i.status === "paid" || i.status === "refunded" || i.status === "partial-refund") &&
        i.paidAt &&
        i.paidAt >= s.openedAt &&
        (!s.closedAt || i.paidAt <= s.closedAt)
    );
    const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
    shiftInvoices.forEach((i) => {
      i.items.forEach((item) => {
        if (!serviceMap[item.label]) {
          serviceMap[item.label] = { name: item.label, count: 0, revenue: 0 };
        }
        serviceMap[item.label].count += item.qty || 1;
        serviceMap[item.label].revenue += item.amount;
      });
    });
    return Object.values(serviceMap)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getCancellationsForShift = (s: any) => {
    const cancelledToday = appointments.filter(
      (a) => a.status === "cancelled" && a.date === TODAY_STR
    );
    const counts: Record<string, number> = {};
    cancelledToday.forEach((a) => {
      const reason = a.cancellationReason || "Other";
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return counts;
  };

  const handleOpenReport = (s: any) => {
    const st = staff.find((x) => x.id === s.staffId);
    const collections = getCollectionsForShift(s);
    const refunds = getRefundsForShift(s);
    const topServices = getTopServicesForShift(s);
    const cancellations = getCancellationsForShift(s);
    setReportShift({
      ...s,
      staffName: st?.name || "Medical Officer",
      collections,
      refunds,
      topServices,
      cancellations,
    });
  };

  const todayShifts = shifts.filter((s) => s.date === TODAY_STR);
  const openShifts = todayShifts.filter((s) => s.status === "open");
  const closedShifts = todayShifts.filter((s) => s.status === "closed");

  // Derive cash collected for open shifts from invoices paid since shift opened
  const cashByOpenShift = useMemo(() => {
    const out = {};
    openShifts.forEach((s) => {
      const grossCash = invoices
        .filter(
          (i) =>
            (i.status === "paid" || i.status === "refunded" || i.status === "partial-refund") &&
            i.method === "cash" &&
            i.paidAt &&
            i.paidAt >= s.openedAt,
        )
        .reduce((sum, i) => sum + computeTotals(i.items, i.discount).total, 0);

      const cashRefunds = invoices.reduce((sum, i) => {
        const shiftRefunds = (i.refunds || []).filter(
          (r) => r.method === "cash" && r.processedAt >= s.openedAt
        );
        return sum + shiftRefunds.reduce((sSum, r) => sSum + r.amount, 0);
      }, 0);

      out[s.id] = grossCash - cashRefunds;
    });
    return out;
  }, [openShifts, invoices]);

  // Today's collection totals by method (for KPI strip)
  const todayPaid = invoices.filter(
    (i) => (i.status === "paid" || i.status === "refunded" || i.status === "partial-refund") && i.date === TODAY_STR,
  );
  const totalByMethod = todayPaid.reduce(
    (acc, i) => {
      const t = computeTotals(i.items, i.discount).total;
      const invoiceRefundsToday = (i.refunds || [])
        .filter((r) => r.processedAt.startsWith(TODAY_STR))
        .reduce((sum, r) => sum + r.amount, 0);
      acc[i.method] = (acc[i.method] || 0) + (t - invoiceRefundsToday);
      return acc;
    },
    { cash: 0, card: 0, upi: 0, insurance: 0 },
  );
  const grossDesk = Object.values(totalByMethod).reduce((a, b) => a + b, 0);

  // Refunds column computation for shifts table
  const refundsByShift = useMemo(() => {
    const out = {};
    todayShifts.forEach((s) => {
      const cashRefunds = invoices.reduce((sum, i) => {
        const shiftRefunds = (i.refunds || []).filter(
          (r) =>
            r.method === "cash" &&
            r.processedAt >= s.openedAt &&
            (!s.closedAt || r.processedAt <= s.closedAt)
        );
        return sum + shiftRefunds.reduce((sSum, r) => sSum + r.amount, 0);
      }, 0);
      out[s.id] = cashRefunds;
    });
    return out;
  }, [todayShifts, invoices]);

  // Per-staff collected (across all closed + open shifts today)
  const perStaff = staff.map((st) => {
    const ss = todayShifts.filter((sh) => sh.staffId === st.id);
    const cash = ss.reduce(
      (sum, sh) =>
        sum + (sh.status === "closed" ? sh.cashCollected : cashByOpenShift[sh.id] || 0),
      0,
    );
    return { staff: st, cash, shifts: ss.length };
  });

  const KPI = ({ testId, label, value, sub }: { testId?: string; label: string; value: string; sub?: string }) => (
    <DeskKpi testId={testId} label={label} value={value} sub={sub} />
  );

  return (
    <div data-testid="cash-drawer-page" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI testId="kpi-cash" label="Cash today" value={fmt(totalByMethod.cash)} sub="all shifts" />
        <KPI testId="kpi-card" label="Card" value={fmt(totalByMethod.card)} />
        <KPI testId="kpi-upi" label="UPI" value={fmt(totalByMethod.upi)} />
        <KPI testId="kpi-gross" label="Desk gross" value={fmt(grossDesk)} sub="incl. insurance" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Open shift card */}
        <section className="col-span-12 lg:col-span-7 surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="dot-money animate-pulse-dot" />
              <h2 className="font-heading text-[15px] font-semibold text-ink-900">
                Live shift{openShifts.length > 1 ? "s" : ""}
              </h2>
              {openShifts.length > 0 && (
                <span className="chip-money">
                  <CircleDot className="h-3 w-3 animate-pulse-dot" />
                  {openShifts.length} active
                </span>
              )}
            </div>
            <button
              data-testid="open-shift-btn"
              onClick={() => setOpenDialog(true)}
              className="btn-money btn-sm"
            >
              <PlayCircle className="h-4 w-4" />
              Open new shift
            </button>
          </div>

          {openShifts.length === 0 && (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-bone text-ink-400">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="mt-3 text-[13px] font-medium text-ink-900">No active shift</p>
              <p className="mt-1 text-[12px] text-ink-400">
                Open a shift to start tracking the cash drawer.
              </p>
            </div>
          )}

          <div className="divide-y divide-ink-100">
            {openShifts.map((s) => {
              const st = staff.find((x) => x.id === s.staffId);
              const cash = cashByOpenShift[s.id] || 0;
              const expected = s.openingFloat + cash;
              return (
                <div key={s.id} data-testid={`open-shift-${s.id}`} className="overflow-hidden">
                  <div className="h-1 bg-mustard" />
                  <div className="p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-mustard-soft font-medium text-mustard">
                        {st?.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14.5px] font-medium text-ink-900">{st?.name}</span>
                          <span className="chip-mustard">
                            <CircleDot className="h-3 w-3 animate-pulse-dot" />
                            Open
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11.5px] text-ink-400">
                          {s.label} · opened {timeStr(s.openedAt)} · {s.id}
                        </div>
                      </div>
                      <button
                        data-testid={`close-shift-btn-${s.id}`}
                        onClick={() => setCloseDialog({ shift: s, expected })}
                        className="btn-mustard btn-sm"
                      >
                        <Lock className="h-4 w-4" />
                        Close shift
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-ink-200 bg-bone px-4 py-3">
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-400">
                          Opening float
                        </div>
                        <div className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-ink-900">
                          {fmt(s.openingFloat)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-mustard/30 bg-mustard-soft/50 px-4 py-3">
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-mustard">
                          Cash collected
                        </div>
                        <div className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-ink-900">
                          {fmt(cash)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-money/30 bg-money-soft/50 px-4 py-3">
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-money">
                          Expected drawer
                        </div>
                        <div className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-ink-900">
                          {fmt(expected)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Per-staff today */}
        <section className="col-span-12 lg:col-span-5 surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-2">
            <span className="dot-teal" />
            <h2 className="text-[15px] font-heading font-semibold text-ink-900">
              Collected per staff · today
            </h2>
          </div>
          <ul className="divide-y divide-ink-200">
            {perStaff.map(({ staff: st, cash, shifts: n }) => (
              <li
                key={st.id}
                data-testid={`staff-row-${st.id}`}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="w-9 h-9 rounded-full bg-sage-soft text-sage flex items-center justify-center text-[12px] font-medium">
                  {st.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink-900 truncate">
                    {st.name}
                  </div>
                  <div className="text-[11px] text-ink-400 font-mono">
                    {n} shift{n === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="font-mono text-[15px] font-semibold text-ink-900 tabular-nums">
                  {fmt(cash)}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Closed shifts log */}
        <section className="col-span-12 surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-2">
            <span className="dot-plum" />
            <h2 className="text-[15px] font-heading font-semibold text-ink-900">
              Today&apos;s closed shifts
            </h2>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-bone border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-400 font-mono">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Shift</th>
                <th className="text-left font-medium px-3 py-2.5">Staff</th>
                <th className="text-left font-medium px-3 py-2.5">Opened</th>
                <th className="text-left font-medium px-3 py-2.5">Closed</th>
                <th className="text-right font-medium px-3 py-2.5">Float</th>
                <th className="text-right font-medium px-3 py-2.5">Cash</th>
                <th className="text-right font-medium px-3 py-2.5">Refunds</th>
                <th className="text-right font-medium px-3 py-2.5">Variance</th>
                <th className="text-right font-medium px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {closedShifts.map((s) => {
                const st = staff.find((x) => x.id === s.staffId);
                return (
                  <tr key={s.id} data-testid={`closed-shift-${s.id}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink-900">{s.label}</div>
                      <div className="text-[11px] text-ink-400 font-mono">{s.id}</div>
                    </td>
                    <td className="px-3 py-3 text-ink-900">{st?.name}</td>
                    <td className="px-3 py-3 font-mono text-ink-600">
                      {timeStr(s.openedAt)}
                    </td>
                    <td className="px-3 py-3 font-mono text-ink-600">
                      {timeStr(s.closedAt)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {fmt(s.openingFloat)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ink-900">
                      {fmt(s.cashCollected)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-status-noshowText">
                      {fmt(refundsByShift[s.id] || 0)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-mono ${
                        s.variance === 0
                          ? "text-money"
                          : s.variance > 0
                            ? "text-mustard"
                            : "text-clay"
                      }`}
                    >
                      {s.variance > 0 ? "+" : ""}
                      {fmt(s.variance || 0)}
                    </td>
                    <td className="px-5 py-3 text-right flex justify-end gap-2.5 items-center">
                      <button
                        onClick={() => handleOpenReport(s)}
                        className="text-teal hover:text-teal-hover font-medium text-[12.5px] inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Report
                      </button>
                      {s.handover ? (
                        <button
                          onClick={() =>
                            toast(s.handover, { duration: 6000 })
                          }
                          className="text-sage hover:text-sage-hover font-medium text-[12.5px] inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Handover
                        </button>
                      ) : (
                        <span className="text-ink-400 text-[12.5px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {closedShifts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[13px] text-ink-400">
                    No closed shifts yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {openDialog && (
        <OpenShiftDialog
          staff={staff}
          onClose={() => setOpenDialog(false)}
          onConfirm={(d) => {
            openShift(d);
            const st = staff.find((s) => s.id === d.staffId);
            toast.success(`${d.label} shift opened`, {
              description: `${st?.name} · float ${fmt(d.openingFloat)}`,
              icon: <ArrowRightLeft className="w-4 h-4" />,
            });
            setOpenDialog(false);
          }}
        />
      )}
      {closeDialog && (
        <CloseShiftDialog
          shift={closeDialog.shift}
          expected={closeDialog.expected}
          onClose={() => setCloseDialog(null)}
          onConfirm={(patch) => {
            const closedShiftDetails = {
              ...closeDialog.shift,
              ...patch,
              status: "closed",
              closedAt: new Date().toISOString(),
              cashCollected: closeDialog.expected - closeDialog.shift.openingFloat,
            };
            closeShift(closeDialog.shift.id, {
              ...patch,
              cashCollected: closedShiftDetails.cashCollected,
            });
            toast.success(`Shift ${closeDialog.shift.label} closed`, {
              description: `Variance ${patch.variance >= 0 ? "+" : ""}${fmt(patch.variance)}`,
              icon: <CheckCircle2 className="w-4 h-4 text-money" />,
            });
            setCloseDialog(null);
            handleOpenReport(closedShiftDetails);
          }}
        />
      )}
      {reportShift && (
        <DayEndReportModal
          shift={reportShift}
          collections={reportShift.collections}
          refunds={reportShift.refunds}
          variance={reportShift.variance}
          topServices={reportShift.topServices}
          cancellations={reportShift.cancellations}
          onClose={() => setReportShift(null)}
          onPrint={() => {
            printDayReport({
              shift: reportShift,
              collections: reportShift.collections,
              refunds: reportShift.refunds,
              variance: reportShift.variance,
              topServices: reportShift.topServices,
              cancellations: reportShift.cancellations,
            });
          }}
        />
      )}
    </div>
  );
}
