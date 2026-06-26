import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, Droplets, Cog, AlertTriangle, TestTube2, Send, Boxes } from "lucide-react";
import { useLabStore, formatRelative, getPatient } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { useTechnicianOrders } from "@/lib/lab-desk/technician";
import { hasPhysicalSpecimen } from "@/lib/lab-desk/specimen";
import { KpiCard, SectionLabel, PriorityPill, StatusPill } from "@/components/lab-desk/Pills";

const STEP_STYLES: Record<string, string> = {
  plum: "bg-plum-soft text-plum",
  teal: "bg-teal-soft text-teal",
  mustard: "bg-mustard-soft text-mustard",
  sage: "bg-sage-soft text-sage",
};

const STEPS = [
  { to: "/lab/collection", label: "Collection", sub: "Draw patients", icon: Droplets, color: "plum" },
  { to: "/lab/samples", label: "My samples", sub: "Track tubes", icon: Boxes, color: "teal" },
  { to: "/lab/processing", label: "Processing", sub: "Enter results", icon: Cog, color: "mustard" },
  { to: "/lab/my-submissions", label: "Submissions", sub: "Supervisor sign-off", icon: Send, color: "sage" },
] as const;

export default function TechnicianDashboard() {
  const { patients } = useLabStore();
  const { name } = useLabAuth();
  const myOrders = useTechnicianOrders();
  const firstName = name.split(" ")[0];

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      toCollect: myOrders.filter((o) => o.status === "ordered").length,
      specimens: myOrders.filter(hasPhysicalSpecimen).length,
      atBench: myOrders.filter((o) => o.status === "collected" || o.status === "processing").length,
      awaitingSignOff: myOrders.filter((o) => o.status === "validation").length,
      submittedToday: myOrders.filter(
        (o) => o.completed_at && new Date(o.completed_at).toDateString() === today,
      ).length,
    };
  }, [myOrders]);

  const collectQueue = myOrders
    .filter((o) => o.status === "ordered")
    .sort((a, b) => {
      const pri = { stat: 0, urgent: 1, routine: 2 };
      return pri[a.priority] - pri[b.priority] || a.ordered_at.localeCompare(b.ordered_at);
    })
    .slice(0, 4);

  const benchQueue = myOrders
    .filter((o) => o.status === "collected" || o.status === "processing")
    .slice(0, 4);

  const statAlerts = myOrders.filter(
    (o) => o.priority === "stat" && ["ordered", "collected", "processing"].includes(o.status),
  );

  return (
    <div className="space-y-8" data-testid="technician-dashboard">
      <SectionLabel>Good shift, {firstName}</SectionLabel>

      <div className="grid gap-2 sm:grid-cols-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.to}
              to={step.to}
              className="surface row-hover flex items-center gap-3 p-3"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${STEP_STYLES[step.color]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-ink-400">Step {i + 1}</div>
                <div className="font-medium text-ink-900">{step.label}</div>
                <div className="text-[11px] text-ink-500">{step.sub}</div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-300" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard testid="tech-kpi-collect" label="Draw queue" value={stats.toCollect} hint="Collection" />
        <KpiCard testid="tech-kpi-specimens" label="My specimens" value={stats.specimens} hint="My samples" />
        <KpiCard testid="tech-kpi-bench" label="At bench" value={stats.atBench} hint="Processing" />
        <KpiCard testid="tech-kpi-signoff" label="Awaiting sign-off" value={stats.awaitingSignOff} hint="Submissions" />
        <KpiCard testid="tech-kpi-done" label="Submitted today" value={stats.submittedToday} hint="Results sent" />
      </div>

      {statAlerts.length > 0 && (
        <div className="surface border-l-4 border-l-clay p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-clay" />
            <h3 className="font-heading font-semibold text-ink-900">STAT — act now</h3>
          </div>
          <div className="space-y-2">
            {statAlerts.map((o) => {
              const p = getPatient(o, patients);
              return (
                <div key={o.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                  <PriorityPill priority="stat" />
                  <span className="font-medium">{p?.name}</span>
                  <span className="text-ink-400">· {o.test_code}</span>
                  <StatusPill status={o.status} />
                  <Link
                    to={o.status === "ordered" ? "/lab/collection" : "/lab/processing"}
                    className="ml-auto text-plum hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface border-l-4 border-plum p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-plum" />
              <h3 className="font-heading font-semibold text-ink-900">Collection queue</h3>
            </div>
            <Link to="/lab/collection" className="text-[12px] font-medium text-plum hover:underline">
              Draw queue →
            </Link>
          </div>
          {collectQueue.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-ink-400">No draws waiting.</p>
          ) : (
            <div className="divide-y divide-ink-200">
              {collectQueue.map((o) => {
                const p = getPatient(o, patients);
                return (
                  <div key={o.id} className="row-hover flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{p?.name}</div>
                      <div className="text-[11px] text-ink-400">
                        {o.test_code} · {formatRelative(o.ordered_at)}
                      </div>
                    </div>
                    <PriorityPill priority={o.priority} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface border-l-4 border-mustard p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-mustard" />
              <h3 className="font-heading font-semibold text-ink-900">Processing bench</h3>
            </div>
            <Link to="/lab/processing" className="text-[12px] font-medium text-sage hover:underline">
              Enter results →
            </Link>
          </div>
          {benchQueue.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-ink-400">Bench is clear.</p>
          ) : (
            <div className="divide-y divide-ink-200">
              {benchQueue.map((o) => {
                const p = getPatient(o, patients);
                return (
                  <div key={o.id} className="row-hover flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{p?.name}</div>
                      <div className="text-[11px] text-ink-400">{o.accession} · {o.test_code}</div>
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
