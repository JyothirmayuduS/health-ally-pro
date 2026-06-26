import { useMemo } from "react";
import { useLabStore, formatDateTime, getPatient } from "@/lib/lab-desk/store";
import { computeAnalytics } from "@/lib/lab-desk/analytics";
import { SectionLabel, KpiCard } from "@/components/lab-desk/Pills";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, AlertOctagon, Clock4 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const PIE_COLORS = ["#3f6b58", "#c38246", "#5a8773", "#9aa56a", "#a06b9a", "#6b9aa0", "#bb6f6f"];

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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { orders, patients } = useLabStore();
  const analytics = useMemo(() => computeAnalytics(orders), [orders]);

  const byTest = useMemo(() => Object.entries(analytics?.by_test || {}).map(([code, count]) => ({ code, count })), [analytics]);
  const bySection = useMemo(() => Object.entries(analytics?.by_section || {}).map(([section, count]) => ({ section, count })), [analytics]);
  const byStatus = useMemo(() => Object.entries(analytics?.by_status || {}).map(([status, count]) => ({ status, count })).filter((x) => x.count > 0), [analytics]);
  const byDay = useMemo(() => Object.entries(analytics?.by_day || {}).sort().map(([day, count]) => ({ day: day.slice(5), count })), [analytics]);

  const exportAll = () => {
    const rows = orders.map((o) => ({
      order_id: o.id, accession: o.accession,
      patient: getPatient(o, patients)?.name,
      test_code: o.test_code, status: o.status, priority: o.priority,
      ordered_at: o.ordered_at, collected_at: o.collected_at, released_at: o.released_at,
      doctor: o.doctor_name, source: o.source,
    }));
    downloadCsv(rows, `medora-lab-orders-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <SectionLabel action={
        <Button onClick={exportAll} size="sm" className="btn-primary" data-testid="export-csv-btn">
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
        </Button>
      }>
        Lab analytics
      </SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total orders" value={analytics?.totals?.orders ?? "—"} hint="All time" accent="sage" />
        <KpiCard label="Released" value={analytics?.totals?.validated ?? "—"} hint="Reports out" accent="emerald" />
        <KpiCard label="Pending" value={analytics?.totals?.pending ?? "—"} hint="In workflow" accent="amber" />
        <KpiCard label="Avg TAT" value={analytics?.avg_tat_hours != null ? `${analytics.avg_tat_hours}h` : "—"} hint="Order → release" accent="sky" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="surface p-5" data-testid="volume-chart">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Volume by test</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byTest} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e7e5e4" />
                <XAxis dataKey="code" tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#78716c" }} />
                <YAxis allowDecimals={false} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#78716c" }} />
                <Tooltip contentStyle={{ fontFamily: "IBM Plex Sans", fontSize: 12 }} />
                <Bar dataKey="count" fill="#3f6b58" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5" data-testid="status-pie">
          <h3 className="font-display font-semibold mb-4">Status mix</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "IBM Plex Sans", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5" data-testid="daily-trend">
          <div className="flex items-center gap-2 mb-4">
            <Clock4 className="h-4 w-4 text-[var(--sage-700)]" />
            <h3 className="font-display font-semibold">Daily volume</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={byDay} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e7e5e4" />
                <XAxis dataKey="day" tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#78716c" }} />
                <YAxis allowDecimals={false} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#78716c" }} />
                <Tooltip contentStyle={{ fontFamily: "IBM Plex Sans", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#c38246" strokeWidth={2.5} dot={{ r: 4, fill: "#c38246" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5" data-testid="section-bar">
          <h3 className="font-display font-semibold mb-4">By section</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={bySection} layout="vertical" margin={{ top: 4, right: 16, left: 30, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e7e5e4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#78716c" }} />
                <YAxis dataKey="section" type="category" tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#78716c" }} />
                <Tooltip contentStyle={{ fontFamily: "IBM Plex Sans", fontSize: 12 }} />
                <Bar dataKey="count" fill="#5a8773" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="surface p-5" data-testid="critical-log">
        <div className="flex items-center gap-2 mb-4">
          <AlertOctagon className="h-4 w-4 text-red-500" />
          <h3 className="font-display font-semibold">Critical values log</h3>
          <span className="text-xs font-mono text-ink-400">({(analytics?.criticals || []).length})</span>
        </div>
        {(analytics?.criticals || []).length === 0 ? (
          <div className="text-sm text-ink-400 py-3">No critical results recorded.</div>
        ) : (
          <div className="space-y-2">
            {(analytics?.criticals || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-stone-100 pb-2 last:border-0">
                <div>
                  <div className="font-mono text-xs text-ink-400">{c.order_id} · {c.param} = <b className="text-red-700">{c.value}</b></div>
                </div>
                <div className="text-xs text-ink-400">{formatDateTime(c.at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
