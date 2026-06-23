import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePharmacy, STATUS_META } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import { StatusBadge, PriorityBadge } from "@/components/pharmacy-desk/StatusBadge";
import PrescriptionDrawer from "@/components/pharmacy-desk/PrescriptionDrawer";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import { Search, ShieldAlert } from "lucide-react";

const TABS = [
  { key: "all",               label: "All active" },
  { key: "new",               label: "New" },
  { key: "in_review",         label: "In review" },
  { key: "cleared",           label: "Cleared", statusKey: "ready_to_dispense" },
  { key: "on_hold",           label: "On hold" },
];

export default function Prescriptions() {
  const ph = usePharmacy();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [openRx, setOpenRx] = useState(null);

  const priorityFilter = params.get("priority"); // optional ?priority=urgent

  const list = useMemo(() => {
    const statusFilter = TABS.find((t) => t.key === tab)?.statusKey || tab;
    return ph.prescriptions
      .filter((r) => {
        // tab filter
        if (tab === "all" && ["collected", "cancelled", "dispensed", "dispensing"].includes(r.status)) return false;
        if (tab !== "all" && r.status !== statusFilter) return false;
        if (priorityFilter && r.priority !== priorityFilter) return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        const p = ph.getPatient(r.patientId);
        return (
          (p?.name || "").toLowerCase().includes(q) ||
          (p?.mrn || "").toLowerCase().includes(q) ||
          r.items.some((it) => it.medicationName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }, [ph, tab, query, priorityFilter]);

  const tabCount = (k) => {
    if (k === "all") {
      return ph.prescriptions.filter((r) => !["collected", "cancelled", "dispensed", "dispensing"].includes(r.status)).length;
    }
    const t = TABS.find((tt) => tt.key === k);
    const status = t?.statusKey || k;
    return ph.prescriptions.filter((r) => r.status === status).length;
  };

  return (
    <div data-testid="prescriptions-page">
      <PageHeader
        title="Prescriptions inbox"
        subtitle="Incoming Rx from doctors. Verify allergies, clear stock, send to dispense."
        actions={
          <div className="relative" data-testid="rx-search">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, MRN, drug…"
              data-testid="rx-search-input"
              className="pharm-input pl-9 w-[280px]"
            />
          </div>
        }
      >
        <div className="flex items-center gap-1" data-testid="rx-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              data-testid={`rx-tab-${t.key}`}
              onClick={() => { setTab(t.key); if (priorityFilter) setParams({}); }}
              className={classNames(
                "px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5",
                tab === t.key
                  ? "bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))]"
                  : "text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60",
              )}
            >
              {t.label}
              <span
                className={classNames(
                  "text-[10px] rounded px-1 py-px tabular-nums",
                  tab === t.key ? "bg-[hsl(var(--paper-50))]/20" : "bg-[hsl(var(--paper-200))]",
                )}
              >
                {tabCount(t.key)}
              </span>
            </button>
          ))}
          {priorityFilter && (
            <button
              onClick={() => setParams({})}
              className="ml-2 pharm-pill bg-rose-50 border-rose-200 text-rose-700"
              data-testid="clear-priority-filter"
            >
              Filter: {priorityFilter} ✕
            </button>
          )}
        </div>
      </PageHeader>

      <div className="max-w-[1400px] mx-auto px-8 py-7">
        <div className="pharm-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--paper-100))]/70 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Rx</th>
                <th className="text-left px-4 py-2.5 font-medium">Patient</th>
                <th className="text-left px-4 py-2.5 font-medium">Medication</th>
                <th className="text-left px-4 py-2.5 font-medium">Doctor</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No prescriptions match the current filters.
                  </td>
                </tr>
              )}
              {list.map((rx, idx) => {
                const patient = ph.getPatient(rx.patientId);
                const doctor = ph.getStaff(rx.prescribedByStaffId);
                const allergyMatch = rx.items.some((it) =>
                  (patient?.allergies || []).some((a) =>
                    it.medicationName.toLowerCase().includes(a.toLowerCase().split(" ")[0]),
                  ),
                );
                return (
                  <tr
                    key={rx.id}
                    onClick={() => setOpenRx(rx.id)}
                    data-testid={`rx-row-${idx}`}
                    className="border-t border-border/60 cursor-pointer hover:bg-[hsl(var(--paper-100))]/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{rx.id.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={rx.priority} />
                        <div>
                          <div className="font-medium text-[hsl(var(--ink))] flex items-center gap-1.5">
                            {patient?.name}
                            {allergyMatch && <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">{patient?.mrn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[hsl(var(--ink))]/90">
                        {rx.items[0].medicationName} <span className="text-muted-foreground">· {rx.items[0].dosage}</span>
                        {rx.items.length > 1 && (
                          <span className="ml-1 text-[11px] text-muted-foreground">+{rx.items.length - 1}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{rx.items[0].frequency} · {rx.items[0].duration}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{doctor?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={rx.status} /></td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-[12px]">{fmt.relative(rx.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground" data-testid="status-legend">
          <span>Workflow:</span>
          {["new", "in_review", "ready_to_dispense", "dispensing", "dispensed", "collected"].map((s, i, a) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span className="font-mono">{STATUS_META[s].label}</span>
              {i < a.length - 1 && <span>→</span>}
            </span>
          ))}
        </div>
      </div>

      {openRx && <PrescriptionDrawer rxId={openRx} onClose={() => setOpenRx(null)} />}
    </div>
  );
}
