import { useState, useMemo } from "react";
import {
  MONTHLY_REVENUE,
  TOP_TESTS,
  TOP_DIAGNOSES,
  OPD_VISIT_TYPES,
  REPEAT_PATIENT_RATE,
  IPD_LENGTH_OF_STAY,
  WEEKLY_APPT_STATUS,
} from "@/lib/admin-desk/analyticsData";
import { loadLedgerInvoices } from "@/lib/shared/billing-ledger";
import { listEncounters } from "@/lib/shared/encounters";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { listVitals } from "@/lib/nursing-desk/vitals";
import { DeskKpi, DeskPanel } from "@/components/desk-shell/ui";
import { Calendar, Download, RefreshCw, BarChart2, PieChart as PieIcon, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RANGES = ["7 Days", "30 Days", "90 Days", "12 Months"] as const;
type DateRange = (typeof RANGES)[number];

const COLORS = ["#2c7873", "#2c5e4e", "#a87826", "#b85c38", "#5a3e85", "#1a5f7a"];

function inrFmt(v: number) {
  return `₹${v.toLocaleString("en-IN")}`;
}

function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.map(val => `"${val}"`).join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("12 Months");

  // Load basic lists from stores
  const invoices = useMemo(() => loadLedgerInvoices(), []);
  const encounters = useMemo(() => listEncounters(), []);
  const vitals = useMemo(() => listVitals(), []);

  // Filter multiplier depending on selected date range to simulate filtering
  const multiplier = useMemo(() => {
    switch (dateRange) {
      case "7 Days": return 0.22;
      case "30 Days": return 0.45;
      case "90 Days": return 0.70;
      default: return 1.0;
    }
  }, [dateRange]);

  // KPIs
  const totalRevenue = useMemo(() => {
    return Math.round(invoices.reduce((s, i) => s + i.amountPaid, 0) * multiplier);
  }, [invoices, multiplier]);

  const patientCount = useMemo(() => {
    return Math.round(SHARED_PATIENTS.length * (dateRange === "12 Months" ? 1.0 : multiplier * 1.5));
  }, [dateRange, multiplier]);

  const encountersCount = useMemo(() => {
    return Math.round(encounters.length * multiplier);
  }, [encounters, multiplier]);

  // 1. Monthly revenue trend data
  const revenueTrendData = useMemo(() => {
    const monthsToShow = dateRange === "7 Days" ? 2 : dateRange === "30 Days" ? 4 : dateRange === "90 Days" ? 6 : 12;
    return MONTHLY_REVENUE.slice(-monthsToShow);
  }, [dateRange]);

  // 2. Top tests data
  const topTestsData = useMemo(() => {
    return TOP_TESTS.map(t => ({
      name: t.name.length > 20 ? t.name.slice(0, 18) + "..." : t.name,
      count: Math.round(t.count * multiplier),
    })).slice(0, 8);
  }, [multiplier]);

  // 3. Top diagnoses data
  const topDiagnosesData = useMemo(() => {
    return TOP_DIAGNOSES.map(d => ({
      name: d.name.length > 20 ? d.name.slice(0, 18) + "..." : d.name,
      count: Math.round(d.count * multiplier),
    })).slice(0, 8);
  }, [multiplier]);

  // 4. OPD visit mix
  const opdVisitData = useMemo(() => {
    return OPD_VISIT_TYPES.map(v => ({
      type: v.type,
      count: Math.round(v.count * multiplier),
      color: v.color,
    }));
  }, [multiplier]);

  // 7. Stacked Appt Status
  const apptStatusData = useMemo(() => {
    const weeksToShow = dateRange === "7 Days" ? 2 : dateRange === "30 Days" ? 4 : 8;
    return WEEKLY_APPT_STATUS.slice(-weeksToShow);
  }, [dateRange]);

  return (
    <div className="space-y-6" data-testid="admin-analytics">
      {/* Date Range Selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-bone/30 p-4 border border-ink-100 rounded-lg surface">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-ink-500" />
          <span className="text-[13px] font-semibold text-ink-700">Analytics Range:</span>
        </div>
        <div className="flex gap-1 bg-stone-100 p-0.5 rounded">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`rounded px-3 py-1 text-[11px] font-medium transition-all ${
                dateRange === r ? "bg-white shadow-sm text-ink-950" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DeskKpi label="Patients Admitted/Registered" value={patientCount} />
        <DeskKpi label="Total Encounters" value={encountersCount} />
        <DeskKpi label="Total Vitals Logged" value={Math.round(vitals.length * multiplier)} />
        <div className="surface px-5 py-4 border-l-4 border-l-teal">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
            Collected Revenue
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-[32px] font-heading font-semibold leading-none text-money tabular-nums">
              {inrFmt(totalRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Monthly revenue trend (Line/Area chart) */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-teal" />
              Revenue Collections Trend
            </span>
            <button
              onClick={() =>
                downloadCSV(
                  "revenue_trend.csv",
                  ["Month", "Invoiced", "Collected"],
                  revenueTrendData.map((d) => [d.month, d.invoiced, d.collected])
                )
              }
              className="p-1 hover:bg-stone-100 rounded"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-ink-400 hover:text-ink-600" />
            </button>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a87826" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a87826" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2c7873" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2c7873" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => inrFmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="invoiced" stroke="#a87826" fillOpacity={1} fill="url(#colorInvoiced)" name="Invoiced Amount" />
                <Area type="monotone" dataKey="collected" stroke="#2c7873" fillOpacity={1} fill="url(#colorCollected)" name="Collected Amount" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Top 10 tests (Horizontal Bar chart) */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 text-teal" />
              Top Prescribed Lab Tests
            </span>
            <button
              onClick={() =>
                downloadCSV(
                  "top_tests.csv",
                  ["Test Name", "Volume"],
                  topTestsData.map((d) => [d.name, d.count])
                )
              }
              className="p-1 hover:bg-stone-100 rounded"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-ink-400 hover:text-ink-600" />
            </button>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTestsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9.5 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2c5e4e" name="Orders Volume" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Top 10 diagnoses */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 text-plum" />
              Top Clinical Diagnoses
            </span>
            <button
              onClick={() =>
                downloadCSV(
                  "top_diagnoses.csv",
                  ["Diagnosis", "Encounters Count"],
                  topDiagnosesData.map((d) => [d.name, d.count])
                )
              }
              className="p-1 hover:bg-stone-100 rounded"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-ink-400 hover:text-ink-600" />
            </button>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDiagnosesData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9.5 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#5a3e85" name="Diagnosis Cases" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. OPD visit mix (Donut chart) */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1">
              <PieIcon className="h-3.5 w-3.5 text-mustard" />
              OPD Check-In Breakdown
            </span>
            <button
              onClick={() =>
                downloadCSV(
                  "opd_visit_types.csv",
                  ["Visit Type", "Count"],
                  opdVisitData.map((d) => [d.type, d.count])
                )
              }
              className="p-1 hover:bg-stone-100 rounded"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-ink-400 hover:text-ink-600" />
            </button>
          </div>
          <div className="flex items-center gap-4 px-6 py-6 h-64">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opdVisitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="type"
                  >
                    {opdVisitData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 shrink-0">
              {opdVisitData.map((d, index) => (
                <div key={d.type} className="flex items-center gap-2 text-[12px]">
                  <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-ink-600 font-medium">{d.type}</span>
                  <span className="font-mono text-ink-400">({d.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Repeat Patient Rate + 6. IPD Length of stay */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-clay" />
              IPD Ward Bed Turnaround (LoS)
            </span>
            <button
              onClick={() =>
                downloadCSV(
                  "ipd_los.csv",
                  ["Ward Tier", "Average Length of Stay (Days)"],
                  IPD_LENGTH_OF_STAY.map((d) => [d.tier, d.avgDays])
                )
              }
              className="p-1 hover:bg-stone-100 rounded"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-ink-400 hover:text-ink-600" />
            </button>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={IPD_LENGTH_OF_STAY} margin={{ left: -15, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v} days`} />
                <Bar dataKey="avgDays" name="Avg Stay Length (Days)" radius={[3, 3, 0, 0]}>
                  {IPD_LENGTH_OF_STAY.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Appointment status (Stacked bar) */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 text-teal" />
              Weekly Appointment Funnel Status
            </span>
            <button
              onClick={() =>
                downloadCSV(
                  "appointment_statuses.csv",
                  ["Week", "Scheduled", "Completed", "Cancelled", "No Show"],
                  apptStatusData.map((d) => [d.week, d.scheduled, d.completed, d.cancelled, d.noShow])
                )
              }
              className="p-1 hover:bg-stone-100 rounded"
              title="Export CSV"
            >
              <Download className="h-4 w-4 text-ink-400 hover:text-ink-600" />
            </button>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apptStatusData} margin={{ left: -15, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#2c7873" name="Completed" />
                <Bar dataKey="scheduled" stackId="a" fill="#a87826" name="Scheduled" />
                <Bar dataKey="noShow" stackId="a" fill="#b85c38" name="No Show" />
                <Bar dataKey="cancelled" stackId="a" fill="#d6d1c2" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Repeat patient rate stats card */}
      <div className="surface p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-heading font-semibold text-[15px] text-ink-950">Loyalty & Retention Index</h4>
          <p className="text-[12.5px] text-ink-500 mt-0.5">
            Percentage of active registry patients returning for follow-ups or repeating consultations.
          </p>
        </div>
        <div className="flex gap-6 items-center shrink-0">
          <div className="text-center">
            <div className="text-[10px] uppercase font-mono tracking-wider text-ink-400">Current Rate</div>
            <div className="text-3xl font-semibold text-teal">{REPEAT_PATIENT_RATE.current}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase font-mono tracking-wider text-ink-400">Previous Quarter</div>
            <div className="text-2xl font-semibold text-ink-400">{REPEAT_PATIENT_RATE.previous}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
