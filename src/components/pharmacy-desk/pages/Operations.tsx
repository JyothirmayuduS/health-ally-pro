import { useMemo, useState } from "react";
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
  ShoppingCart,
  Snowflake,
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
  { id: "procurement", label: "Procurement", icon: ShoppingCart },
  { id: "audit", label: "Audit trail", icon: ClipboardList },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Operations() {
  const [tab, setTab] = useState<TabId>("shift");
  const { prescriptions, drugs, batches, movements, alerts, quarantineBatch } = usePharmacyStore();

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
    </div>
  );
}
