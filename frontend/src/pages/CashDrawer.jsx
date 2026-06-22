import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { TODAY_STR } from "@/lib/mockData";
import { computeTotals } from "@/lib/billingData";
import { DENOMS } from "@/lib/opsData";
import { toast } from "sonner";
import {
  Wallet,
  Banknote,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Lock,
  PlayCircle,
  Printer,
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

export default function CashDrawer() {
  const { shifts, staff, invoices, openShift, closeShift } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(null);

  const todayShifts = shifts.filter((s) => s.date === TODAY_STR);
  const openShifts = todayShifts.filter((s) => s.status === "open");
  const closedShifts = todayShifts.filter((s) => s.status === "closed");

  // Derive cash collected for open shifts from invoices paid since shift opened
  const cashByOpenShift = useMemo(() => {
    const out = {};
    openShifts.forEach((s) => {
      out[s.id] = invoices
        .filter(
          (i) =>
            i.status === "paid" &&
            i.method === "cash" &&
            i.paidAt &&
            i.paidAt >= s.openedAt,
        )
        .reduce((sum, i) => sum + computeTotals(i.items, i.discount).total, 0);
    });
    return out;
  }, [openShifts, invoices]);

  // Today's collection totals by method (for KPI strip)
  const todayPaid = invoices.filter(
    (i) => i.status === "paid" && i.date === TODAY_STR,
  );
  const totalByMethod = todayPaid.reduce(
    (acc, i) => {
      const t = computeTotals(i.items, i.discount).total;
      acc[i.method] = (acc[i.method] || 0) + t;
      return acc;
    },
    { cash: 0, card: 0, upi: 0, insurance: 0 },
  );
  const grossDesk = Object.values(totalByMethod).reduce((a, b) => a + b, 0);

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

  const KPI = ({ tint, icon: Icon, label, value, sub, testId }) => (
    <div
      data-testid={testId}
      className={`rounded-xl border p-4 ${tint.border} ${tint.bg}`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium ${tint.label}`}>
          {label}
        </div>
        <div className={`w-7 h-7 rounded-full grid place-items-center ${tint.iconBg} ${tint.iconText}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className={`text-[26px] font-heading font-semibold tabular-nums mt-2 ${tint.value}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-600 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div data-testid="cash-drawer-page" className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          testId="kpi-cash"
          tint={{
            border: "border-mustard/30",
            bg: "bg-mustard-soft/60",
            label: "text-mustard",
            value: "text-ink-900",
            iconBg: "bg-mustard text-white",
            iconText: "",
          }}
          icon={Banknote}
          label="Cash today"
          value={fmt(totalByMethod.cash)}
          sub="across all shifts"
        />
        <KPI
          testId="kpi-card"
          tint={{
            border: "border-teal/30",
            bg: "bg-teal-soft/60",
            label: "text-teal",
            value: "text-ink-900",
            iconBg: "bg-teal text-white",
            iconText: "",
          }}
          icon={CreditCard}
          label="Card"
          value={fmt(totalByMethod.card)}
        />
        <KPI
          testId="kpi-upi"
          tint={{
            border: "border-plum/30",
            bg: "bg-plum-soft/60",
            label: "text-plum",
            value: "text-ink-900",
            iconBg: "bg-plum text-white",
            iconText: "",
          }}
          icon={Smartphone}
          label="UPI"
          value={fmt(totalByMethod.upi)}
        />
        <KPI
          testId="kpi-gross"
          tint={{
            border: "border-money/30",
            bg: "bg-money-soft/60",
            label: "text-money",
            value: "text-ink-900",
            iconBg: "bg-money text-white",
            iconText: "",
          }}
          icon={Wallet}
          label="Desk gross"
          value={fmt(grossDesk)}
          sub="includes insurance"
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Open shift card */}
        <section className="col-span-12 lg:col-span-7 surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="dot-money animate-pulse-dot" />
              <h2 className="text-[15px] font-heading font-semibold text-ink-900">
                Live shift{openShifts.length > 1 ? "s" : ""}
              </h2>
            </div>
            <button
              data-testid="open-shift-btn"
              onClick={() => setOpenDialog(true)}
              className="btn-money btn-sm"
            >
              <PlayCircle className="w-4 h-4" />
              Open new shift
            </button>
          </div>

          {openShifts.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-ink-400">
              No active shift. Open one to start tracking the drawer.
            </div>
          )}

          <div className="divide-y divide-ink-200">
            {openShifts.map((s) => {
              const st = staff.find((x) => x.id === s.staffId);
              const cash = cashByOpenShift[s.id] || 0;
              const expected = s.openingFloat + cash;
              return (
                <div key={s.id} data-testid={`open-shift-${s.id}`} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-mustard-soft text-mustard grid place-items-center font-medium">
                      {st?.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14.5px] font-medium text-ink-900">
                          {st?.name}
                        </span>
                        <span className="chip-money">
                          <CircleDot className="w-3 h-3 animate-pulse-dot" />
                          Open
                        </span>
                      </div>
                      <div className="text-[11.5px] text-ink-400 font-mono mt-0.5">
                        {s.label} · opened {timeStr(s.openedAt)} · {s.id}
                      </div>
                    </div>
                    <button
                      data-testid={`close-shift-btn-${s.id}`}
                      onClick={() => setCloseDialog({ shift: s, expected })}
                      className="btn-mustard"
                    >
                      <Lock className="w-4 h-4" />
                      Close shift
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="rounded-lg border border-ink-200 bg-bone p-3">
                      <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                        Opening float
                      </div>
                      <div className="font-mono text-[17px] text-ink-900 mt-1">
                        {fmt(s.openingFloat)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-mustard/30 bg-mustard-soft p-3">
                      <div className="text-[10.5px] uppercase tracking-wider text-mustard font-mono">
                        Cash collected
                      </div>
                      <div className="font-mono text-[17px] text-ink-900 mt-1">
                        {fmt(cash)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-money/30 bg-money-soft p-3">
                      <div className="text-[10.5px] uppercase tracking-wider text-money font-mono">
                        Expected drawer
                      </div>
                      <div className="font-mono text-[17px] text-ink-900 mt-1">
                        {fmt(expected)}
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
                <th className="text-right font-medium px-3 py-2.5">Variance</th>
                <th className="text-right font-medium px-5 py-2.5">Handover</th>
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
                    <td className="px-5 py-3 text-right">
                      {s.handover ? (
                        <button
                          onClick={() =>
                            toast(s.handover, { duration: 6000 })
                          }
                          className="text-sage hover:text-sage-hover font-medium text-[12px] inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </button>
                      ) : (
                        <span className="text-ink-400 text-[12px]">—</span>
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
            closeShift(closeDialog.shift.id, {
              ...patch,
              cashCollected: closeDialog.expected - closeDialog.shift.openingFloat,
            });
            toast.success(`Shift ${closeDialog.shift.label} closed`, {
              description: `Variance ${patch.variance >= 0 ? "+" : ""}${fmt(patch.variance)}`,
              icon: <CheckCircle2 className="w-4 h-4 text-money" />,
            });
            setCloseDialog(null);
          }}
        />
      )}
    </div>
  );
}
