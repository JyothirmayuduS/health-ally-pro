import React, { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Download,
  Package,
  Plus,
  ShoppingCart,
  Snowflake,
  Thermometer,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  usePharmacyStore,
  formatRelative,
  isLowStock,
  availableQty,
} from "@/lib/pharmacy-desk/store";
import { SectionLabel, KpiCard, LocationChip } from "@/components/pharmacy-desk/Pills";
import { findDrug, HOURLY_DISPENSE_SEED } from "@/lib/pharmacy-desk/mockData";
import { expiryStatus } from "@/lib/pharmacy-desk/location";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "shift", label: "Shift pulse", icon: Activity },
  { id: "expiry", label: "Expiry & quarantine", icon: Snowflake },
  { id: "coldchain", label: "Cold chain log", icon: Thermometer },
  { id: "procurement", label: "Procurement", icon: ShoppingCart },
  { id: "audit", label: "Audit trail", icon: ClipboardList },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Operations() {
  const [tab, setTab] = useState<TabId>("shift");
  const [breachModalOpen, setBreachModalOpen] = useState(false);
  const { prescriptions, drugs, batches, movements, alerts, quarantineBatch, coldChainBreaches, logColdChainBreach, resolveColdChainBreach } = usePharmacyStore();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const openRx = prescriptions.filter((r) => !["collected", "cancelled"].includes(r.status));
    const slaBreaches = openRx.filter((r) => {
      const mins = (Date.now() - new Date(r.received_at).getTime()) / 60_000;
      return mins > 15 && ["received", "in_review"].includes(r.status);
    });
    const collectedToday = prescriptions.filter(
      (r) => r.collected_at && new Date(r.collected_at).toDateString() === today,
    ).length;
    const turnaround = prescriptions
      .filter((r) => r.collected_at)
      .map((r) => (new Date(r.collected_at!).getTime() - new Date(r.received_at).getTime()) / 60_000);
    const avgTat = turnaround.length ? Math.round(turnaround.reduce((a, b) => a + b, 0) / turnaround.length) : 0;

    const statusMix = [
      { name: "Inbox", count: prescriptions.filter((r) => ["received", "in_review"].includes(r.status)).length },
      { name: "Dispense", count: prescriptions.filter((r) => ["ready_to_dispense", "dispensing"].includes(r.status)).length },
      { name: "Pickup", count: prescriptions.filter((r) => r.status === "ready_pickup").length },
      { name: "Hold", count: prescriptions.filter((r) => r.status === "on_hold").length },
    ];

    const lowStock = drugs
      .filter((d) => isLowStock(d, batches.filter((b) => b.drug_id === d.id)))
      .map((d) => ({
        drug: d,
        avail: availableQty(batches.filter((b) => b.drug_id === d.id)),
        orderQty: Math.max(d.reorder_level * 2 - availableQty(batches.filter((b) => b.drug_id === d.id)), d.reorder_level),
      }));

    const expiring = batches
      .filter((b) => b.status === "active")
      .map((b) => ({ batch: b, drug: findDrug(b.drug_id), exp: expiryStatus(b.expiry) }))
      .filter((x) => x.exp.level !== "ok")
      .sort((a, b) => a.exp.days - b.exp.days);

    const activeAlerts = alerts.filter((a) => !a.dismissed);

    return { slaBreaches, collectedToday, avgTat, statusMix, lowStock, expiring, activeAlerts };
  }, [prescriptions, drugs, batches, alerts]);

  function exportCsv() {
    const rows = movements.map((m) => {
      const drug = findDrug(m.drug_id);
      return [m.at, m.type, drug?.generic_name, m.qty, m.actor, m.reference ?? ""].join(",");
    });
    const blob = new Blob([["time,type,drug,qty,actor,ref", ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pharmacy-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6" data-testid="pharmacy-operations">
      <SectionLabel
        eyebrow="Maple · Pharmacy ops"
        action={
          <Button variant="outline" size="sm" className="border-ink-200" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export audit CSV
          </Button>
        }
      >
        Operations center
      </SectionLabel>

      {stats.activeAlerts.length > 0 && (
        <div className="space-y-2">
          {stats.activeAlerts.slice(0, 3).map((a) => (
            <div
              key={a.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[13px] ${
                a.level === "critical"
                  ? "border-clay/40 bg-clay-soft/40"
                  : a.level === "warning"
                    ? "border-mustard/40 bg-mustard-soft/40"
                    : "border-ink-200 bg-stone-50"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.level === "critical" ? "text-clay" : "text-mustard"}`} />
                <div>
                  <div className="font-medium text-ink-900">{a.title}</div>
                  <div className="text-ink-600">{a.body}</div>
                </div>
              </div>
              {a.action_to && a.action_label && (
                <Link to={a.action_to} className="btn-primary !h-8 !px-3 !text-[11px]">{a.action_label}</Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Collected today" value={stats.collectedToday} hint="OPD handovers" />
        <KpiCard label="Avg turnaround" value={`${stats.avgTat}m`} accent="border-l-sage" />
        <KpiCard label="SLA breaches" value={stats.slaBreaches.length} hint="&gt;15 min in inbox" accent="border-l-clay" />
        <KpiCard label="Active alerts" value={stats.activeAlerts.length} accent="border-l-mustard" />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-ink-200 pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-t-md px-4 py-2.5 text-[13px] font-medium transition ${
                tab === t.id
                  ? "border border-b-0 border-ink-200 bg-white text-mustard"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "shift" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface p-5">
            <h3 className="font-heading text-[16px] font-semibold text-ink-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sage" /> Hourly volume
            </h3>
            <p className="mt-1 text-[12px] text-ink-400">OPD Rx vs ward deliveries today</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_DISPENSE_SEED}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="rx" stackId="1" stroke="#2C5E4E" fill="#2C5E4E33" name="OPD Rx" />
                  <Area type="monotone" dataKey="ward" stackId="1" stroke="#A87826" fill="#A8782633" name="Ward" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface p-5">
            <h3 className="font-heading text-[16px] font-semibold text-ink-900">Queue mix</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#A87826" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {stats.slaBreaches.length > 0 && (
            <div className="surface lg:col-span-2">
              <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
                <h3 className="font-heading flex items-center gap-2 text-[16px] font-semibold text-clay">
                  <Timer className="h-4 w-4" /> SLA breaches — action required
                </h3>
                <Link to="/pharmacy/prescriptions" className="btn-primary !h-8 !text-[12px]">Open inbox</Link>
              </div>
              <div className="divide-y divide-ink-100">
                {stats.slaBreaches.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between px-5 py-3 text-[13px]">
                    <span className="font-mono font-medium">{rx.rx_number}</span>
                    <span className="text-ink-500">Waiting {formatRelative(rx.received_at)}</span>
                    <span className="rounded-sm bg-clay-soft px-2 py-0.5 text-[10px] font-medium uppercase text-clay">{rx.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "expiry" && (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Drug</th>
                <th className="px-4 py-3 text-left">Lot</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Qty</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.expiring.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-400">No batches expiring within 90 days.</td></tr>
              ) : (
                stats.expiring.map(({ batch, drug, exp }) => (
                  <tr key={batch.id} className="border-b border-stone-100">
                    <td className="px-4 py-3 font-medium">{drug?.generic_name}</td>
                    <td className="px-4 py-3 font-mono text-[12px]">{batch.lot}</td>
                    <td className="px-4 py-3">{drug && <LocationChip location={drug.location} />}</td>
                    <td className={`px-4 py-3 ${exp.level === "critical" ? "font-medium text-clay" : "text-mustard"}`}>{exp.label}</td>
                    <td className="px-4 py-3 font-mono">{batch.qty}</td>
                    <td className="px-4 py-3 text-right">
                      {batch.status === "active" ? (
                        <Button size="sm" variant="outline" className="border-clay/30 text-clay" onClick={() => quarantineBatch(batch.id, "Expiry review")}>
                          Quarantine
                        </Button>
                      ) : (
                        <span className="text-[11px] text-ink-400">Quarantined</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "coldchain" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-[16px] font-semibold text-ink-900 flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-sky-500" /> Cold Chain Breach Action Log
              </h3>
              <p className="text-[12px] text-ink-400 mt-0.5">Schedule H/X and cold-chain integrity incident records — who acknowledged, corrective action, and affected stock status.</p>
            </div>
            <Button size="sm" className="btn-primary" onClick={() => setBreachModalOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Log New Breach
            </Button>
          </div>

          {coldChainBreaches.length === 0 ? (
            <div className="surface py-12 text-center text-ink-400">No cold chain breaches logged.</div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-ink-200 bg-stone-50">
                  <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-3 text-left">Date / Time</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Temp Recorded</th>
                    <th className="px-4 py-3 text-left">Logged By</th>
                    <th className="px-4 py-3 text-left">Corrective Action</th>
                    <th className="px-4 py-3 text-left">Batches</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coldChainBreaches.map((b) => (
                    <tr key={b.id} className="border-b border-stone-100 hover:bg-stone-50/50 align-top">
                      <td className="px-4 py-3 text-[12px] text-ink-500 whitespace-nowrap">
                        {new Date(b.loggedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-sky-700">{b.unit}</td>
                      <td className="px-4 py-3">
                        <span className="text-clay font-bold">{b.tempReading}</span>
                        <span className="text-ink-400 text-[11px] ml-1">(expected {b.expectedRange})</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.loggedBy}</div>
                        <div className="text-[11px] text-ink-400">Ack: {b.acknowledgedBy}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] max-w-xs">{b.correctiveAction}</td>
                      <td className="px-4 py-3 font-mono text-[12px]">
                        {b.affectedBatchIds.length > 0
                          ? b.affectedBatchIds.join(", ")
                          : <span className="text-ink-400">None</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === "resolved" ? (
                          <div>
                            <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-sage-soft text-sage">Resolved</span>
                            {b.resolvedAt && (
                              <div className="text-[10px] text-ink-400 mt-0.5">{new Date(b.resolvedAt).toLocaleString()}</div>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] border-sage/40 text-sage"
                            onClick={() => resolveColdChainBreach(b.id)}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "procurement" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-sage/30 bg-sage-soft/30 px-4 py-3 text-[13px] text-ink-600">
            Suggested purchase orders based on reorder levels and current on-hand stock.
          </div>
          {stats.lowStock.length === 0 ? (
            <div className="surface py-12 text-center text-ink-400">All SKUs above reorder level.</div>
          ) : (
            stats.lowStock.map(({ drug, avail, orderQty }) => (
              <div key={drug.id} className="surface flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-medium text-ink-900">{drug.generic_name} {drug.strength}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <LocationChip location={drug.location} />
                    <span className="text-[12px] text-clay">On hand {avail} · reorder {drug.reorder_level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] text-ink-600">Order <strong>{orderQty}</strong> units</span>
                  <Button size="sm" className="btn-primary" onClick={() => window.alert(`PO draft created for ${drug.generic_name} × ${orderQty}`)}>
                    <Package className="mr-1.5 h-3.5 w-3.5" /> Generate PO
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-stone-50">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Drug</th>
                <th className="px-4 py-3 text-left">Qty</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Reference</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const drug = findDrug(m.drug_id);
                return (
                  <tr key={m.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-[12px] text-ink-500">{formatRelative(m.at)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-sm bg-ink-100 px-2 py-0.5 font-mono text-[10px] uppercase">{m.type}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{drug?.generic_name}</td>
                    <td className="px-4 py-3 font-mono">{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                    <td className="px-4 py-3">{m.actor}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-400">{m.reference ?? m.note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <LogBreachModal
        open={breachModalOpen}
        onClose={() => setBreachModalOpen(false)}
        onSubmit={(entry) => { logColdChainBreach(entry); setBreachModalOpen(false); }}
      />
    </div>
  );
}

// ── Log Breach Modal ──────────────────────────────────────────────────────────────────
function LogBreachModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: any) => void;
}) {
  const { batches, drugs } = usePharmacyStore();
  const [unit, setUnit] = useState("FRIDGE-1");
  const [tempReading, setTempReading] = useState("");
  const [expectedRange, setExpectedRange] = useState("2–8°C");
  const [acknowledgedBy, setAcknowledgedBy] = useState("Riley Chen");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [affectedBatchIds, setAffectedBatchIds] = useState<string[]>([]);

  // Batches in cold zone for selection
  const coldBatches = batches.filter((b) => {
    const drug = drugs.find((d) => d.id === b.drug_id);
    return drug?.location.zone === "cold" && b.status === "active";
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempReading || !correctiveAction) return;
    onSubmit({
      loggedBy: "Riley Chen",
      unit,
      tempReading,
      expectedRange,
      acknowledgedBy,
      correctiveAction,
      affectedBatchIds,
      status: "open" as const,
    });
    // Reset
    setTempReading("");
    setCorrectiveAction("");
    setAffectedBatchIds([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-ink-200 w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 bg-stone-50 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-[15px] font-bold text-ink-900">Log Cold Chain Breach</h3>
            <p className="text-[11px] text-ink-500 mt-0.5">Regulatory record of temperature excursion and corrective action taken</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-ink-100 transition">
            <AlertTriangle className="h-4 w-4 text-sky-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-ink-700 mb-1">Cold Unit / Fridge</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 border border-ink-200 rounded-md bg-white px-2 text-[12.5px] focus:outline-none focus:border-sky-400"
              >
                {["FRIDGE-1", "FRIDGE-2", "FREEZER-1", "CRYO-VAULT"].map(u => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-ink-700 mb-1">Temperature Recorded</label>
              <input
                value={tempReading}
                onChange={(e) => setTempReading(e.target.value)}
                required
                placeholder="e.g. 12°C"
                className="w-full h-9 px-3 border border-ink-200 rounded-md bg-white text-[12.5px] focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-ink-700 mb-1">Expected Range</label>
              <input
                value={expectedRange}
                onChange={(e) => setExpectedRange(e.target.value)}
                className="w-full h-9 px-3 border border-ink-200 rounded-md bg-white text-[12.5px] focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-ink-700 mb-1">Acknowledged By</label>
              <input
                value={acknowledgedBy}
                onChange={(e) => setAcknowledgedBy(e.target.value)}
                className="w-full h-9 px-3 border border-ink-200 rounded-md bg-white text-[12.5px] focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-ink-700 mb-1">Corrective Action Taken *</label>
            <textarea
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              required
              rows={3}
              placeholder="Describe actions: technician called, stock moved, repair done, quarantine applied…"
              className="w-full px-3 py-2 border border-ink-200 rounded-md bg-white text-[12.5px] focus:outline-none focus:border-sky-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-ink-700 mb-1">Affected Batches (select all impacted)</label>
            <div className="border border-ink-200 rounded-md bg-bone overflow-y-auto max-h-36 divide-y divide-ink-100">
              {coldBatches.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-ink-400">No cold batches in system.</div>
              ) : (
                coldBatches.map((b) => {
                  const drug = drugs.find((d) => d.id === b.drug_id);
                  const checked = affectedBatchIds.includes(b.id);
                  return (
                    <label key={b.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-sky-50/40">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setAffectedBatchIds((prev) =>
                            checked ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                          );
                        }}
                        className="rounded border-ink-300 text-sky-600 focus:ring-sky-400"
                      />
                      <span className="text-[12px] font-medium text-ink-900">{drug?.generic_name}</span>
                      <span className="font-mono text-[10px] text-ink-400">{b.lot} · {b.qty} units · Exp {b.expiry}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-ink-200 pt-4 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="h-9 px-4 border border-ink-200 rounded-md text-[13px] text-ink-600 hover:bg-stone-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!tempReading || !correctiveAction}
              className="h-9 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 rounded-md text-[13px] font-bold text-white transition"
            >
              Submit Breach Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
