import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
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

export default function Dashboard() {
  const { prescriptions, refills, drugs, batches, patients, wardOrders, alerts } = usePharmacyStore();
  const { name } = usePharmacyAuth();

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

  return (
    <div className="space-y-8" data-testid="pharmacy-dashboard">
      <SectionLabel
        action={
          <Link to="/pharmacy/prescriptions" className="btn-primary !h-8 !px-3 !text-[12px]">
            <Pill className="h-3.5 w-3.5" /> Open inbox
          </Link>
        }
      >
        Control desk — {name.split(" ")[0]}
      </SectionLabel>

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
        <KpiCard testid="kpi-hold" label="On hold" value={stats.onHold} hint="Clinical review" />
        <KpiCard testid="kpi-alerts" label="Active alerts" value={stats.alerts} hint="Needs attention" accent="border-l-clay" />
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
