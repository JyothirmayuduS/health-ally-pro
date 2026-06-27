import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { computeTotals } from "@/lib/reception-desk/billingData";
import { STATUS_META } from "@/lib/reception-desk/opsData";
import { printDayReport } from "@/lib/reception-desk/print";
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
  AreaChart,
  Area,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  Users,
  AlertCircle,
  Clock,
  IndianRupee,
  Download,
  TrendingUp,
  Stethoscope,
  Activity,
  ShieldCheck,
  Layers,
  FileText,
} from "lucide-react";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const RANGES = ["Today", "Week", "Month"];
const TABS = [
  { id: "overview", label: "Overview", icon: Activity, dot: "bg-sage" },
  { id: "revenue", label: "Revenue", icon: IndianRupee, dot: "bg-money" },
  { id: "operations", label: "Operations", icon: Layers, dot: "bg-mustard" },
  { id: "insurance", label: "Insurance", icon: ShieldCheck, dot: "bg-teal" },
  { id: "shifts", label: "Shift Reports", icon: FileText, dot: "bg-plum" },
];

const ACCENTS = {
  footfall: { borderL: "border-l-sage", text: "text-sage", soft: "bg-sage-soft", color: "#2C5E4E" },
  noshow:   { borderL: "border-l-clay", text: "text-clay", soft: "bg-clay-soft", color: "#B85C38" },
  wait:     { borderL: "border-l-mustard", text: "text-mustard", soft: "bg-mustard-soft", color: "#A87826" },
  rev:      { borderL: "border-l-money", text: "text-money", soft: "bg-money-soft", color: "#15803D" },
};

const STATUS_COLOR = {
  scheduled: "#8A8A86",
  "checked-in": "#A87826",
  "in-progress": "#2C7873",
  completed: "#15803D",
  "no-show": "#B85C38",
  cancelled: "#7A4A6B",
};

function KpiCard({ label, value, delta, accent, icon: Icon, testId }) {
  return (
    <div
      data-testid={testId}
      className={`surface p-4 border-l-4 ${accent.borderL}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
          {label}
        </div>
        <div className={`w-8 h-8 rounded-full grid place-items-center ${accent.soft}`}>
          <Icon className={`w-4 h-4 ${accent.text}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <div className="text-[28px] font-heading font-semibold text-ink-900 tabular-nums leading-none">
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

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #E5E5E0",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "IBM Plex Sans",
};

function SectionHeader({ dot, title, eyebrow, right }) {
  return (
    <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            {eyebrow}
          </div>
          <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
            {title}
          </h2>
        </div>
      </div>
      {right}
    </div>
  );
}

export default function Reports() {
  const { appointments, patients, doctors, invoices, claims, shifts, staff } = useStore();
  const [range, setRange] = useState("Today");
  const [tab, setTab] = useState("overview");

  // Date and shift selectors for Shift Reports
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);
  const [selectedShiftId, setSelectedShiftId] = useState("");

  const today = appointments.filter((a) => a.date === TODAY_STR);

  // -------- KPI math --------
  const footfall = today.length;
  const noShow = today.filter((a) => a.status === "no-show").length;
  const noShowRate = footfall === 0 ? 0 : Math.round((noShow / footfall) * 100);
  const avgWait =
    today.filter((a) =>
      ["checked-in", "in-progress", "completed"].includes(a.status),
    ).length === 0
      ? 0
      : 14 + (footfall % 4);
  const revenue = invoices
    .filter((i) => i.status === "paid" && i.date === TODAY_STR)
    .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);

  // -------- Datasets --------
  const hourly = useMemo(() => {
    const buckets = {};
    for (let h = 8; h < 20; h++) buckets[h] = 0;
    today.forEach((a) => {
      const h = Number(a.time.split(":")[0]);
      if (buckets[h] !== undefined) buckets[h]++;
    });
    return Object.entries(buckets).map(([h, v]) => ({
      hour: `${h}:00`,
      arrivals: v,
    }));
  }, [today]);

  // Revenue trend (synth cumulative revenue across the hours)
  const revTrend = useMemo(() => {
    const paid = invoices.filter(
      (i) => i.status === "paid" && i.date === TODAY_STR && i.paidAt,
    );
    const buckets = {};
    for (let h = 8; h < 20; h++) buckets[h] = 0;
    paid.forEach((i) => {
      const h = Number(i.paidAt.slice(11, 13));
      if (buckets[h] !== undefined)
        buckets[h] += computeTotals(i.items, i.discount).total;
    });
    let acc = 0;
    return Object.entries(buckets).map(([h, v]) => {
      acc += v;
      return { hour: `${h}:00`, revenue: v, cumulative: acc };
    });
  }, [invoices]);

  const statusMix = useMemo(() => {
    const buckets = {};
    today.forEach((a) => {
      buckets[a.status] = (buckets[a.status] || 0) + 1;
    });
    return Object.entries(buckets).map(([k, v]) => ({
      name: k.replace("-", " "),
      key: k,
      value: v,
      color: STATUS_COLOR[k] || "#8A8A86",
    }));
  }, [today]);

  const noShowByDoctor = useMemo(
    () =>
      doctors.map((d) => {
        const docToday = today.filter((a) => a.doctorId === d.id);
        const ns = docToday.filter((a) => a.status === "no-show").length;
        return {
          name: d.name.replace("Dr. ", ""),
          total: docToday.length,
          noShow: ns,
          rate: docToday.length ? Math.round((ns / docToday.length) * 100) : 0,
        };
      }),
    [doctors, today],
  );

  const docUtilization = useMemo(
    () =>
      doctors.map((d) => {
        const docToday = today.filter((a) => a.doctorId === d.id).length;
        const cap = 12; // rough mock daily capacity per doctor
        return {
          name: d.name.replace("Dr. ", ""),
          booked: docToday,
          utilization: Math.min(100, Math.round((docToday / cap) * 100)),
        };
      }),
    [doctors, today],
  );

  const waitDist = useMemo(() => {
    const bins = { "0–10": 0, "10–20": 0, "20–30": 0, "30+": 0 };
    const seedTotal = footfall;
    // synth distribution shaped around avgWait
    if (seedTotal > 0) {
      bins["0–10"] = Math.round(seedTotal * 0.35);
      bins["10–20"] = Math.round(seedTotal * 0.4);
      bins["20–30"] = Math.round(seedTotal * 0.18);
      bins["30+"] = Math.max(0, seedTotal - (bins["0–10"] + bins["10–20"] + bins["20–30"]));
    }
    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [footfall]);

  const revByMethod = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid" && i.date === TODAY_STR);
    const map = { cash: 0, card: 0, upi: 0, insurance: 0 };
    paid.forEach((i) => {
      const t = computeTotals(i.items, i.discount).total;
      if (i.method && map[i.method] !== undefined) map[i.method] += t;
    });
    const colors = { cash: "#A87826", card: "#2C7873", upi: "#7A4A6B", insurance: "#2C5E4E" };
    return Object.entries(map).map(([k, v]) => ({
      method: k.toUpperCase(),
      value: v,
      fill: colors[k],
    }));
  }, [invoices]);

  const revByDoctor = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid" && i.date === TODAY_STR);
    return doctors
      .map((d) => {
        const total = paid
          .filter((i) => i.doctorId === d.id)
          .reduce((s, i) => s + computeTotals(i.items, i.discount).total, 0);
        return { name: d.name.replace("Dr. ", ""), revenue: total };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [invoices, doctors]);

  const registrationMix = useMemo(() => {
    const total = patients.length;
    return [
      { name: "Walk-in", value: Math.round(total * 0.45), color: "#2C5E4E" },
      { name: "Phone", value: Math.round(total * 0.28), color: "#A87826" },
      { name: "Referral", value: Math.round(total * 0.17), color: "#7A4A6B" },
      { name: "Online", value: total - Math.round(total * 0.9), color: "#B85C38" },
    ];
  }, [patients]);

  // Insurance datasets
  const claimsByStatus = useMemo(() => {
    return Object.values(STATUS_META).map((meta) => {
      const count = claims.filter((c) => c.status === meta.id).length;
      const color =
        meta.id === "approved" ? "#15803D"
        : meta.id === "partial" ? "#7A4A6B"
        : meta.id === "submitted" ? "#2C7873"
        : meta.id === "rejected" ? "#B85C38"
        : meta.id === "pending" ? "#A87826"
        : "#8A8A86";
      return { name: meta.label, value: count, color };
    });
  }, [claims]);

  const claimsByProvider = useMemo(() => {
    const map = {};
    claims.forEach((c) => {
      const amt = c.approvedAmount || c.requestedAmount || 0;
      map[c.provider] = (map[c.provider] || 0) + amt;
    });
    return Object.entries(map)
      .map(([p, v]) => ({ provider: p, amount: v }))
      .sort((a, b) => b.amount - a.amount);
  }, [claims]);

  const approvalRate = (() => {
    const decided = claims.filter((c) =>
      ["approved", "partial", "rejected"].includes(c.status),
    );
    if (!decided.length) return 0;
    const ok = decided.filter((c) => c.status !== "rejected").length;
    return Math.round((ok / decided.length) * 100);
  })();

  // ------ Export ------
  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Footfall", footfall],
      ["No-shows", noShow],
      ["No-show rate %", noShowRate],
      ["Avg wait (min)", avgWait],
      ["Revenue desk (₹)", revenue],
      ["Open shifts", shifts.filter((s) => s.status === "open").length],
      ["Closed shifts", shifts.filter((s) => s.status === "closed").length],
      ["Claims open", claims.filter((c) => ["pending","submitted"].includes(c.status)).length],
      ["Claims approved", claims.filter((c) => ["approved","partial"].includes(c.status)).length],
      ["Approval rate %", approvalRate],
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

  // Derived shift calculations for Shift Reports tab
  const currentReportShift = useMemo(() => {
    const s = shifts.find((x) => x.id === selectedShiftId);
    if (!s) return null;
    const st = staff.find((x) => x.id === s.staffId);
    return {
      ...s,
      staffName: st?.name || "Medical Officer",
    };
  }, [selectedShiftId, shifts, staff]);

  const reportCollections = useMemo(() => {
    if (!currentReportShift) return { cash: 0, card: 0, upi: 0, insurance: 0 };
    const s = currentReportShift;
    const shiftInvoices = invoices.filter(
      (i) =>
        (i.status === "paid" || i.status === "refunded" || i.status === "partial-refund") &&
        i.paidAt &&
        i.paidAt >= s.openedAt &&
        (!s.closedAt || i.paidAt <= s.closedAt)
    );
    const methodTotals: Record<string, number> = { cash: 0, card: 0, upi: 0, insurance: 0 };
    shiftInvoices.forEach((i) => {
      const t = computeTotals(i.items, i.discount).total;
      const invoiceRefundsShift = (i.refunds || [])
        .filter((r) => r.processedAt >= s.openedAt && (!s.closedAt || r.processedAt <= s.closedAt))
        .reduce((sum, r) => sum + r.amount, 0);
      methodTotals[i.method] = (methodTotals[i.method] || 0) + (t - invoiceRefundsShift);
    });
    return methodTotals;
  }, [currentReportShift, invoices]);

  const reportRefunds = useMemo(() => {
    if (!currentReportShift) return 0;
    const s = currentReportShift;
    return invoices.reduce((sum, i) => {
      const shiftRefunds = (i.refunds || []).filter(
        (r) =>
          r.processedAt >= s.openedAt &&
          (!s.closedAt || r.processedAt <= s.closedAt)
      );
      return sum + shiftRefunds.reduce((sSum, r) => sSum + r.amount, 0);
    }, 0);
  }, [currentReportShift, invoices]);

  const reportServices = useMemo(() => {
    if (!currentReportShift) return [];
    const s = currentReportShift;
    const shiftInvoices = invoices.filter(
      (i) =>
        (i.status === "paid" || i.status === "refunded" || i.status === "partial-refund") &&
        i.paidAt &&
        i.paidAt >= s.openedAt &&
        (!s.closedAt || i.paidAt <= s.closedAt)
    );
    const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
    shiftInvoices.forEach((i) => {
      i.items.forEach((item) => {
        if (!serviceMap[item.label]) {
          serviceMap[item.label] = { name: item.label, count: 0, revenue: 0 };
        }
        serviceMap[item.label].count += item.qty || 1;
        serviceMap[item.label].revenue += item.amount;
      });
    });
    return Object.values(serviceMap)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentReportShift, invoices]);

  const reportCancellations = useMemo(() => {
    if (!currentReportShift) return {};
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled" && a.date === selectedDate
    );
    const counts: Record<string, number> = {};
    cancelled.forEach((a) => {
      const reason = a.cancellationReason || "Other";
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return counts;
  }, [currentReportShift, appointments, selectedDate]);

  // Handle printing of the selected shift report
  const handlePrintReport = () => {
    if (!currentReportShift) return;
    printDayReport({
      shift: currentReportShift,
      collections: reportCollections,
      refunds: reportRefunds,
      variance: currentReportShift.variance || 0,
      topServices: reportServices,
      cancellations: reportCancellations,
    });
  };

  return (
    <div data-testid="reports-page" className="space-y-5">
      {/* Range + Export bar */}
      <div className="surface flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
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
        <div className="text-[11.5px] text-ink-400 font-mono hidden md:block">
          Reception desk · {TODAY_STR}
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

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-ink-200 overflow-x-auto -mx-1 px-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              data-testid={`reports-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`relative h-10 px-3 sm:px-4 inline-flex items-center gap-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                active
                  ? "text-ink-900"
                  : "text-ink-400 hover:text-ink-900"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-ink-900 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: Overview */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard testId="kpi-footfall" label="Footfall" value={footfall} delta="+12% vs avg" accent={ACCENTS.footfall} icon={Users} />
            <KpiCard testId="kpi-noshow" label="No-shows" value={`${noShow} · ${noShowRate}%`} delta={noShowRate > 10 ? "above target" : "on target"} accent={ACCENTS.noshow} icon={AlertCircle} />
            <KpiCard testId="kpi-wait" label="Avg wait" value={`${avgWait} min`} delta="target ≤ 15m" accent={ACCENTS.wait} icon={Clock} />
            <KpiCard testId="kpi-revenue" label="Revenue desk" value={fmt(revenue)} delta="paid today" accent={ACCENTS.rev} icon={IndianRupee} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="lg:col-span-2 surface">
              <SectionHeader
                dot="bg-sage"
                eyebrow="Hourly footfall"
                title="Arrivals by hour"
                right={
                  <div className="text-[12px] text-ink-400 inline-flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sage" />
                    Peak {hourly.reduce((p, c) => (c.arrivals > p.arrivals ? c : p), hourly[0])?.hour}
                  </div>
                }
              />
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourly} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="g-sage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2C5E4E" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2C5E4E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E5E5E0" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#E5E5E0" }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="arrivals" stroke="#2C5E4E" strokeWidth={2} fill="url(#g-sage)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface">
              <SectionHeader dot="bg-mustard" eyebrow="Appointments" title="Status mix" />
              <div className="p-4 h-64 grid grid-cols-2 gap-3 items-stretch">
                <div className="h-full min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusMix} innerRadius="50%" outerRadius="92%" paddingAngle={2} dataKey="value" stroke="#fff" strokeWidth={2}>
                        {statusMix.map((d) => (
                          <Cell key={d.key} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1.5 text-[12.5px] self-center">
                  {statusMix.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 text-ink-600 capitalize">{s.name}</span>
                      <span className="font-mono text-ink-900">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="lg:col-span-2 surface">
              <SectionHeader dot="bg-mustard" eyebrow="Wait times" title="Distribution today" />
              <div className="p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waitDist} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="#E5E5E0" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#E5E5E0" }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#A87826" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface">
              <SectionHeader dot="bg-plum" eyebrow="Registrations" title="By source" />
              <div className="p-4 h-56 grid grid-cols-2 gap-3 items-stretch">
                <div className="h-full min-h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={registrationMix} innerRadius="45%" outerRadius="92%" paddingAngle={2} dataKey="value" stroke="#fff" strokeWidth={2}>
                        {registrationMix.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1.5 text-[12.5px] self-center">
                  {registrationMix.map((s) => (
                    <li key={s.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 text-ink-600">{s.name}</span>
                      <span className="font-mono text-ink-900">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB: Revenue */}
      {tab === "revenue" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard testId="kpi-revenue" label="Revenue desk" value={fmt(revenue)} accent={ACCENTS.rev} icon={IndianRupee} />
            <KpiCard testId="kpi-avg-bill" label="Avg invoice" value={fmt(invoices.length ? Math.round(invoices.reduce((s,i)=>s+computeTotals(i.items,i.discount).total,0)/invoices.length) : 0)} accent={ACCENTS.footfall} icon={IndianRupee} />
            <KpiCard testId="kpi-paid" label="Paid invoices" value={invoices.filter(i=>i.status==='paid'&&i.date===TODAY_STR).length} accent={ACCENTS.rev} icon={Activity} />
            <KpiCard testId="kpi-outstanding" label="Outstanding" value={fmt(invoices.filter(i=>i.status==='unpaid'&&i.date===TODAY_STR).reduce((s,i)=>s+computeTotals(i.items,i.discount).total,0))} accent={ACCENTS.noshow} icon={AlertCircle} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="lg:col-span-2 surface">
              <SectionHeader dot="bg-money" eyebrow="Trend" title="Revenue by hour (cumulative)" />
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revTrend} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="g-money" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15803D" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#15803D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E5E5E0" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#E5E5E0" }} tickLine={false} />
                    <YAxis tickFormatter={(v) => (v ? `₹${v}` : "0")} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="cumulative" stroke="#15803D" strokeWidth={2} fill="url(#g-money)" />
                    <Bar dataKey="revenue" fill="#A87826" radius={[4, 4, 0, 0]} barSize={14} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface">
              <SectionHeader dot="bg-mustard" eyebrow="Payment mix" title="By method" />
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revByMethod} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke="#E5E5E0" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => (v ? `₹${v}` : "0")} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: "#1C1C19", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {revByMethod.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="lg:col-span-3 surface">
              <SectionHeader dot="bg-money" eyebrow="By doctor" title="Revenue contribution" />
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revByDoctor} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid stroke="#E5E5E0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#1C1C19", fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#E5E5E0" }} tickLine={false} />
                    <YAxis tickFormatter={(v) => (v ? `₹${v}` : "0")} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="revenue" fill="#2C5E4E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB: Operations */}
      {tab === "operations" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard testId="kpi-footfall" label="Footfall" value={footfall} accent={ACCENTS.footfall} icon={Users} />
            <KpiCard testId="kpi-noshow" label="No-shows" value={`${noShow} · ${noShowRate}%`} accent={ACCENTS.noshow} icon={AlertCircle} />
            <KpiCard testId="kpi-wait" label="Avg wait" value={`${avgWait} min`} accent={ACCENTS.wait} icon={Clock} />
            <KpiCard testId="kpi-shifts" label="Active shifts" value={shifts.filter(s=>s.status==='open').length} accent={ACCENTS.rev} icon={Activity} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="lg:col-span-2 surface">
              <SectionHeader dot="bg-clay" eyebrow="No-shows" title="By doctor — today" />
              <ul className="divide-y divide-ink-200">
                {noShowByDoctor.map((d) => (
                  <li key={d.name} data-testid={`noshow-row-${d.name}`} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-clay-soft text-clay grid place-items-center">
                      <Stethoscope className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink-900 truncate">{d.name}</div>
                      <div className="text-[11px] text-ink-400 font-mono">{d.total} appts</div>
                    </div>
                    <div className="flex-1 max-w-[180px] h-2 bg-bone rounded-full overflow-hidden border border-ink-200">
                      <div className="h-full bg-clay" style={{ width: `${Math.min(100, d.rate)}%` }} />
                    </div>
                    <div className="w-16 text-right font-mono text-[13px] text-ink-900">{d.rate}%</div>
                    <div className="w-20 text-right text-[11px] text-ink-400 font-mono">{d.noShow}/{d.total}</div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface">
              <SectionHeader dot="bg-sage" eyebrow="Capacity" title="Doctor utilization" />
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="20%" outerRadius="100%" data={docUtilization} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar minAngle={6} background clockWise dataKey="utilization" cornerRadius={6} fill="#2C5E4E" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, p) => [`${v}% (${p.payload.booked} appts)`, p.payload.name]} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <ul className="px-4 pb-4 space-y-1 text-[12px]">
                {docUtilization.slice(0, 4).map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                    <span className="flex-1 text-ink-600">{d.name}</span>
                    <span className="font-mono text-ink-900">{d.utilization}%</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg:col-span-3 surface">
              <SectionHeader dot="bg-mustard" eyebrow="Wait time" title="Distribution buckets" />
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waitDist} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="#E5E5E0" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#1C1C19", fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#E5E5E0" }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {waitDist.map((d, i) => (
                        <Cell key={i} fill={["#15803D", "#A87826", "#B85C38", "#7A4A6B"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB: Insurance */}
      {tab === "insurance" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard testId="kpi-claims-total" label="Total claims" value={claims.length} accent={ACCENTS.footfall} icon={ShieldCheck} />
            <KpiCard testId="kpi-claims-approval" label="Approval rate" value={`${approvalRate}%`} accent={ACCENTS.rev} icon={Activity} />
            <KpiCard testId="kpi-claims-due" label="Pending value" value={fmt(claims.filter(c=>['pending','submitted'].includes(c.status)).reduce((s,c)=>s+c.requestedAmount,0))} accent={ACCENTS.wait} icon={IndianRupee} />
            <KpiCard testId="kpi-claims-rejected-amt" label="Rejected value" value={fmt(claims.filter(c=>c.status==='rejected').reduce((s,c)=>s+c.requestedAmount,0))} accent={ACCENTS.noshow} icon={AlertCircle} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="surface">
              <SectionHeader dot="bg-teal" eyebrow="Claims" title="Status mix" />
              <div className="p-4 h-72 grid grid-cols-2 gap-3 items-stretch">
                <div className="h-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={claimsByStatus} innerRadius="48%" outerRadius="92%" paddingAngle={2} dataKey="value" stroke="#fff" strokeWidth={2}>
                        {claimsByStatus.map((d) => (<Cell key={d.name} fill={d.color} />))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1.5 text-[12.5px] self-center">
                  {claimsByStatus.map((s) => (
                    <li key={s.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 text-ink-600">{s.name}</span>
                      <span className="font-mono text-ink-900">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="lg:col-span-2 surface">
              <SectionHeader dot="bg-plum" eyebrow="By provider" title="Claim value" />
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={claimsByProvider} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 12 }}>
                    <CartesianGrid stroke="#E5E5E0" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => (v ? `₹${v}` : "0")} tick={{ fontSize: 11, fill: "#8A8A86", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="provider" tick={{ fontSize: 11, fill: "#1C1C19", fontFamily: "IBM Plex Sans" }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip cursor={{ fill: "#F9F9F6" }} formatter={(v) => fmt(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="amount" fill="#2C7873" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="lg:col-span-3 surface">
              <SectionHeader dot="bg-money" eyebrow="Approval rate" title="Provider performance" />
              <ul className="divide-y divide-ink-200">
                {(() => {
                  const providers = [...new Set(claims.map((c) => c.provider))];
                  return providers.map((p) => {
                    const list = claims.filter((c) => c.provider === p);
                    const decided = list.filter((c) =>
                      ["approved", "partial", "rejected"].includes(c.status),
                    );
                    const ok = decided.filter((c) => c.status !== "rejected").length;
                    const rate = decided.length ? Math.round((ok / decided.length) * 100) : 0;
                    return (
                      <li key={p} data-testid={`provider-row-${p}`} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-soft text-teal grid place-items-center">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-ink-900 truncate">{p}</div>
                          <div className="text-[11px] text-ink-400 font-mono">{list.length} claim{list.length===1?'':'s'}</div>
                        </div>
                        <div className="flex-1 max-w-[260px] h-2 bg-bone rounded-full overflow-hidden border border-ink-200">
                          <div className="h-full bg-money" style={{ width: `${rate}%` }} />
                        </div>
                        <div className="w-16 text-right font-mono text-[13px] text-ink-900">{rate}%</div>
                      </li>
                    );
                  });
                })()}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* TAB: Shift Reports */}
      {tab === "shifts" && (
        <div className="space-y-5">
          <div className="surface p-5">
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mb-4">Shift Handover & End Reports</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-end mb-6">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-400 font-mono block mb-1.5">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    const dateShifts = shifts.filter((s) => s.date === e.target.value);
                    setSelectedShiftId(dateShifts[0]?.id || "");
                  }}
                  className="h-9 px-3 text-[13px] bg-bone border border-ink-200 rounded-md focus:outline-none focus:border-sage"
                />
              </div>
              <div className="flex-grow w-full">
                <label className="text-[11px] uppercase tracking-wider text-ink-400 font-mono block mb-1.5">Select Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-bone border border-ink-200 rounded-md focus:outline-none focus:border-sage bg-white"
                >
                  <option value="">-- Choose Shift --</option>
                  {shifts
                    .filter((s) => s.date === selectedDate)
                    .map((s) => {
                      const st = staff.find((x) => x.id === s.staffId);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.label} Shift ({s.id}) · {st?.name || "Medical Officer"} · {s.status === "open" ? "Active" : "Closed"}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {currentReportShift ? (
              <div className="border border-ink-200 rounded-lg p-5 space-y-4 bg-white">
                <div className="flex justify-between items-start border-b border-ink-200 pb-3">
                  <div>
                    <span className={`chip-${currentReportShift.status === "open" ? "mustard" : "ink"} capitalize`}>
                      {currentReportShift.status}
                    </span>
                    <h3 className="text-[16px] font-heading font-semibold text-ink-900 mt-1">
                      {currentReportShift.label} Shift Summary
                    </h3>
                    <div className="text-[11.5px] text-ink-400 font-mono mt-0.5">
                      ID: {currentReportShift.id} · Date: {currentReportShift.date}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrintReport}
                      className="btn-primary h-9 flex items-center gap-1.5 text-[12.5px]"
                    >
                      <Download className="w-4 h-4" /> Print / Export PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Financials card */}
                  <div className="border border-ink-200 rounded-lg p-4 bg-bone/20">
                    <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-3">Reconciliation & Drawer</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-ink-600">Opening Float</span>
                        <span className="font-mono text-ink-900">{fmt(currentReportShift.openingFloat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Cash Collected</span>
                        <span className="font-mono text-ink-900">{fmt(currentReportShift.cashCollected || 0)}</span>
                      </div>
                      {currentReportShift.status === "closed" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-ink-600">Expected Total</span>
                            <span className="font-mono text-ink-900">
                              {fmt(currentReportShift.openingFloat + (currentReportShift.cashCollected || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-600">Actual Counted</span>
                            <span className="font-mono text-ink-900">{fmt(currentReportShift.actualCash || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-600">Total Refunds</span>
                            <span className="font-mono text-status-noshowText">{fmt(reportRefunds || 0)}</span>
                          </div>
                          <div className="flex justify-between border-t border-ink-200 pt-2 font-semibold">
                            <span className="text-ink-900">Variance</span>
                            <span className={currentReportShift.variance === 0 ? "text-money" : currentReportShift.variance > 0 ? "text-mustard" : "text-clay"}>
                              {currentReportShift.variance >= 0 ? "+" : ""}{fmt(currentReportShift.variance || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Collections by method */}
                  <div className="border border-ink-200 rounded-lg p-4 bg-bone/20">
                    <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-3">Collections by Method</div>
                    <div className="space-y-2">
                      {Object.entries(reportCollections).map(([m, amt]) => (
                        <div key={m} className="flex justify-between font-mono">
                          <span className="capitalize text-ink-600">{m}</span>
                          <span className="text-ink-900 font-medium">{fmt(amt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top 5 Services */}
                <div className="border border-ink-200 rounded-lg p-4">
                  <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono mb-3">Top Billed Services</div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-ink-200 text-[10px] text-ink-400 font-mono uppercase">
                        <th className="pb-1">Service</th>
                        <th className="pb-1 text-right">Qty Billed</th>
                        <th className="pb-1 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {reportServices.map((s, idx) => (
                        <tr key={s.name}>
                          <td className="py-2 font-medium text-ink-900">{idx + 1}. {s.name}</td>
                          <td className="py-2 text-right font-mono">{s.count}</td>
                          <td className="py-2 text-right font-mono text-ink-900">{fmt(s.revenue)}</td>
                        </tr>
                      ))}
                      {reportServices.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-ink-400 italic">No transactions recorded in this shift.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Handover note */}
                {currentReportShift.handover && (
                  <div className="p-4 border border-mustard/30 bg-mustard-soft/40 rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-mustard font-mono font-medium block mb-1">Handover Note</span>
                    <p className="text-[13px] text-ink-900 font-medium">{currentReportShift.handover}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-ink-400 italic border border-dashed border-ink-200 rounded-lg bg-bone/35">
                No shift record selected or found for this date.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
