import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import PageHeader from "@/components/pharmacy-desk/PageHeader";
import KpiCard from "@/components/pharmacy-desk/KpiCard";
import { StatusBadge, PriorityBadge } from "@/components/pharmacy-desk/StatusBadge";
import LocationChip from "@/components/pharmacy-desk/LocationChip";
import PrescriptionDrawer from "@/components/pharmacy-desk/PrescriptionDrawer";
import WalkInDialog from "@/components/pharmacy-desk/WalkInDialog";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";
import {
  Inbox,
  ClipboardList,
  PackageCheck,
  RefreshCcw,
  AlertTriangle,
  Snowflake,
  Lock,
  TrendingUp,
  Clock3,
  UserPlus,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const ph = usePharmacy();
  const navigate = useNavigate();
  const [openRx, setOpenRx] = useState(null);
  const [walkInOpen, setWalkInOpen] = useState(false);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  // Worklist: all active Rx
  const worklist = useMemo(() => {
    return ph.prescriptions
      .filter((r) => !["collected", "cancelled"].includes(r.status))
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [ph.prescriptions]);

  // Activity feed: last 12 events across all Rx
  const activity = useMemo(() => {
    const events = [];
    ph.prescriptions.forEach((rx) => {
      (rx.history || []).forEach((h) => events.push({ rxId: rx.id, rxNumber: rx.rxNumber || rx.id, ...h }));
    });
    return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 12);
  }, [ph.prescriptions]);

  // Stock alerts list
  const stockAlerts = useMemo(() => {
    return ph.inventory
      .map((d) => {
        const onHand = d.batches.reduce((a, b) => a + b.qty, 0);
        const nearest = [...d.batches].filter((b) => b.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0];
        const days = nearest ? fmt.daysUntil(nearest.expiry) : null;
        return { drug: d, onHand, days, status: onHand === 0 ? "out" : onHand <= d.reorderLevel ? "low" : (days !== null && days < 90 ? "expiring" : null) };
      })
      .filter((x) => x.status)
      .slice(0, 6);
  }, [ph.inventory]);

  const oldestWait = useMemo(() => {
    const oldest = ph.prescriptions
      .filter((r) => ["new", "in_review"].includes(r.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    return oldest ? fmt.relative(oldest.createdAt) : "—";
  }, [ph.prescriptions]);

  return (
    <div data-testid="dashboard-page">
      <PageHeader
        title="Today at the counter"
        subtitle={`${today} · Live queue across all stages — keep STAT scripts moving.`}
        actions={
          <button
            data-testid="open-walkin-btn"
            onClick={() => setWalkInOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] px-3 py-2 text-sm hover:bg-[hsl(var(--sage-700))]"
          >
            <UserPlus className="h-4 w-4" /> Walk-in Rx
          </button>
        }
      />

      <div className="max-w-[1500px] mx-auto px-8 py-7 space-y-7">
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="kpi-grid">
          <KpiCard
            label="New / in review"
            value={ph.counts.new + ph.counts.in_review}
            hint={`oldest ${oldestWait}`}
            icon={Inbox}
            onClick={() => navigate("/pharmacy/prescriptions")}
            dataTestId="kpi-new-prescriptions"
            tone="sage"
          />
          <KpiCard label="Picking" value={ph.counts.dispensing} hint="being dispensed" icon={ClipboardList}
            onClick={() => navigate("/pharmacy/dispense")} dataTestId="kpi-in-progress" />
          <KpiCard label="Ready for pickup" value={ph.counts.dispensed} hint="awaiting patient" icon={PackageCheck}
            onClick={() => navigate("/pharmacy/dispense")} dataTestId="kpi-ready-pickup" tone="warm" />
          <KpiCard label="Refills pending" value={ph.counts.refillsPending} hint="approve or deny" icon={RefreshCcw}
            onClick={() => navigate("/pharmacy/refills")} dataTestId="kpi-refills" />
          <KpiCard label="Stock alerts" value={ph.counts.lowStock + ph.counts.outOfStock}
            hint={`${ph.counts.outOfStock} out · ${ph.counts.expiringSoon} expiring`} icon={AlertTriangle}
            onClick={() => navigate("/pharmacy/inventory?focus=")}
            dataTestId="kpi-stock-alerts" tone={ph.counts.outOfStock > 0 ? "alert" : "default"} />
          <KpiCard label="Controlled" value={ph.counts.controlledDrugs} hint="schedule logged" icon={Lock}
            onClick={() => navigate("/pharmacy/inventory")} dataTestId="kpi-controlled" />
        </section>

        {ph.counts.urgent > 0 && (
          <section data-testid="urgent-strip" className="pharm-card p-4 bg-rose-50/60 border-rose-200 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-rose-700" />
            </div>
            <div className="flex-1">
              <div className="font-display text-[16px] text-rose-900">
                {ph.counts.urgent} STAT prescription{ph.counts.urgent > 1 ? "s" : ""} active
              </div>
              <div className="text-[12px] text-rose-800/80">Move these through review and dispense first.</div>
            </div>
            <button data-testid="jump-to-urgent" onClick={() => navigate("/pharmacy/prescriptions?priority=urgent")}
              className="rounded-md bg-rose-700 text-white px-3 py-1.5 text-sm hover:bg-rose-800 transition-colors">Open queue</button>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
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
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {worklist.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nothing in the queue. Enjoy the calm.</td></tr>
                  )}
                  {worklist.slice(0, 8).map((rx, idx) => {
                    const patient = ph.getPatient(rx.patientId);
                    const drug = ph.getDrug(rx.items[0].drugId);
                    return (
                      <tr key={rx.id} onClick={() => setOpenRx(rx.id)} data-testid={`worklist-row-${idx}`}
                          className="border-t border-border/60 cursor-pointer transition-colors hover:bg-[hsl(var(--paper-100))]/60">
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[hsl(var(--ink))]/90 text-[13px]">
                              {rx.items[0].medicationName} <span className="text-muted-foreground">· {rx.items[0].dosage}</span>
                              {rx.items.length > 1 && <span className="ml-1 text-[11px] text-muted-foreground">+{rx.items.length - 1}</span>}
                            </span>
                            {drug && <LocationChip location={drug.location} compact />}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={rx.status} /></td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-[12px]">{fmt.relative(rx.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Side column: stock alerts + activity */}
          <aside className="space-y-5">
            <section data-testid="stock-alerts">
              <div className="flex items-end justify-between mb-3">
                <h2 className="font-display text-[18px] text-[hsl(var(--ink))]">Stock alerts</h2>
                <button onClick={() => navigate("/pharmacy/inventory")} className="text-[11px] text-muted-foreground hover:text-foreground underline">View all</button>
              </div>
              <ul className="space-y-2">
                {stockAlerts.length === 0 && <li className="text-[12px] text-muted-foreground text-center py-6 pharm-card">All stock looks healthy.</li>}
                {stockAlerts.map((a, idx) => (
                  <li key={a.drug.id} data-testid={`stock-alert-${idx}`} onClick={() => navigate(`/pharmacy/inventory?focus=${a.drug.id}`)}
                      className="pharm-card p-3 cursor-pointer hover:bg-[hsl(var(--paper-100))]/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{a.drug.name} · {a.drug.strength}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <LocationChip location={a.drug.location} compact />
                          {a.drug.flags?.includes("fridge") && <Snowflake className="h-3 w-3 text-sky-600" />}
                        </div>
                      </div>
                      <span className={classNames(
                        "pharm-pill",
                        a.status === "out"      ? "bg-rose-50 border-rose-200 text-rose-800" :
                        a.status === "low"      ? "bg-amber-50 border-amber-200 text-amber-800" :
                                                 "bg-amber-50 border-amber-200 text-amber-800",
                      )}>
                        {a.status === "out" ? "Out" : a.status === "low" ? `${a.onHand} left` : `Exp ${a.days}d`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section data-testid="activity-feed">
              <h2 className="font-display text-[18px] text-[hsl(var(--ink))] mb-3 inline-flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-muted-foreground" /> Recent activity
              </h2>
              <ul className="pharm-card divide-y divide-border/60">
                {activity.length === 0 && <li className="text-[12px] text-muted-foreground text-center py-6">No activity yet.</li>}
                {activity.map((ev, idx) => (
                  <li key={idx} className="px-3 py-2 text-[12px] flex items-start gap-2" data-testid={`activity-${idx}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sage-500))] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[hsl(var(--ink))]/90 truncate">{ev.action}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {ev.rxNumber.toUpperCase()} · {ev.by} · {fmt.relative(ev.at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>

      {openRx && <PrescriptionDrawer rxId={openRx} onClose={() => setOpenRx(null)} />}
      <WalkInDialog open={walkInOpen} onClose={() => setWalkInOpen(false)} />
    </div>
  );
}
