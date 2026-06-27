import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Droplets, Cog, AlertTriangle, TestTube2, Send, Boxes, ClipboardCheck, Sparkles, AlertOctagon } from "lucide-react";
import { useLabStore, formatRelative, getPatient } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { useTechnicianOrders } from "@/lib/lab-desk/technician";
import { hasPhysicalSpecimen } from "@/lib/lab-desk/specimen";
import { KpiCard, SectionLabel, PriorityPill, StatusPill } from "@/components/lab-desk/Pills";
import ShiftReportModal from "@/components/lab-desk/ShiftReportModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { patients, criticalNotifications, qcLocks } = useLabStore();
  const { name } = useLabAuth();
  const myOrders = useTechnicianOrders();
  const firstName = name.split(" ")[0];

  const [shiftReportOpen, setShiftReportOpen] = useState(false);
  const [kpiModalType, setKpiModalType] = useState<"toCollect" | "specimens" | "atBench" | "criticalToday" | "awaitingSignOff" | "submittedToday" | null>(null);

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
      criticalToday: criticalNotifications.filter((n) => {
        const dateStr = new Date(n.notifiedAt).toDateString();
        return dateStr === today;
      }).length,
    };
  }, [myOrders, criticalNotifications]);

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
      <SectionLabel
        action={
          <Button
            className="btn-outline !h-8 !px-3 !text-[12px]"
            onClick={() => setShiftReportOpen(true)}
          >
            <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> End Shift
          </Button>
        }
      >
        Good shift, {firstName}
      </SectionLabel>

      {/* QC Status Indicator Banner */}
      {qcLocks.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-[13px] text-red-800 flex items-start gap-2.5">
          <AlertOctagon className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <strong>QC Lock Alert:</strong> Patient validation is locked for analytes:{" "}
            <span className="font-mono font-bold">{qcLocks.map((l) => l.toUpperCase()).join(", ")}</span> due to QC failure. Please notify supervisor.
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-green-200 bg-green-50/50 px-4 py-3 text-[13px] text-green-800 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
          <div>
            <strong>Quality Control Pass:</strong> All instruments calibrated and QC checks verified for today.
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiCard testid="tech-kpi-collect" label="Draw queue" value={stats.toCollect} hint="Collection" onClick={() => setKpiModalType("toCollect")} />
        <KpiCard testid="tech-kpi-specimens" label="My specimens" value={stats.specimens} hint="My samples" onClick={() => setKpiModalType("specimens")} />
        <KpiCard testid="tech-kpi-bench" label="At bench" value={stats.atBench} hint="Processing" onClick={() => setKpiModalType("atBench")} />
        <KpiCard testid="tech-kpi-critical" label="Critical alerts" value={stats.criticalToday} hint="Released today" accent="amber" onClick={() => setKpiModalType("criticalToday")} />
        <KpiCard testid="tech-kpi-signoff" label="Awaiting sign-off" value={stats.awaitingSignOff} hint="Submissions" onClick={() => setKpiModalType("awaitingSignOff")} />
        <KpiCard testid="tech-kpi-done" label="Submitted today" value={stats.submittedToday} hint="Results sent" onClick={() => setKpiModalType("submittedToday")} />
      </div>

      <ShiftReportModal open={shiftReportOpen} onOpenChange={setShiftReportOpen} />

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
      {/* KPI Details Dialog */}
      <Dialog open={kpiModalType !== null} onOpenChange={(open) => !open && setKpiModalType(null)}>
        <DialogContent className="max-w-xl bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize text-ink-900 font-heading">
              {kpiModalType === "toCollect" ? "Draw Queue" : kpiModalType === "atBench" ? "At Bench Processing" : kpiModalType === "criticalToday" ? "Critical Alerts" : kpiModalType?.replace(/([A-Z])/g, " $1")} Details
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of items in this category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-sm">
            {kpiModalType === "toCollect" && (
              <div className="space-y-2">
                {myOrders.filter((o) => o.status === "ordered").length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No backlog items awaiting sample collection.</p>
                ) : (
                  myOrders.filter((o) => o.status === "ordered").map((o) => {
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

            {kpiModalType === "specimens" && (
              <div className="space-y-2">
                {myOrders.filter(hasPhysicalSpecimen).length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No physical specimens currently logged in your batch.</p>
                ) : (
                  myOrders.filter(hasPhysicalSpecimen).map((o) => {
                    const p = getPatient(o, patients);
                    return (
                      <div key={o.id} className="p-3 bg-stone-50 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-ink-900">{o.test_name}</div>
                          <div className="text-xs text-ink-500">Accession: {o.accession} · Patient: {p?.name}</div>
                          <div className="text-[10px] text-ink-400 mt-0.5">Condition: {o.specimen?.condition || "Adequate"}</div>
                        </div>
                        <StatusPill status={o.status} />
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "atBench" && (
              <div className="space-y-2">
                {myOrders.filter((o) => o.status === "collected" || o.status === "processing").length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No specimens currently at processing bench.</p>
                ) : (
                  myOrders.filter((o) => o.status === "collected" || o.status === "processing").map((o) => {
                    const p = getPatient(o, patients);
                    return (
                      <div key={o.id} className="p-3 bg-stone-50 border rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-ink-900">{o.test_name}</div>
                          <div className="text-xs text-ink-500">Accession: {o.accession} · Patient: {p?.name}</div>
                        </div>
                        <span className="text-xs font-bold text-mustard bg-mustard-soft px-2 py-0.5 rounded uppercase">
                          {o.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "criticalToday" && (
              <div className="space-y-2">
                {criticalNotifications.length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No critical notifications logged today.</p>
                ) : (
                  criticalNotifications.map((n) => {
                    const p = getPatient({ patient_id: n.patientId } as any, patients);
                    return (
                      <div key={n.id} className="p-3 bg-stone-50 border rounded-lg text-ink-800">
                        <div className="font-semibold text-ink-900">{p?.name}</div>
                        <div className="text-xs text-ink-500">Notified at: {new Date(n.notifiedAt).toLocaleTimeString()}</div>
                        <div className="text-xs mt-1 font-mono text-clay">
                          {n.parameters.map((pr) => `${pr.parameterName}: ${pr.value} ${pr.unit}`).join(", ")}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "awaitingSignOff" && (
              <div className="space-y-2">
                {myOrders.filter((o) => o.status === "validation").length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No submissions awaiting supervisor sign-off.</p>
                ) : (
                  myOrders.filter((o) => o.status === "validation").map((o) => {
                    const p = getPatient(o, patients);
                    return (
                      <div key={o.id} className="p-3 bg-stone-50 border rounded-lg flex justify-between items-center text-ink-800">
                        <div>
                          <div className="font-semibold text-ink-900">{o.test_name}</div>
                          <div className="text-xs text-ink-500">Accession: {o.accession} · Patient: {p?.name}</div>
                        </div>
                        <StatusPill status={o.status} />
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {kpiModalType === "submittedToday" && (
              <div className="space-y-2">
                {myOrders.filter((o) => o.completed_at && new Date(o.completed_at).toDateString() === new Date().toDateString()).length === 0 ? (
                  <p className="text-ink-400 italic text-center py-4">No specimens submitted today yet.</p>
                ) : (
                  myOrders.filter((o) => o.completed_at && new Date(o.completed_at).toDateString() === new Date().toDateString()).map((o) => {
                    const p = getPatient(o, patients);
                    return (
                      <div key={o.id} className="p-3 bg-stone-50 border rounded-lg flex justify-between items-center text-ink-800">
                        <div>
                          <div className="font-semibold text-ink-950">{o.test_name}</div>
                          <div className="text-xs text-ink-500">Accession: {o.accession} · Patient: {p?.name}</div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="block font-semibold">Submitted</span>
                          <span className="text-[10px] text-ink-400">
                            {new Date(o.completed_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
    </div>
  );
}
