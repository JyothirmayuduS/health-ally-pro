import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { TODAY_STR } from "@/lib/mockData";
import { computeTotals } from "@/lib/billingData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Users,
  AlertCircle,
  Clock,
  IndianRupee,
  Download,
  TrendingUp,
  Stethoscope,
} from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const RANGES = ["Today", "Week", "Month"];
const ACCENTS = {
  footfall: { borderL: "border-l-sage", text: "text-sage", soft: "bg-sage-soft", color: "#2C5E4E" },
  noshow: { borderL: "border-l-clay", text: "text-clay", soft: "bg-clay-soft", color: "#B85C38" },
  wait: { borderL: "border-l-mustard", text: "text-mustard", soft: "bg-mustard-soft", color: "#A87826" },
  rev: { borderL: "border-l-money", text: "text-money", soft: "bg-money-soft", color: "#15803D" },
};

function KpiCard({ label, value, delta, accent, icon: Icon, testId }) {
  return (
    <div data-testid={testId} className={`surface p-4 border-l-2 ${accent.borderL}`}>
      <div className="flex items-start justify-between">
        <div className={`text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium`}>
          {label}
        </div>
        <div className={`w-7 h-7 rounded-sm grid place-items-center ${accent.soft}`}>
          <Icon className={`w-3.5 h-3.5 ${accent.text}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <div className="text-[26px] font-heading font-semibold text-ink-900 tabular-nums leading-none">
          {value}
        </div>
        {delta && (
          <span className={`text-[11px] font-mono ${accent.text}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const { appointments, patients, doctors, invoices } = useStore();
  const [range, setRange] = useState("Today");

  // For mock data, all "ranges" act on the same dataset but we relabel cards.
  const today = appointments.filter((a) => a.date === TODAY_STR);

  // KPIs
  const footfall = today.length;
  const noShow = today.filter((a) => a.status === "no-show").length;
  const noShowRate = footfall === 0 ? 0 : Math.round((noShow / footfall) * 100);

  // Average wait time (mock: average over checked-in/in-progress/completed)
  // For demo: use 14 min synthesized + jitter from data
  const avgWait =
    today.filter((a) => ["checked-in", "in-progress", "completed"].includes(a.status))
      .length === 0
      ? 0
      : 14 + (footfall % 4);

  const revenue = invoices
    .filter((i) => i.status === "paid" && i.date === TODAY_STR)
    .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);

  // Hourly footfall (8am-7pm)
  const hourly = useMemo(() => {
    const buckets = {};
    for (let h = 8; h < 20; h++) buckets[h] = 0;
    today.forEach((a) => {
      const h = Number(a.time.split(":")[0]);
      if (buckets[h] !== undefined) buckets[h]++;
    });
    return Object.entries(buckets).map(([h, v]) => ({
      hour: `${h}:00`,
      count: v,
    }));
  }, [today]);

  // No-shows by doctor (with rates)
  const noShowByDoctor = useMemo(
    () =>
      doctors.map((d) => {
        const docToday = today.filter((a) => a.doctorId === d.id);
        const ns = docToday.filter((a) => a.status === "no-show").length;
        return {
          doctor: d,
          total: docToday.length,
          noShow: ns,
          rate: docToday.length ? Math.round((ns / docToday.length) * 100) : 0,
        };
      }),
    [doctors, today],
  );

  // Registration source mix (mocked — synth from patient.createdAt buckets)
  const registrationMix = useMemo(() => {
    const total = patients.length;
    return [
      { name: "Walk-in", value: Math.round(total * 0.45), color: "#2C5E4E" },
      { name: "Phone", value: Math.round(total * 0.28), color: "#A87826" },
      { name: "Referral", value: Math.round(total * 0.17), color: "#7A4A6B" },
      { name: "Online", value: total - Math.round(total * 0.9), color: "#B85C38" },
    ];
  }, [patients]);

  // Revenue by method
  const revByMethod = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid" && i.date === TODAY_STR);
    const map = { cash: 0, card: 0, upi: 0, insurance: 0 };
    paid.forEach((i) => {
      const t = computeTotals(i.items, i.discount).total;
      if (i.method && map[i.method] !== undefined) map[i.method] += t;
    });
    return Object.entries(map).map(([k, v]) => ({ method: k.toUpperCase(), value: v }));
  }, [invoices]);

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Footfall", footfall],
      ["No-shows", noShow],
      ["No-show rate %", noShowRate],
      ["Avg wait (min)", avgWait],
      ["Revenue (₹)", revenue],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reception-report-${TODAY_STR}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="reports-page" className="space-y-5">
      {/* Range tabs + export */}
      <div className="surface flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              data-testid={`reports-range-${r.toLowerCase()}`}
              onClick={() => setRange(r)}
              className={`h-8 px-3 text-[12px] rounded-full font-medium ${
                range === r
                  ? "bg-plum text-white"
                  : "text-ink-600 hover:text-ink-900 hover:bg-bone"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="text-[11.5px] text-ink-400 font-mono ml-2">
          Showing reception desk metrics · {TODAY_STR}
        </div>
        <div className="ml-auto">
          <button
            data-testid="reports-export"
            onClick={exportCsv}
            className="btn-outline btn-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          testId="kpi-footfall"
          label="Footfall"
          value={footfall}
          delta="+12% vs avg"
          accent={ACCENTS.footfall}
          icon={Users}
        />
        <KpiCard
          testId="kpi-noshow"
          label="No-shows"
          value={`${noShow} · ${noShowRate}%`}
          delta={noShowRate > 10 ? "above target" : "on target"}
          accent={ACCENTS.noshow}
          icon={AlertCircle}
        />
        <KpiCard
          testId="kpi-wait"
          label="Avg wait"
          value={`${avgWait} min`}
          delta="target ≤ 15m"
          accent={ACCENTS.wait}
          icon={Clock}
        />
        <KpiCard
          testId="kpi-revenue"
          label="Revenue (desk)"
          value={fmt(revenue)}
          delta="paid today"
          accent={ACCENTS.rev}
          icon={IndianRupee}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hourly footfall */}
        <section className="lg:col-span-2 surface">
          <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                Hourly footfall
              </div>
              <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
                Arrivals by hour
              </h2>
            </div>
            <div className="text-[12px] text-ink-400 inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sage" />
              Peak at {hourly.reduce((p, c) => (c.count > p.count ? c : p), hourly[0])?.hour}
            </div>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#E5E5E0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }}
                  axisLine={{ stroke: "#E5E5E0" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#F9F9F6" }}
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E5E0",
                    fontSize: 12,
                    fontFamily: "IBM Plex Sans",
                  }}
                />
                <Bar dataKey="count" fill="#2C5E4E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Registration source mix */}
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Registrations
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              By source
            </h2>
          </div>
          <div className="p-4 h-64 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={registrationMix}
                  innerRadius={42}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {registrationMix.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E5E0",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2 text-[12.5px]">
              {registrationMix.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1 text-ink-600">{s.name}</span>
                  <span className="font-mono text-ink-900">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* No-show by doctor */}
        <section className="lg:col-span-2 surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              No-shows
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              By doctor — today
            </h2>
          </div>
          <ul className="divide-y divide-ink-200">
            {noShowByDoctor.map(({ doctor, total, noShow, rate }) => (
              <li
                key={doctor.id}
                data-testid={`noshow-row-${doctor.id}`}
                className="px-5 py-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-sm bg-clay-soft text-clay grid place-items-center">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink-900 truncate">
                    {doctor.name}
                  </div>
                  <div className="text-[11px] text-ink-400">{doctor.specialty}</div>
                </div>
                <div className="flex-1 max-w-[180px] h-2 bg-bone rounded-full overflow-hidden border border-ink-200">
                  <div
                    className="h-full bg-clay"
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>
                <div className="w-16 text-right font-mono text-[13px] text-ink-900">
                  {rate}%
                </div>
                <div className="w-20 text-right text-[11px] text-ink-400 font-mono">
                  {noShow}/{total}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Revenue by method */}
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Revenue
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              By method
            </h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revByMethod}
                layout="vertical"
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="#E5E5E0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v ? `₹${v}` : "0")}
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  tick={{ fontSize: 11, fill: "#1C1C19", fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  cursor={{ fill: "#F9F9F6" }}
                  formatter={(v) => fmt(v)}
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E5E0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#15803D" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
