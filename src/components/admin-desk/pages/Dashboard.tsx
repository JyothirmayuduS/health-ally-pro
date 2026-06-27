import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { loadLedgerInvoices } from "@/lib/shared/billing-ledger";
import { listEncounters } from "@/lib/shared/encounters";
import { SHARED_PATIENTS } from "@/lib/shared/patients";
import { DEFAULT_STAFF } from "@/lib/admin-desk/config";
import { loadServiceFees } from "@/lib/shared/services";
import { useAdminStore } from "@/lib/admin-desk/store";
import { getAnnouncements } from "@/lib/shared/announcements";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Banknote,
  Activity,
  FlaskConical,
  Pill,
  BedDouble,
  ClipboardList,
  MonitorPlay,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

const MODULE_COLOR: Record<string, string> = {
  reception: "bg-blue-50 text-blue-700 border-blue-200",
  lab: "bg-teal-50 text-teal-700 border-teal-200",
  pharmacy: "bg-green-50 text-green-700 border-green-200",
  ipd: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-plum-soft text-plum border-plum/20",
};

const MODULE_DOT: Record<string, string> = {
  reception: "bg-blue-500",
  lab: "bg-teal",
  pharmacy: "bg-green-500",
  ipd: "bg-purple-500",
  admin: "bg-plum",
};

function timeAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function AdminDashboard() {
  const { activityFeed } = useAdminStore();
  const invoices = useMemo(() => loadLedgerInvoices(), []);
  const encounters = useMemo(() => listEncounters(), []);
  const doctors = useMemo(() => loadServiceFees(), []);
  const revenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const announcements = useMemo(() => getAnnouncements().filter(a => a.status === "active" && a.priority !== "normal"), []);

  // Operational tiles
  const paidToday = invoices.filter(i => i.status === "paid").length;
  const unpaidInvoices = invoices.filter(i => i.status === "unpaid" || i.status === "partial").length;
  const openEncounters = encounters.filter(e => e.status === "open").length;

  // System alerts
  const systemAlerts = useMemo(() => {
    const alerts: { severity: "warning" | "critical"; message: string; link: string }[] = [];
    if (unpaidInvoices > 0) alerts.push({ severity: "warning", message: `${unpaidInvoices} unpaid invoices outstanding`, link: "/admin/revenue" });
    const urgentAnns = getAnnouncements().filter(a => a.status === "active" && (a.priority === "urgent" || a.priority === "emergency"));
    if (urgentAnns.length) alerts.push({ severity: urgentAnns.some(a => a.priority === "emergency") ? "critical" : "warning", message: `${urgentAnns.length} active urgent announcement(s)`, link: "/admin/announcements" });
    return alerts;
  }, [unpaidInvoices]);

  const quickLinks = [
    { to: "/admin/revenue", label: "Revenue cycle", icon: Banknote },
    { to: "/admin/access-control", label: "Access control", icon: ShieldAlert },
    { to: "/admin/doctor-roster", label: "Doctor roster", icon: ClipboardList },
    { to: "/admin/occupancy", label: "Occupancy & load", icon: BedDouble },
    { to: "/admin/announcements", label: "Announcements", icon: MonitorPlay },
    { to: "/admin/analytics", label: "Analytics", icon: Activity },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">

      {/* System Alerts Strip */}
      {systemAlerts.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-status-doneBorder bg-status-doneBg px-4 py-2 text-[13px] text-status-doneText">
          <CheckCircle2 className="h-4 w-4" />
          All systems normal — no active alerts requiring attention.
        </div>
      ) : (
        <div className="space-y-1.5">
          {systemAlerts.map((a, i) => (
            <Link key={i} to={a.link} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-[13px] hover:opacity-90 transition ${a.severity === "critical" ? "border-red-300 bg-red-50 text-red-800" : "border-status-waitBorder bg-status-waitBg text-status-waitText"}`}>
              <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{a.message}</div>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* KPI Row 1 — Core metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Patients", value: SHARED_PATIENTS.length, icon: Users, color: "text-plum" },
          { label: "Staff members", value: DEFAULT_STAFF.length, icon: ClipboardList, color: "text-teal" },
          { label: "Collected revenue", value: `₹${revenue.toLocaleString("en-IN")}`, icon: Banknote, color: "text-money" },
          { label: "Encounters", value: encounters.length, icon: Activity, color: "text-clay" },
        ].map((k) => (
          <div key={k.label} className="surface px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] uppercase tracking-widest text-ink-400">{k.label}</div>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </div>
            <div className={`mt-2 text-3xl font-heading font-semibold tabular-nums ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* KPI Row 2 — Operational tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open encounters", value: openEncounters, sub: "consultations active", icon: Activity, color: "text-teal" },
          { label: "Invoices paid today", value: paidToday, sub: "of total ledger", icon: Banknote, color: "text-money" },
          { label: "Outstanding invoices", value: unpaidInvoices, sub: "need collection", icon: AlertTriangle, color: "text-clay" },
          { label: "Active doctors", value: doctors.length, sub: "on service roster", icon: ClipboardList, color: "text-plum" },
        ].map((t) => (
          <div key={t.label} className="surface px-4 py-3 flex gap-3 items-start">
            <div className="mt-0.5 rounded bg-stone-100 p-1.5"><t.icon className={`h-4 w-4 ${t.color}`} /></div>
            <div>
              <div className="text-[10px] uppercase text-ink-400 tracking-wide">{t.label}</div>
              <div className={`text-2xl font-semibold tabular-nums ${t.color}`}>{t.value}</div>
              <div className="text-[11px] text-ink-400">{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout — Quick actions + Activity feed */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — Quick actions + Doctors */}
        <div className="lg:col-span-3 space-y-5">
          {/* Quick actions */}
          <div className="surface overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Quick navigation
            </div>
            <div className="grid grid-cols-2 gap-px bg-stone-100">
              {quickLinks.map((l) => (
                <Link key={l.to} to={l.to} className="group flex items-center gap-3 bg-white px-4 py-3.5 hover:bg-plum-soft/40 transition-colors">
                  <div className="w-8 h-8 rounded bg-plum-soft text-plum grid place-items-center group-hover:bg-plum group-hover:text-white transition-colors shrink-0">
                    <l.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[13px] font-medium text-ink-900">{l.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-300 group-hover:text-plum transition" />
                </Link>
              ))}
            </div>
          </div>

          {/* Doctors roster */}
          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Doctors on roster</span>
              <Link to="/admin/doctors" className="text-[12px] text-plum hover:underline">View all →</Link>
            </div>
            <ul className="divide-y divide-ink-100">
              {doctors.slice(0, 5).map((d) => (
                <li key={d.doctorId} className="flex items-center justify-between px-5 py-3 text-[13px]">
                  <div>
                    <span className="font-medium">{d.doctorName}</span>
                    <span className="ml-2 text-ink-400">{d.specialty}</span>
                  </div>
                  <span className="font-mono text-money">₹{d.fee.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — Activity feed (~35%) */}
        <div className="lg:col-span-2">
          <div className="surface overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 shrink-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Live activity feed</span>
              <span className="text-[10px] text-ink-400">{activityFeed.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-ink-100 max-h-[480px]">
              {activityFeed.map((entry) => (
                <div key={entry.id} className="px-4 py-2.5 flex gap-3 items-start">
                  <div className={`mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase border ${MODULE_COLOR[entry.module]}`}>
                    {entry.module}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-ink-700 leading-snug">{entry.action}</div>
                    <div className="text-[10px] text-ink-400 mt-0.5">{entry.staff} · {timeAgo(entry.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Urgent announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 px-1">Active announcements</div>
          {announcements.map((ann) => (
            <div key={ann.id} className={`rounded-lg border px-4 py-3 text-[13px] ${ann.priority === "emergency" ? "bg-red-50 border-red-200 text-red-900" : "bg-status-waitBg border-status-waitBorder text-status-waitText"}`}>
              <div className="font-semibold flex items-center gap-2">
                {ann.priority === "emergency" && <span className="rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase px-1.5 py-0.5">Emergency</span>}
                {ann.priority === "urgent" && <span className="rounded bg-status-waitBg text-status-waitText text-[10px] font-bold uppercase px-1.5 py-0.5 border border-status-waitBorder">Urgent</span>}
                {ann.title}
              </div>
              <div className="mt-0.5 text-[12px] opacity-80">{ann.body.slice(0, 140)}{ann.body.length > 140 ? "…" : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
