import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Timer,
  Users,
  BarChart3,
  ArrowRight,
  ClipboardCheck,
  CheckSquare,
  Printer,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useLabStore, formatRelative, getPatient, flagValue } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import ModuleLauncher from "@/components/lab-desk/ModuleLauncher";
import { KpiCard, SectionLabel, PriorityPill, StatusPill } from "@/components/lab-desk/Pills";
import ShiftReportModal from "@/components/lab-desk/ShiftReportModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SupervisorDashboard() {
  const {
    orders,
    patients,
    findCatalog,
    staff,
    criticalNotifications,
    labShiftReports,
    acknowledgeCriticalAlert,
  } = useLabStore();
  const { name } = useLabAuth();

  const [activeTab, setActiveTab] = useState<"validation" | "critical" | "shift">("validation");
  const [shiftReportOpen, setShiftReportOpen] = useState(false);

  // KPI modal state
  const [kpiModalType, setKpiModalType] = useState<"validation" | "tat" | "critical" | "critical_today" | "released" | null>(null);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      validationBacklog: orders.filter((o) => o.status === "validation").length,
      tatBreaches: orders.filter((o) => {
        const cat = findCatalog(o.test_code);
        if (!cat || ["validated", "cancelled"].includes(o.status)) return false;
        const elapsed = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
        return elapsed >= cat.tat_hours;
      }).length,
      releasedToday: orders.filter(
        (o) => o.released_at && new Date(o.released_at).toDateString() === today,
      ).length,
      criticalPending: orders.filter((o) => {
        if (o.status !== "validation") return false;
        const cat = findCatalog(o.test_code);
        return cat?.parameters.some(
          (p) => flagValue(p, o.results?.[p.key]).level === "critical",
        );
      }).length,
      criticalToday: criticalNotifications.filter((n) => {
        const dateStr = new Date(n.notifiedAt).toDateString();
        return dateStr === today;
      }).length,
    };
  }, [orders, findCatalog, criticalNotifications]);

  const validationQueue = orders.filter((o) => o.status === "validation").slice(0, 6);

  const tatBreaches = orders
    .map((o) => {
      const cat = findCatalog(o.test_code);
      if (!cat || ["validated", "cancelled"].includes(o.status)) return null;
      const elapsed = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
      if (elapsed < cat.tat_hours) return null;
      return { order: o, elapsed, target: cat.tat_hours };
    })
    .filter(Boolean)
    .slice(0, 5);

  const pendingCriticalNotifs = useMemo(() => {
    return criticalNotifications.filter((n) => n.status === "pending_ack");
  }, [criticalNotifications]);

  const recentShiftReports = useMemo(() => {
    return labShiftReports.slice(0, 7);
  }, [labShiftReports]);

  return (
    <div className="space-y-8" data-testid="supervisor-dashboard">
      <SectionLabel
        action={
          <div className="flex gap-2">
            <Button
              className="btn-outline !h-8 !px-3 !text-[12px]"
              onClick={() => setShiftReportOpen(true)}
            >
              <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> End Shift
            </Button>
            <Link to="/lab/validation" className="btn-primary !h-8 !px-3 !text-[12px] flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Validation queue
            </Link>
          </div>
        }
      >
        Control desk — {name.split(" ")[0]}
      </SectionLabel>

      <div className="rounded-lg border border-sage/30 bg-sage-soft/50 px-4 py-3 text-[13px] text-ink-600">
        <strong className="text-sage">Supervisor workspace.</strong> Review and release results, monitor
        TAT and critical values, manage team and lab operations. Bench work is handled by technicians.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          testid="sup-kpi-validation"
          label="Validation backlog"
          value={stats.validationBacklog}
          hint="Needs your sign-off"
          onClick={() => setKpiModalType("validation")}
        />
        <KpiCard
          testid="sup-kpi-tat"
          label="TAT breaches"
          value={stats.tatBreaches}
          hint="Over target time"
          onClick={() => setKpiModalType("tat")}
        />
        <KpiCard
          testid="sup-kpi-critical"
          label="Critical values"
          value={stats.criticalPending}
          hint="Pending release"
          onClick={() => setKpiModalType("critical")}
        />
        <KpiCard
          testid="sup-kpi-critical-today"
          label="Critical today"
          value={stats.criticalToday}
          hint="Total alerts logged"
          accent="amber"
          onClick={() => setKpiModalType("critical_today")}
        />
        <KpiCard
          testid="sup-kpi-released"
          label="Released today"
          value={stats.releasedToday}
          hint="Reports to clinicians"
          onClick={() => setKpiModalType("released")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface lg:col-span-2 p-5">
          {/* Tab Selector */}
          <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 mb-4 max-w-md">
            {[
              { value: "validation", label: "Awaiting Validation" },
              { value: "critical", label: `Critical Alerts (${pendingCriticalNotifs.length})` },
              { value: "shift", label: "Shift Reports" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveTab(t.value as any)}
                className={cn(
                  "flex-1 rounded py-1 px-2.5 text-[11px] font-medium transition text-center",
                  activeTab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "validation" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-money" />
                  <h3 className="font-heading font-semibold text-ink-900">Awaiting validation</h3>
                </div>
                <Link to="/lab/validation" className="text-[12px] font-medium text-sage hover:underline">
                  Review all →
                </Link>
              </div>
              {validationQueue.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-ink-400">Validation queue is clear.</p>
              ) : (
                <div className="divide-y divide-ink-200">
                  {validationQueue.map((o) => {
                    const p = getPatient(o, patients);
                    const cat = findCatalog(o.test_code);
                    const critical = cat?.parameters.some(
                      (pp) => flagValue(pp, o.results?.[pp.key]).level === "critical",
                    );
                    return (
                      <Link
                        key={o.id}
                        to="/lab/validation"
                        className="row-hover flex items-center gap-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p?.name}</span>
                            {critical && (
                              <span className="rounded-sm bg-clay-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-clay">
                                Critical
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink-400">
                            {o.test_code} · {o.assigned_to || "Bench"} · {formatRelative(o.completed_at)}
                          </div>
                        </div>
                        <PriorityPill priority={o.priority} />
                        <ArrowRight className="h-4 w-4 text-ink-400" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "critical" && (
            <div className="space-y-3">
              <div className="mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-clay" />
                <h3 className="font-heading font-semibold text-ink-900">Pending Critical Acknowledgements</h3>
              </div>
              {pendingCriticalNotifs.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-ink-400">No pending critical alerts.</p>
              ) : (
                <div className="space-y-2">
                  {pendingCriticalNotifs.map((n) => {
                    const p = patients.find((pat) => pat.id === n.patientId);
                    const elapsedMin = Math.round((Date.now() - new Date(n.notifiedAt).getTime()) / 60_000);
                    const isOverdue = elapsedMin > 30;

                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border text-sm transition",
                          isOverdue
                            ? "bg-red-50/70 border-red-200 animate-pulse-border text-red-900"
                            : "bg-stone-50 border-ink-200"
                        )}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            {p?.name}{" "}
                            {isOverdue && (
                              <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                                Overdue ack (&gt; 30m)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5">
                            Notified: {n.notifiedPerson} via {n.method} · {formatRelative(n.notifiedAt)}
                          </div>
                          <div className="text-xs text-ink-500 font-semibold">
                            Aging duration: <span className="font-mono text-clay">{elapsedMin} minutes</span>
                          </div>
                          <div className="text-xs font-semibold text-clay mt-1">
                            {n.parameters.map((pr) => `${pr.parameterName}: ${pr.value} ${pr.unit} (Crit ${pr.direction === "high" ? "High" : "Low"})`).join(", ")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="btn-primary !h-7 !px-2 text-[11px]"
                          onClick={() => acknowledgeCriticalAlert(n.id, name)}
                        >
                          Mark Acknowledged
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "shift" && (
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-ink-900">Recent Shift Reports</h3>
              {recentShiftReports.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-ink-400">No shift reports saved.</p>
              ) : (
                <div className="space-y-2">
                  {recentShiftReports.map((rep) => (
                    <div key={rep.id} className="flex items-center justify-between p-3 rounded bg-stone-50 border text-sm">
                      <div>
                        <div className="font-semibold capitalize">{rep.shift} Shift Handover</div>
                        <div className="text-xs text-ink-400 font-mono">Date: {rep.date} · Tech: {rep.technicianName}</div>
                        {rep.handoverNotes && <div className="text-xs text-ink-600 mt-1 italic">&quot;{rep.handoverNotes}&quot;</div>}
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", rep.status === "signed" ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700")}>
                        {rep.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-clay" />
              <h3 className="font-heading font-semibold text-ink-900">TAT breaches</h3>
            </div>
            {tatBreaches.length === 0 ? (
              <p className="text-[13px] text-ink-400">All orders within target.</p>
            ) : (
              <div className="space-y-3">
                {tatBreaches.map((item) => {
                  if (!item) return null;
                  const p = getPatient(item.order, patients);
                  return (
                    <div key={item.order.id} className="text-[13px]">
                      <div className="font-medium">{item.order.test_code} · {p?.name}</div>
                      <div className="font-mono text-[11px] text-clay">
                        {item.elapsed.toFixed(1)}h / {item.target}h target
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-sage" />
              <h3 className="font-heading font-semibold text-ink-900">Bench team</h3>
            </div>
            <div className="space-y-2">
              {staff
                .filter((s) => s.role !== "lab_supervisor")
                .slice(0, 4)
                .map((s) => (
                  <div key={s.id} className="flex justify-between text-[13px]">
                    <span>{s.name}</span>
                    <span className="font-mono text-[10px] uppercase text-ink-400">{s.section}</span>
                  </div>
                ))}
            </div>
            <Link to="/lab/team" className="mt-3 inline-block text-[12px] text-sage hover:underline">
              Manage team →
            </Link>
          </div>

          <Link to="/lab/reports" className="surface row-hover flex items-center gap-3 p-4">
            <BarChart3 className="h-5 w-5 text-sage" />
            <div className="flex-1 text-[13px] font-medium">Lab analytics & export</div>
            <ArrowRight className="h-4 w-4 text-ink-400" />
          </Link>
        </div>
      </div>

      {stats.criticalPending > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-status-noshowBorder bg-status-noshowBg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-status-noshowText" />
          <div className="flex-1 text-[13px] text-ink-600">
            <strong className="text-status-noshowText">{stats.criticalPending} critical result(s)</strong>{" "}
            awaiting supervisor sign-off. Confirm clinician notification before release.
          </div>
          <Link to="/lab/validation" className="btn-outline !h-8 shrink-0">
            Review
          </Link>
        </div>
      )}

      <ModuleLauncher />

      {/* KPI Details Dialog */}
      <Dialog open={kpiModalType !== null} onOpenChange={(open) => !open && setKpiModalType(null)}>
        <DialogContent className="max-w-xl bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize text-ink-900 font-heading">
              {kpiModalType?.replace("_", " ")} Details
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of items in this category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-sm">
            {kpiModalType === "validation" && (
              <div className="space-y-2">
                {orders.filter((o) => o.status === "validation").length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No backlog items awaiting validation.</p>
                ) : (
                  orders.filter((o) => o.status === "validation").map((o) => {
                    const p = getPatient(o, patients);
                    return (
                      <div key={o.id} className="p-3 bg-stone-50 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-ink-900">{o.test_name}</div>
                          <div className="text-xs text-ink-500">Accession: {o.accession} · Patient: {p?.name}</div>
                        </div>
                        <span className="text-xs font-bold text-clay bg-clay-soft px-2 py-0.5 rounded uppercase">
                          {o.priority}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "tat" && (
              <div className="space-y-2">
                {orders.filter((o) => {
                  const cat = findCatalog(o.test_code);
                  if (!cat || ["validated", "cancelled"].includes(o.status)) return false;
                  const elapsed = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
                  return elapsed >= cat.tat_hours;
                }).length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No active orders breaching target TAT.</p>
                ) : (
                  orders.filter((o) => {
                    const cat = findCatalog(o.test_code);
                    if (!cat || ["validated", "cancelled"].includes(o.status)) return false;
                    const elapsed = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
                    return elapsed >= cat.tat_hours;
                  }).map((o) => {
                    const p = getPatient(o, patients);
                    const cat = findCatalog(o.test_code);
                    const elapsed = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
                    return (
                      <div key={o.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center text-red-950">
                        <div>
                          <div className="font-semibold">{o.test_name}</div>
                          <div className="text-xs text-red-700">Accession: {o.accession} · Patient: {p?.name}</div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="block font-bold">Elapsed: {elapsed.toFixed(1)}h</span>
                          <span className="text-[10px] text-red-600">Target: {cat?.tat_hours}h</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "critical" && (
              <div className="space-y-2">
                {criticalNotifications.filter((n) => n.status === "pending_ack").length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No pending critical notifications.</p>
                ) : (
                  criticalNotifications.filter((n) => n.status === "pending_ack").map((n) => {
                    const p = getPatient({ patient_id: n.patientId } as any, patients);
                    const elapsedMin = Math.round((Date.now() - new Date(n.notifiedAt).getTime()) / 60_000);
                    const isOverdue = elapsedMin > 30;
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "p-3 rounded-lg border flex justify-between items-center transition",
                          isOverdue
                            ? "bg-red-50/70 border-red-200 animate-pulse-border text-red-950"
                            : "bg-red-50 border border-red-100 text-red-950"
                        )}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            {p?.name}
                            {isOverdue && (
                              <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded animate-pulse">
                                Overdue (&gt; 30m)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-red-700 mt-0.5">Notified: {n.notifiedPerson} via {n.method}</div>
                          <div className="text-xs text-red-600 font-semibold">
                            Aging: {elapsedMin} min
                          </div>
                          <div className="text-xs mt-1 font-mono font-bold text-clay">
                            {n.parameters.map((pr) => `${pr.parameterName}: ${pr.value} ${pr.unit}`).join(", ")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="btn-primary !h-7 !px-2 text-[11px] shrink-0"
                          onClick={() => {
                            acknowledgeCriticalAlert(n.id, name);
                          }}
                        >
                          Mark Acknowledged
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "critical_today" && (
              <div className="space-y-2">
                {criticalNotifications.length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No critical notifications logged today.</p>
                ) : (
                  criticalNotifications.map((n) => {
                    const p = getPatient({ patient_id: n.patientId } as any, patients);
                    return (
                      <div key={n.id} className="p-3 bg-stone-50 border rounded-lg text-ink-800">
                        <div className="font-semibold text-ink-900">{p?.name}</div>
                        <div className="text-xs text-ink-500">Notified at: {new Date(n.notifiedAt).toLocaleTimeString()} · Status: {n.status}</div>
                        <div className="text-xs mt-1 font-mono text-clay">
                          {n.parameters.map((pr) => `${pr.parameterName}: ${pr.value} ${pr.unit}`).join(", ")}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "released" && (
              <div className="space-y-2">
                {orders.filter((o) => o.released_at && new Date(o.released_at).toDateString() === new Date().toDateString()).length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No results released today yet.</p>
                ) : (
                  orders.filter((o) => o.released_at && new Date(o.released_at).toDateString() === new Date().toDateString()).map((o) => {
                    const p = getPatient(o, patients);
                    return (
                      <div key={o.id} className="p-3 bg-stone-50 border rounded-lg flex justify-between items-center text-ink-800">
                        <div>
                          <div className="font-semibold text-ink-900">{o.test_name}</div>
                          <div className="text-xs text-ink-500">Accession: {o.accession} · Patient: {p?.name}</div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="block font-semibold">Released At</span>
                          <span className="text-[10px] text-ink-400">
                            {new Date(o.released_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setKpiModalType(null)} className="btn-primary">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <ShiftReportModal open={shiftReportOpen} onOpenChange={setShiftReportOpen} />
    </div>
  );
}
