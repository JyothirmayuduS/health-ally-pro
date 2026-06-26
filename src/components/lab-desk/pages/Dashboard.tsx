import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, Beaker, ClipboardList, Microscope, Timer, ArrowRight,
} from "lucide-react";
import { useLabStore, formatRelative, getPatient } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { KpiCard, SectionLabel, PriorityPill, StatusPill } from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { id: "hematology", label: "Hematology" },
  { id: "biochemistry", label: "Biochemistry" },
  { id: "microbiology", label: "Microbiology" },
  { id: "serology", label: "Serology" },
  { id: "urinalysis", label: "Urinalysis" },
  { id: "endocrinology", label: "Endocrinology" },
];

export default function Dashboard() {
  const { orders, patients, findCatalog, staff } = useLabStore();
  const { name, isSupervisor } = useLabAuth();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      newOrders: orders.filter((o) => o.status === "ordered").length,
      awaitingCollection: orders.filter((o) => o.status === "ordered").length,
      inProcessing: orders.filter((o) => o.status === "processing").length,
      pendingValidation: orders.filter((o) => o.status === "validation").length,
      releasedToday: orders.filter((o) => o.released_at && new Date(o.released_at).toDateString() === today).length,
    };
  }, [orders]);

  const statOrders = orders.filter((o) => o.priority === "stat" && !["validated", "cancelled"].includes(o.status));

  const tatWatch = orders
    .map((o) => {
      const cat = findCatalog(o.test_code);
      if (!cat || ["validated", "cancelled"].includes(o.status)) return null;
      const elapsed = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
      const ratio = elapsed / cat.tat_hours;
      if (ratio < 0.7) return null;
      return { order: o, elapsed, target: cat.tat_hours, breached: ratio >= 1 };
    })
    .filter(Boolean)
    .slice(0, 5);

  const workloadBySection = SECTIONS.map((sec) => ({
    ...sec,
    count: orders.filter((o) => findCatalog(o.test_code)?.section === sec.id && !["validated", "cancelled"].includes(o.status)).length,
  })).filter((s) => s.count > 0);

  const recent = useMemo(() => {
    const items = [];
    orders.forEach((o) => (o.history || []).forEach((h) => items.push({ ...h, order: o })));
    return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  }, [orders]);

  const oldestPending = useMemo(() => {
    const pending = orders.filter((o) => !["validated", "cancelled"].includes(o.status))
      .sort((a, b) => new Date(a.ordered_at) - new Date(b.ordered_at));
    return pending[0];
  }, [orders]);

  return (
    <div className="space-y-8" data-testid="lab-dashboard">
      <SectionLabel
        action={
          <div className="flex gap-2">
            {oldestPending && (
              <Button asChild size="sm" variant="outline" className="border-ink-200" data-testid="oldest-pending-btn">
                <Link to="/lab/orders">
                  <Timer className="h-3.5 w-3.5 mr-1.5" /> Oldest pending: {oldestPending.id}
                </Link>
              </Button>
            )}
            <Button asChild size="sm" className="btn-primary" data-testid="open-collection-btn">
              <Link to="/lab/collection">Open collection <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
            </Button>
          </div>
        }
      >
        Welcome back, {name.split(" ")[0]}.
      </SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="New orders" value={stats.newOrders} hint="Awaiting first action" accent="sage" testid="kpi-new-orders" />
        <KpiCard label="To collect" value={stats.awaitingCollection} hint="Phleb queue" accent="sky" testid="kpi-awaiting" />
        <KpiCard label="In processing" value={stats.inProcessing} hint="At the bench" accent="indigo" testid="kpi-processing" />
        <KpiCard label="Pending validation" value={stats.pendingValidation} hint="Supervisor review" accent="amber" testid="kpi-pending" />
        <KpiCard label="Released today" value={stats.releasedToday} hint="Reports out" accent="emerald" testid="kpi-released" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface p-5" data-testid="stat-alerts">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="font-display font-semibold text-ink-900">Priority alerts</h3>
              <span className="text-xs font-mono text-ink-400">{statOrders.length} STAT</span>
            </div>
            <Link to="/lab/orders" className="text-xs font-mono uppercase tracking-wider text-[var(--sage-700)] hover:underline">See all →</Link>
          </div>
          {statOrders.length === 0 ? (
            <div className="text-sm text-ink-400 py-6 text-center">No STAT orders right now.</div>
          ) : (
            <div className="space-y-2">
              {statOrders.map((o) => {
                const p = getPatient(o, patients);
                return (
                  <Link to="/lab/orders" key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100 hover:bg-red-50 transition">
                    <PriorityPill priority="stat" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900">{p?.name} <span className="font-mono text-xs text-ink-400">· {p?.mrn}</span></div>
                      <div className="text-xs text-ink-600">{o.test_name} · ordered {formatRelative(o.ordered_at)}</div>
                    </div>
                    <StatusPill status={o.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface p-5" data-testid="tat-watch">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="h-4 w-4 text-amber-500" />
            <h3 className="font-display font-semibold text-ink-900">TAT watch</h3>
          </div>
          {tatWatch.length === 0 ? (
            <div className="text-sm text-ink-400 py-4">All orders within target.</div>
          ) : (
            <div className="space-y-3">
              {tatWatch.map(({ order, elapsed, target, breached }) => {
                const p = getPatient(order, patients);
                return (
                  <div key={order.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{order.test_code} · {p?.name}</span>
                      <span className={breached ? "text-xs font-mono text-red-700" : "text-xs font-mono text-amber-700"}>
                        {elapsed.toFixed(1)}h / {target}h
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-stone-100 rounded overflow-hidden">
                      <div className={breached ? "h-full bg-red-500" : "h-full bg-amber-500"} style={{ width: `${Math.min(100, (elapsed / target) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="surface p-5" data-testid="workload-section">
          <div className="flex items-center gap-2 mb-4">
            <Beaker className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold text-ink-900">Workload by section</h3>
          </div>
          {workloadBySection.length === 0 ? (
            <div className="text-sm text-ink-400 py-4">No active work.</div>
          ) : (
            <div className="space-y-3">
              {workloadBySection.map((s) => {
                const max = Math.max(...workloadBySection.map((x) => x.count));
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-stone-700">{s.label}</span>
                      <span className="font-mono text-ink-400">{s.count}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded overflow-hidden">
                      <div className="h-full bg-[var(--sage-500)]" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface p-5" data-testid="staff-on-duty">
          <div className="flex items-center gap-2 mb-4">
            <Microscope className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold text-ink-900">Team online</h3>
          </div>
          {staff.length === 0 ? (
            <div className="text-sm text-ink-400">No staff yet.</div>
          ) : (
            <div className="space-y-2">
              {staff.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-soft text-[11px] font-semibold text-sage">
                    {s.name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900">{s.name}</div>
                    <div className="text-[11px] font-mono uppercase tracking-wide text-ink-400">
                      {s.role?.replace("_", " ")}
                    </div>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-money" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface p-5" data-testid="recent-activity">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold text-ink-900">Recent activity</h3>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-ink-400">Activity will appear as orders move through the workflow.</div>
          ) : (
            <div className="space-y-3 text-sm">
              {recent.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--sage-500)] mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-900">
                      <span className="font-medium">{r.actor}</span>{" "}
                      <span className="text-ink-600">{r.action.toLowerCase()}</span>{" "}
                      <span className="font-mono text-ink-400">{r.order.id}</span>
                    </div>
                    <div className="text-xs text-ink-400">{formatRelative(r.at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
