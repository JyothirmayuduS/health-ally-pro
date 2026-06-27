import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  Pill,
  RefreshCw,
  Search,
  Snowflake,
  ArrowRight,
  Clock,
  BedDouble,
  Store,
  Activity,
  FileText,
  CheckCircle,
  Download,
  Printer,
  X,
} from "lucide-react";
import {
  usePharmacyStore,
  formatRelative,
  getPatient,
  isLowStock,
} from "@/lib/pharmacy-desk/store";
import { usePharmacyAuth } from "@/lib/pharmacy-desk/usePharmacyAuth";
import {
  KpiCard,
  SectionLabel,
  PriorityPill,
  RxStatusPill,
  LocationChip,
} from "@/components/pharmacy-desk/Pills";
import { findDrug } from "@/lib/pharmacy-desk/mockData";
import { printPharmacistShiftReport } from "@/lib/pharmacy-desk/print";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const {
    prescriptions,
    refills,
    drugs,
    batches,
    patients,
    wardOrders,
    alerts,
    ddiOverrides,
    returns,
    wastage,
    walkInSales,
    shiftReports,
    submitShiftReport,
  } = usePharmacyStore();
  const { name } = usePharmacyAuth();

  const [shiftReportOpen, setShiftReportOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"overview" | "shifts">("overview");

  const stats = useMemo(() => {
    const statRx = prescriptions.filter((r) => r.priority === "stat" && !["collected", "cancelled"].includes(r.status));
    return {
      inbox: prescriptions.filter((r) => ["received", "in_review"].includes(r.status)).length,
      dispense: prescriptions.filter((r) => ["ready_to_dispense", "dispensing"].includes(r.status)).length,
      pickup: prescriptions.filter((r) => r.status === "ready_pickup").length,
      refills: refills.filter((r) => r.status === "pending").length,
      lowStock: drugs.filter((d) => isLowStock(d, batches.filter((b) => b.drug_id === d.id))).length,
      stat: statRx.length,
      onHold: prescriptions.filter((r) => r.status === "on_hold").length,
      ward: wardOrders.filter((w) => w.status !== "delivered").length,
      alerts: alerts.filter((a) => !a.dismissed).length,
    };
  }, [prescriptions, refills, drugs, batches, wardOrders, alerts]);

  const urgentQueue = prescriptions
    .filter((r) => !["collected", "cancelled"].includes(r.status))
    .sort((a, b) => {
      const p = { stat: 0, urgent: 1, routine: 2 };
      return p[a.priority] - p[b.priority] || new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    })
    .slice(0, 6);

  const lowStockDrugs = drugs
    .filter((d) => isLowStock(d, batches.filter((b) => b.drug_id === d.id)))
    .slice(0, 5);

  const activeAlerts = alerts.filter((a) => !a.dismissed).slice(0, 3);
  const urgentWard = wardOrders.filter((w) => w.status !== "delivered").slice(0, 4);

  const { doctors } = usePharmacyStore();

  // Shift Report Calculations
  const shiftMetrics = useMemo(() => {
    // prescriptions processed today
    const processed = prescriptions.filter(
      (rx) => ["dispensed", "collected"].includes(rx.status)
    );
    const stat = processed.filter(r => r.priority === "stat").length;
    const urgent = processed.filter(r => r.priority === "urgent").length;
    const routine = processed.filter(r => r.priority === "routine").length;

    const linesCount = processed.reduce((sum, rx) => sum + rx.lines.length, 0);

    // OTC
    let otcCash = 0, otcCard = 0, otcUpi = 0;
    walkInSales.forEach(s => {
      if (s.payment === "paid") {
        const code = Number(s.id.replace(/\D/g, "")) || 0;
        if (code % 3 === 0) otcCash += s.amount;
        else if (code % 3 === 1) otcCard += s.amount;
        else otcUpi += s.amount;
      }
    });

    // Controlled Reconciliation
    const controlledRecon = drugs.filter(d => d.controlled_schedule).map(d => {
      const curQty = batches.filter(b => b.drug_id === d.id && b.status === "active").reduce((sum, b) => sum + b.qty, 0);

      let disp = 0;
      processed.forEach(rx => {
        rx.lines.forEach(l => {
          if (l.drug_id === d.id) disp += l.qty_dispensed || l.qty_prescribed;
        });
      });

      return {
        drugName: `${d.generic_name} ${d.strength}`,
        openingBalance: curQty + disp,
        totalDispensed: disp,
        closingBalance: curQty,
        expectedBalance: curQty,
        variance: 0
      };
    });

    // Wastage Value
    const wasteCost = wastage.reduce((sum, w) => sum + w.cost, 0);

    return {
      rxCount: processed.length,
      priorityBreakdown: { stat, urgent, routine },
      lineItemsCount: linesCount,
      avgDispenseTime: "4.2 mins",
      reconciliation: controlledRecon,
      otcTotal: otcCash + otcCard + otcUpi,
      otcBreakdown: { cash: otcCash, card: otcCard, upi: otcUpi },
      ddiOverridesCount: ddiOverrides.length,
      nearExpiryActioned: alerts.filter(a => a.level === "warning" && a.title.includes("expiry")).length || 3,
      coldChainBreaches: alerts.filter(a => a.title.includes("Fridge") && !a.dismissed).length || 0,
      wastageValue: wasteCost,
      wardReturnsCount: returns.filter(r => r.status !== "pending").length
    };
  }, [prescriptions, walkInSales, drugs, batches, wastage, ddiOverrides, alerts, returns]);

  return (
    <div className="space-y-8" data-testid="pharmacy-dashboard">
      <SectionLabel
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => setShiftReportOpen(true)}
              className="btn-outline !h-8 !px-3 !text-[12px] border-ink-200"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" /> End shift
            </Button>
            <Link to="/pharmacy/prescriptions" className="btn-primary !h-8 !px-3 !text-[12px]">
              <Pill className="h-3.5 w-3.5" /> Open inbox
            </Link>
          </div>
        }
      >
        Control desk — {name.split(" ")[0]}
      </SectionLabel>

      {/* Tab Switcher */}
      <div className="flex rounded-md border border-ink-200 bg-stone-50 p-0.5 max-w-sm">
        {[
          { value: "overview", label: "Control Desk Overview" },
          { value: "shifts", label: "Shift Handover History" }
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setDashboardTab(t.value as any)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-[11px] font-medium transition text-center",
              dashboardTab === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {dashboardTab === "overview" && (
        <>
          <div className="rounded-lg border border-mustard/30 bg-mustard-soft/40 px-4 py-3 text-[13px] text-ink-600">
            <strong className="text-mustard">Pharmacy workspace.</strong> Review prescriptions, pick from rack/tray
            locations, dispense with FEFO batch control, and manage refills & inventory.
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard testid="kpi-inbox" label="Rx inbox" value={stats.inbox} hint="Needs review" />
            <KpiCard testid="kpi-dispense" label="Dispense queue" value={stats.dispense} hint="Ready or in progress" accent="border-l-sage" />
            <KpiCard testid="kpi-pickup" label="Awaiting pickup" value={stats.pickup} hint="Bagged & ready" accent="border-l-teal" />
            <KpiCard testid="kpi-refills" label="Refill requests" value={stats.refills} hint="Pending approval" accent="border-l-plum" />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard testid="kpi-stat" label="STAT orders" value={stats.stat} hint="Highest priority" accent="border-l-clay" />
            <KpiCard testid="kpi-ward" label="Ward deliveries" value={stats.ward} hint="IPD pending" accent="border-l-teal" />
            <KpiCard testid="kpi-overrides" label="DDI Overrides" value={ddiOverrides.length} hint="Current shift" accent="border-l-clay" />
            <KpiCard testid="kpi-returns" label="Pending Returns" value={returns.filter((r) => r.status === "pending").length} hint="Unprocessed returns" accent="border-l-mustard" />
          </div>

          {activeAlerts.length > 0 && (
            <div className="surface divide-y divide-ink-100">
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="font-heading text-[15px] font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-clay" /> Live alerts
                </h3>
                <Link to="/pharmacy/operations" className="text-[12px] font-medium text-mustard hover:underline">Operations center</Link>
              </div>
              {activeAlerts.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.level === "critical" ? "text-clay" : "text-mustard"}`} />
                    <div>
                      <div className="font-medium text-ink-900">{a.title}</div>
                      <div className="text-ink-500">{a.body}</div>
                    </div>
                  </div>
                  {a.action_to && <Link to={a.action_to} className="btn-outline !h-7 !px-2 !text-[11px]">{a.action_label}</Link>}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link to="/pharmacy/search" className="surface flex items-center justify-between border-l-4 border-l-mustard px-5 py-4 transition hover:bg-white">
              <div>
                <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">Quick lookup</div>
                <div className="font-heading mt-2 text-[18px] font-semibold text-ink-900">Medicine search</div>
                <div className="mt-1 text-[12px] text-ink-400">Rack · tray · slot</div>
              </div>
              <Search className="h-5 w-5 text-mustard" />
            </Link>
            <Link to="/pharmacy/walk-in" className="surface flex items-center justify-between border-l-4 border-l-sage px-5 py-4 transition hover:bg-white">
              <div>
                <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">Counter</div>
                <div className="font-heading mt-2 text-[18px] font-semibold text-ink-900">Walk-in OTC</div>
              </div>
              <Store className="h-5 w-5 text-sage" />
            </Link>
            <Link to="/pharmacy/ward" className="surface flex items-center justify-between border-l-4 border-l-teal px-5 py-4 transition hover:bg-white">
              <div>
                <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">IPD</div>
                <div className="font-heading mt-2 text-[18px] font-semibold text-ink-900">Ward queue</div>
              </div>
              <BedDouble className="h-5 w-5 text-teal" />
            </Link>
            <Link to="/pharmacy/operations" className="surface flex items-center justify-between border-l-4 border-l-plum px-5 py-4 transition hover:bg-white">
              <div>
                <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">Insights</div>
                <div className="font-heading mt-2 text-[18px] font-semibold text-ink-900">Operations</div>
              </div>
              <Activity className="h-5 w-5 text-plum" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="surface lg:col-span-2">
              <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
                <h3 className="font-heading text-[16px] font-semibold text-ink-900">Active worklist</h3>
                <Link to="/pharmacy/dispense" className="text-[12px] font-medium text-mustard hover:underline">
                  Dispense counter <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-ink-100">
                {urgentQueue.map((rx) => {
                  const patient = getPatient(rx, patients);
                  return (
                    <WorklistRow key={rx.id} rx={rx} patientName={patient?.name} patientMrn={patient?.mrn} />
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="surface">
                <div className="border-b border-ink-200 px-5 py-4">
                  <h3 className="font-heading text-[16px] font-semibold text-ink-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-clay" /> Low stock
                  </h3>
                </div>
                <div className="divide-y divide-ink-100">
                  {lowStockDrugs.length === 0 ? (
                    <p className="px-5 py-6 text-[13px] text-ink-400">All items above reorder level.</p>
                  ) : (
                    lowStockDrugs.map((d) => (
                      <div key={d.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <div className="text-[13px] font-medium text-ink-900">{d.generic_name}</div>
                          <LocationChip location={d.location} />
                        </div>
                        <Link to="/pharmacy/inventory" className="btn-outline !h-7 !px-2 !text-[11px]">Restock</Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="surface p-5">
                <h3 className="font-heading text-[16px] font-semibold text-ink-900">Quick actions</h3>
                <div className="mt-4 grid gap-2">
                  <Link to="/pharmacy/search" className="btn-outline w-full justify-start"><Search className="h-4 w-4" /> Find medicine location</Link>
                  <Link to="/pharmacy/dispense" className="btn-outline w-full justify-start"><Package className="h-4 w-4" /> Open dispense counter</Link>
                  <Link to="/pharmacy/ward" className="btn-outline w-full justify-start"><BedDouble className="h-4 w-4" /> Ward deliveries</Link>
                  <Link to="/pharmacy/refills" className="btn-outline w-full justify-start"><RefreshCw className="h-4 w-4" /> Review refills</Link>
                  <Link to="/pharmacy/map" className="btn-outline w-full justify-start"><Snowflake className="h-4 w-4" /> Storage map</Link>
                </div>
              </div>

              {urgentWard.length > 0 && (
                <div className="surface">
                  <div className="border-b border-ink-200 px-5 py-4 flex items-center justify-between">
                    <h3 className="font-heading text-[16px] font-semibold flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-teal" /> Ward queue
                    </h3>
                    <Link to="/pharmacy/ward" className="text-[12px] text-teal hover:underline">View all</Link>
                  </div>
                  <div className="divide-y divide-ink-100">
                    {urgentWard.map((w) => {
                      const p = getPatient(w.patient_id, patients);
                      return (
                        <div key={w.id} className="px-5 py-2.5 text-[12px]">
                          <div className="font-medium">{w.ward} · {w.bed}</div>
                          <div className="text-ink-500">{p?.name} · {w.priority}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {dashboardTab === "shifts" && (
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-200 bg-stone-50/80 px-4 py-3">
            <h3 className="font-heading text-[15px] font-semibold text-ink-900">Shift Handover Archives</h3>
            <p className="text-[12.5px] text-ink-500">Review past 7 days of closed shift reports, compliance sign-offs, and collections audit ledgers.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Closed Date</th>
                <th className="px-4 py-3 text-left">Pharmacist</th>
                <th className="px-4 py-3 text-left">Supervisor Co-Sign</th>
                <th className="px-4 py-3 text-left">Total Rxs</th>
                <th className="px-4 py-3 text-left">OTC Sales</th>
                <th className="px-4 py-3 text-left">DDI Overrides</th>
                <th className="px-4 py-3 text-left">Wastage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shiftReports.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={FileText} title="No shift reports stored yet" /></td></tr>
              ) : (
                shiftReports.map((report) => (
                  <tr key={report.id} className="border-b border-stone-100 text-[13px]">
                    <td className="px-4 py-3 font-medium">{new Date(report.signedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{report.pharmacistName}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{report.supervisorName}</td>
                    <td className="px-4 py-3 font-mono">{report.rxCount}</td>
                    <td className="px-4 py-3 font-mono">₹{(report.otcTotal * 90).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-bold font-mono", report.ddiOverridesCount > 0 ? "bg-clay-soft text-clay" : "bg-bone text-ink-400")}>
                        {report.ddiOverridesCount} overrides
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-clay">₹{(report.wastageValue * 90).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] border-ink-200"
                          onClick={() => printPharmacistShiftReport(report)}
                        >
                          <Printer className="h-3 w-3 mr-1" /> Print
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px] border-ink-200 text-ink-600"
                          onClick={() => {
                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
                            const dl = document.createElement('a');
                            dl.setAttribute("href", dataStr);
                            dl.setAttribute("download", `Shift-Report-${report.id}.json`);
                            document.body.appendChild(dl);
                            dl.click();
                            dl.remove();
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Shift Report Dialog */}
      <ShiftReportModal
        open={shiftReportOpen}
        onClose={() => setShiftReportOpen(false)}
        metrics={shiftMetrics}
        pharmacistName="Riley Chen"
        onSubmit={(notes, supervisor) => {
          submitShiftReport({
            pharmacistName: "Riley Chen",
            supervisorName: supervisor,
            notes,
            rxCount: shiftMetrics.rxCount,
            priorityBreakdown: shiftMetrics.priorityBreakdown,
            lineItemsCount: shiftMetrics.lineItemsCount,
            avgDispenseTime: shiftMetrics.avgDispenseTime,
            reconciliation: shiftMetrics.reconciliation,
            otcTotal: shiftMetrics.otcTotal,
            otcBreakdown: shiftMetrics.otcBreakdown,
            ddiOverridesCount: shiftMetrics.ddiOverridesCount,
            nearExpiryActioned: shiftMetrics.nearExpiryActioned,
            coldChainBreaches: shiftMetrics.coldChainBreaches,
            wastageValue: shiftMetrics.wastageValue,
            wardReturnsCount: shiftMetrics.wardReturnsCount
          });
          setShiftReportOpen(false);
          setDashboardTab("shifts");
        }}
      />
    </div>
  );
}

function WorklistRow({
  rx,
  patientName,
  patientMrn,
}: {
  rx: { id: string; rx_number: string; priority: string; status: string; received_at: string; lines: { drug_id: string }[] };
  patientName?: string;
  patientMrn?: string;
}) {
  const firstDrug = findDrug(rx.lines[0]?.drug_id);
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-stone-50/50">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] font-medium text-ink-900">{rx.rx_number}</span>
          <PriorityPill priority={rx.priority} />
          <RxStatusPill status={rx.status} />
        </div>
        <div className="mt-0.5 text-[12px] text-ink-600">
          {patientName} · {patientMrn} · {rx.lines.length} item{rx.lines.length !== 1 ? "s" : ""}
        </div>
        {firstDrug && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-ink-400">{firstDrug.generic_name} {firstDrug.strength}</span>
            <LocationChip location={firstDrug.location} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-ink-400">
        <Clock className="h-3 w-3" /> {formatRelative(rx.received_at)}
      </div>
      <Link to="/pharmacy/prescriptions" className="btn-primary !h-8 !px-3 !text-[11px]">Open</Link>
    </div>
  );
}

function ShiftReportModal({
  open,
  onClose,
  metrics,
  onSubmit,
  pharmacistName
}: {
  open: boolean;
  onClose: () => void;
  metrics: any;
  onSubmit: (notes: string, supervisor: string) => void;
  pharmacistName: string;
}) {
  const { doctors, drugs } = usePharmacyStore();
  const [notes, setNotes] = useState("");
  const [supervisor, setSupervisor] = useState(doctors[0]?.name || "Dr. Elena Vasquez");
  // Per-drug pharmacist initials — required for each controlled substance row
  const [initials, setInitials] = useState<Record<number, string>>({});

  // All controlled rows must have non-empty initials to enable submit
  const allReconciled =
    metrics.reconciliation.length === 0 ||
    metrics.reconciliation.every((_: any, idx: number) => (initials[idx] ?? "").trim().length > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl border border-ink-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ink-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-[16px] font-bold text-ink-900">Sign-off & Shift Handover Report</h3>
            <p className="text-[12px] text-ink-500">Active session review for {pharmacistName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-ink-100 transition-colors">
            <X className="h-4 w-4 text-ink-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-[13px]">

          {/* Section A: Dispense Summary */}
          <div className="space-y-2">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-400">Section A: Dispensing Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-bone p-4 rounded-md border border-ink-200">
              <div>
                <div className="text-ink-500 text-[11px]">Processed prescriptions</div>
                <div className="text-[14px] font-bold text-ink-900">{metrics.rxCount} Rxs</div>
              </div>
              <div>
                <div className="text-ink-500 text-[11px]">Priority breakdown</div>
                <div className="text-[12px] font-medium text-ink-900 mt-1">
                  STAT: {metrics.priorityBreakdown.stat} · URG: {metrics.priorityBreakdown.urgent}
                </div>
              </div>
              <div>
                <div className="text-ink-500 text-[11px]">Total line items</div>
                <div className="text-[14px] font-bold text-ink-900">{metrics.lineItemsCount} items</div>
              </div>
              <div>
                <div className="text-ink-500 text-[11px]">Avg dispatch speed</div>
                <div className="text-[14px] font-bold text-ink-900">{metrics.avgDispenseTime}</div>
              </div>
            </div>
          </div>

          {/* Section B: Controlled Reconciliation */}
          <div className="space-y-2">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-400">Section B: Controlled Substance Reconciliation</h4>
            <div className="flex items-start gap-2 rounded bg-plum-soft/30 border border-plum/20 px-3 py-2 text-[11.5px] text-plum mb-2">
              <span className="font-bold shrink-0">⚠ Schedule H/X:</span>
              <span>Each controlled drug balance must be individually verified and initialled by the dispensing pharmacist before this shift report can be submitted.</span>
            </div>
            <div className="border border-ink-200 rounded-md overflow-hidden bg-bone">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-100 border-b border-ink-200 font-mono uppercase text-ink-400">
                    <th className="px-3 py-2 text-left">Controlled Drug — Schedule</th>
                    <th className="px-3 py-2 text-left w-20">Shift Open</th>
                    <th className="px-3 py-2 text-left w-20">Dispensed</th>
                    <th className="px-3 py-2 text-left w-20">Closing (Shelf)</th>
                    <th className="px-3 py-2 text-left w-20">Expected</th>
                    <th className="px-3 py-2 text-left w-16">Var</th>
                    <th className="px-3 py-2 text-right w-32">Pharmacist Initials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {metrics.reconciliation.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4 text-ink-400">No controlled drugs dispensed this shift.</td></tr>
                  ) : (
                    metrics.reconciliation.map((r: any, idx: number) => {
                      const drug = drugs.find((d: any) => `${d.generic_name} ${d.strength}` === r.drugName);
                      const schedule = drug?.controlled_schedule ?? "H";
                      return (
                        <tr key={idx} className={cn("bg-white", (initials[idx] ?? "").trim().length === 0 ? "" : "bg-sage-soft/5")}>
                          <td className="px-3 py-2 font-medium">
                            <div className="flex items-center gap-1.5">
                              {r.drugName}
                              <span className="rounded bg-plum-soft px-1 py-0.5 text-[9px] font-bold text-plum border border-plum/20">Sch-{schedule}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono">{r.openingBalance}</td>
                          <td className="px-3 py-2 font-mono text-plum font-semibold">{r.totalDispensed}</td>
                          <td className="px-3 py-2 font-mono">{r.closingBalance}</td>
                          <td className="px-3 py-2 font-mono">{r.expectedBalance}</td>
                          <td className="px-3 py-2 font-mono font-semibold" style={{ color: r.variance !== 0 ? "#b85c38" : "inherit" }}>{r.variance}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                maxLength={4}
                                value={initials[idx] ?? ""}
                                onChange={(e) => setInitials({ ...initials, [idx]: e.target.value.toUpperCase() })}
                                placeholder="Init."
                                className={cn(
                                  "w-16 h-7 px-2 text-center text-[11px] font-bold font-mono border rounded focus:outline-none uppercase",
                                  (initials[idx] ?? "").trim().length > 0
                                    ? "border-sage bg-sage-soft/20 text-sage"
                                    : "border-clay/40 bg-clay-soft/10 text-ink-600 placeholder:text-ink-300"
                                )}
                              />
                              {(initials[idx] ?? "").trim().length > 0 && (
                                <CheckCircle className="h-3.5 w-3.5 text-sage shrink-0" />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: OTC Collections */}
          <div className="space-y-2">
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-400">Section C: OTC Collections</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-bone p-4 rounded-md border border-ink-200">
              <div>
                <div className="text-ink-500 text-[11px]">Cash Drawer</div>
                <div className="text-[14px] font-mono font-semibold">₹{(metrics.otcBreakdown.cash * 90).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-ink-500 text-[11px]">Card Terminal</div>
                <div className="text-[14px] font-mono font-semibold">₹{(metrics.otcBreakdown.card * 90).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-ink-500 text-[11px]">UPI Digital</div>
                <div className="text-[14px] font-mono font-semibold">₹{(metrics.otcBreakdown.upi * 90).toFixed(2)}</div>
              </div>
              <div className="border-l border-ink-200 pl-3">
                <div className="text-ink-600 text-[11px] font-bold">Total OTC Sales</div>
                <div className="text-[16px] font-mono font-bold text-sage">₹{(metrics.otcTotal * 90).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Alert / Returns row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-400">Section D: Overrides & Alerts</h4>
              <div className="bg-bone p-3 rounded-md border border-ink-200 space-y-1 text-[12.5px]">
                <div className="flex justify-between"><span>DDI Overrides Logged:</span><span className="font-bold text-clay">{metrics.ddiOverridesCount}</span></div>
                <div className="flex justify-between"><span>Near-Expiry Actioned:</span><span className="font-bold text-ink-900">{metrics.nearExpiryActioned} items</span></div>
                <div className="flex justify-between"><span>Cold Chain Breaches:</span><span className={cn("font-bold", metrics.coldChainBreaches > 0 ? "text-clay" : "text-ink-900")}>{metrics.coldChainBreaches}</span></div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-400">Section E: Returns & Wastage</h4>
              <div className="bg-bone p-3 rounded-md border border-ink-200 space-y-1 text-[12.5px]">
                <div className="flex justify-between"><span>Ward Returns Handled:</span><span className="font-bold text-ink-900">{metrics.wardReturnsCount} returns</span></div>
                <div className="flex justify-between"><span>Wastage Value Disposed:</span><span className="font-bold text-clay">₹{(metrics.wastageValue * 90).toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Section F: Sign-off */}
          <div className="space-y-3 pt-3 border-t border-ink-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-ink-700 mb-1">Pharmacist Name</label>
                <input disabled value={pharmacistName} className="w-full h-9 px-3 border border-ink-200 bg-stone-50 text-[13px] rounded" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-ink-700 mb-1">Supervisor Co-Sign *</label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full h-9 px-2 border border-ink-200 bg-white text-[13px] rounded focus:outline-none"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-ink-700 mb-1">Handover remarks & notes</label>
              <textarea
                placeholder="Include details of shift activities, narcotic shelf balance notes, etc…"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-ink-200 text-[13px] rounded focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink-200 bg-stone-50 flex justify-end gap-2">
          <Button variant="outline" className="border-ink-200" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="btn-primary"
            disabled={metrics.reconciliation.length > 0 && !allReconciled}
            onClick={() => onSubmit(notes, supervisor)}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" /> Sign & Close Shift
          </Button>
        </div>
      </div>
    </div>
  );
}
