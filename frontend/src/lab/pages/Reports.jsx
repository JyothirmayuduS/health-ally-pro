import { useMemo } from "react";
import { useLab, formatDateTime, getPatient, flagValue } from "@/lab/store";
import { findCatalog, SECTIONS } from "@/lab/mockData";
import { SectionLabel, KpiCard } from "@/lab/components/Pills";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertOctagon } from "lucide-react";

function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { orders, patients } = useLab();

  const stats = useMemo(() => {
    const total = orders.length;
    const validated = orders.filter((o) => o.status === "validated");
    const cancelled = orders.filter((o) => o.status === "cancelled");
    const pending = orders.filter((o) => !["validated", "cancelled"].includes(o.status));

    const tats = validated
      .filter((o) => o.released_at && o.ordered_at)
      .map((o) => (new Date(o.released_at) - new Date(o.ordered_at)) / 3_600_000);
    const avgTat = tats.length ? (tats.reduce((a, b) => a + b, 0) / tats.length).toFixed(1) : "—";

    const byTest = {};
    orders.forEach((o) => { byTest[o.test_code] = (byTest[o.test_code] || 0) + 1; });

    const criticals = [];
    orders.forEach((o) => {
      const cat = findCatalog(o.test_code);
      cat?.parameters.forEach((p) => {
        const f = flagValue(p, o.results?.[p.key]);
        if (f.level === "critical") {
          criticals.push({ orderId: o.id, patient: getPatient(o, patients)?.name, param: p.label, value: o.results?.[p.key], at: o.completed_at });
        }
      });
    });

    const backlog = orders.filter((o) => {
      if (["validated", "cancelled"].includes(o.status)) return false;
      const hours = (Date.now() - new Date(o.ordered_at).getTime()) / 3_600_000;
      return hours > 24;
    });

    return { total, validated: validated.length, cancelled: cancelled.length, pending: pending.length, avgTat, byTest, criticals, backlog };
  }, [orders, patients]);

  const exportAll = () => {
    const rows = orders.map((o) => ({
      order_id: o.id,
      accession: o.accession,
      patient: getPatient(o, patients)?.name,
      test_code: o.test_code,
      status: o.status,
      priority: o.priority,
      ordered_at: o.ordered_at,
      collected_at: o.collected_at,
      released_at: o.released_at,
    }));
    downloadCsv(rows, `medora-lab-orders-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <SectionLabel
        action={
          <Button onClick={exportAll} size="sm" className="bg-[var(--sage-700)] hover:bg-[var(--sage-900)]" data-testid="export-csv-btn">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        }
      >
        Lab analytics
      </SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total orders" value={stats.total} hint="All time (mock)" accent="sage" />
        <KpiCard label="Released" value={stats.validated} hint="Reports out" accent="emerald" />
        <KpiCard label="Pending" value={stats.pending} hint="In workflow" accent="amber" />
        <KpiCard label="Avg TAT" value={`${stats.avgTat}h`} hint="Order → release" accent="sky" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-5" data-testid="volume-by-test">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Volume by test</h3>
          </div>
          <div className="space-y-2.5">
            {Object.entries(stats.byTest).map(([code, count]) => {
              const max = Math.max(...Object.values(stats.byTest));
              return (
                <div key={code}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono">{code}</span>
                    <span className="font-mono text-stone-500">{count}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded overflow-hidden">
                    <div className="h-full bg-[var(--sage-500)]" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5" data-testid="critical-log">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="h-4 w-4 text-red-500" />
            <h3 className="font-display font-semibold">Critical values log</h3>
            <span className="text-xs font-mono text-stone-500">({stats.criticals.length})</span>
          </div>
          {stats.criticals.length === 0 ? (
            <div className="text-sm text-stone-500 py-3">No critical results recorded.</div>
          ) : (
            <div className="space-y-2">
              {stats.criticals.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-stone-100 pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{c.patient}</div>
                    <div className="text-xs text-stone-500 font-mono">{c.orderId} · {c.param} = <b className="text-red-700">{c.value}</b></div>
                  </div>
                  <div className="text-xs text-stone-500">{formatDateTime(c.at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5" data-testid="aging-backlog">
          <h3 className="font-display font-semibold mb-3">Aging backlog (&gt;24h)</h3>
          {stats.backlog.length === 0 ? (
            <div className="text-sm text-stone-500">No backlog. 🎉</div>
          ) : (
            <div className="space-y-2">
              {stats.backlog.map((o) => {
                const p = getPatient(o, patients);
                return (
                  <div key={o.id} className="flex justify-between text-sm">
                    <span>{o.id} · {p?.name}</span>
                    <span className="font-mono text-amber-700">{o.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5" data-testid="section-load">
          <h3 className="font-display font-semibold mb-3">Section utilization</h3>
          <div className="space-y-2">
            {SECTIONS.map((s) => {
              const count = orders.filter((o) => findCatalog(o.test_code)?.section === s.id).length;
              return (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-mono text-stone-600">{count} orders</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
