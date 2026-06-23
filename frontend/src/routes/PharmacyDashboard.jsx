import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import KpiCard from "@/components/pharmacy-desk/KpiCard";
import { StatusBadge, PriorityBadge } from "@/components/pharmacy-desk/StatusBadge";
import PrescriptionDrawer from "@/components/pharmacy-desk/PrescriptionDrawer";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import {
  Inbox,
  ClipboardList,
  PackageCheck,
  RefreshCcw,
  AlertTriangle,
  Search,
  Clock3,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const ph = usePharmacy();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openRx, setOpenRx] = useState(null);

  const worklist = useMemo(() => {
    const active = ph.prescriptions
      .filter((r) => !["collected", "cancelled"].includes(r.status))
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    if (!query.trim()) return active.slice(0, 8);
    const q = query.trim().toLowerCase();
    return active.filter((r) => {
      const p = ph.getPatient(r.patientId);
      return (
        (p?.name || "").toLowerCase().includes(q) ||
        (p?.mrn || "").toLowerCase().includes(q) ||
        r.items.some((it) => it.medicationName.toLowerCase().includes(q))
      );
    });
  }, [ph, query]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div data-testid="dashboard-page">
      <PageHeader
        title="Today at the counter"
        subtitle={`${today} · Live queue across all stages — keep STAT scripts moving.`}
        actions={
          <div className="relative" data-testid="dashboard-search">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, MRN, drug…"
              data-testid="dashboard-search-input"
              className="pharm-input pl-9 w-[280px]"
            />
          </div>
        }
      />

      <div className="max-w-[1400px] mx-auto px-8 py-7 space-y-7">
        {/* KPI Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="kpi-grid">
          <KpiCard
            label="New prescriptions"
            value={ph.counts.new + ph.counts.in_review}
            hint={`${ph.counts.new} new · ${ph.counts.in_review} in review`}
            icon={Inbox}
            onClick={() => navigate("/pharmacy/prescriptions")}
            dataTestId="kpi-new-prescriptions"
            tone="sage"
          />
          <KpiCard
            label="In progress"
            value={ph.counts.dispensing}
            hint="Being dispensed now"
            icon={ClipboardList}
            onClick={() => navigate("/pharmacy/dispense")}
            dataTestId="kpi-in-progress"
          />
          <KpiCard
            label="Ready for pickup"
            value={ph.counts.dispensed}
            hint="Awaiting patient"
            icon={PackageCheck}
            onClick={() => navigate("/pharmacy/dispense")}
            dataTestId="kpi-ready-pickup"
            tone="warm"
          />
          <KpiCard
            label="Refills pending"
            value={ph.counts.refillsPending}
            hint="Approve or deny"
            icon={RefreshCcw}
            onClick={() => navigate("/pharmacy/refills")}
            dataTestId="kpi-refills"
          />
          <KpiCard
            label="Stock alerts"
            value={ph.counts.lowStock}
            hint={`${ph.counts.expiringSoon} expiring < 90d`}
            icon={AlertTriangle}
            onClick={() => navigate("/pharmacy/inventory")}
            dataTestId="kpi-stock-alerts"
            tone={ph.counts.lowStock > 0 ? "alert" : "default"}
          />
        </section>

        {/* Urgent strip */}
        {ph.counts.urgent > 0 && (
          <section
            data-testid="urgent-strip"
            className="pharm-card p-4 bg-rose-50/60 border-rose-200 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-rose-700" />
            </div>
            <div className="flex-1">
              <div className="font-display text-[16px] text-rose-900">
                {ph.counts.urgent} STAT prescription{ph.counts.urgent > 1 ? "s" : ""} active
              </div>
              <div className="text-[12px] text-rose-800/80">Move these through review and dispense first.</div>
            </div>
            <button
              data-testid="jump-to-urgent"
              onClick={() => navigate("/pharmacy/prescriptions?priority=urgent")}
              className="rounded-md bg-rose-700 text-white px-3 py-1.5 text-sm hover:bg-rose-800 transition-colors"
            >
              Open queue
            </button>
          </section>
        )}

        {/* Worklist */}
        <section data-testid="worklist">
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-display text-[22px] text-[hsl(var(--ink))]">Today&apos;s worklist</h2>
            <span className="text-[12px] text-muted-foreground">
              <Clock3 className="h-3 w-3 inline -mt-0.5" /> auto-updates
            </span>
          </div>
          <div className="pharm-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--paper-100))]/70 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Patient</th>
                  <th className="text-left px-4 py-2.5 font-medium">Medication</th>
                  <th className="text-left px-4 py-2.5 font-medium">Doctor</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {worklist.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      Nothing in the queue. Enjoy the calm.
                    </td>
                  </tr>
                )}
                {worklist.map((rx, idx) => {
                  const patient = ph.getPatient(rx.patientId);
                  const doctor = ph.getStaff(rx.prescribedByStaffId);
                  return (
                    <tr
                      key={rx.id}
                      onClick={() => setOpenRx(rx.id)}
                      data-testid={`worklist-row-${idx}`}
                      className={classNames(
                        "border-t border-border/60 cursor-pointer transition-colors",
                        "hover:bg-[hsl(var(--paper-100))]/60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={rx.priority} />
                          <div>
                            <div className="font-medium text-[hsl(var(--ink))]">{patient?.name}</div>
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
        </section>
      </div>

      {openRx && <PrescriptionDrawer rxId={openRx} onClose={() => setOpenRx(null)} />}
    </div>
  );
}
