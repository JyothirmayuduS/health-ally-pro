import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Timer,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useLabStore, formatRelative, getPatient, flagValue } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import ModuleLauncher from "@/components/lab-desk/ModuleLauncher";
import { KpiCard, SectionLabel, PriorityPill, StatusPill } from "@/components/lab-desk/Pills";

export default function SupervisorDashboard() {
  const { orders, patients, findCatalog, staff } = useLabStore();
  const { name } = useLabAuth();

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
    };
  }, [orders, findCatalog]);

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

  return (
    <div className="space-y-8" data-testid="supervisor-dashboard">
      <SectionLabel
        action={
          <Link to="/lab/validation" className="btn-primary !h-8 !px-3 !text-[12px]">
            <CheckCircle className="h-3.5 w-3.5" /> Validation queue
          </Link>
        }
      >
        Control desk — {name.split(" ")[0]}
      </SectionLabel>

      <div className="rounded-lg border border-sage/30 bg-sage-soft/50 px-4 py-3 text-[13px] text-ink-600">
        <strong className="text-sage">Supervisor workspace.</strong> Review and release results, monitor
        TAT and critical values, manage team and lab operations. Bench work is handled by technicians.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          testid="sup-kpi-validation"
          label="Validation backlog"
          value={stats.validationBacklog}
          hint="Needs your sign-off"
        />
        <KpiCard
          testid="sup-kpi-tat"
          label="TAT breaches"
          value={stats.tatBreaches}
          hint="Over target time"
        />
        <KpiCard
          testid="sup-kpi-critical"
          label="Critical values"
          value={stats.criticalPending}
          hint="Pending release"
        />
        <KpiCard
          testid="sup-kpi-released"
          label="Released today"
          value={stats.releasedToday}
          hint="Reports to clinicians"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface lg:col-span-2 p-5">
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
    </div>
  );
}
