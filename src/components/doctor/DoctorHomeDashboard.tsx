import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  Users,
} from "lucide-react";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { computeClinicOverview, panelCounts } from "@/lib/doctor-clinic-overview";
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import { DoctorAuthoritativeWorkQueue } from "@/components/doctor/DoctorAuthoritativeWorkQueue";
import { DoctorClinicOnboardingBanner } from "@/components/doctor/DoctorClinicOnboardingBanner";
import { DoctorClinicOverviewCollapsible } from "@/components/doctor/prescriptions/PrescriptionMobileCdssDrawer";
import { DoctorHomeNextActions } from "@/components/doctor/DoctorHomeNextActions";
import { DoctorHomeTriage } from "@/components/doctor/DoctorHomeTriage";
import { DoctorResultsInboxStrip } from "@/components/doctor/DoctorResultsInboxStrip";
import { DoctorTodayTimeline } from "@/components/doctor/DoctorTodayTimeline";

function panelHealthItems() {
  return [
    {
      id: "hba1c",
      label: "HbA1c overdue (>90 days)",
      count: PANEL_PATIENTS.filter((p) => p.alert?.includes("HbA1c")).length,
      dot: "#C45C4A",
      filter: { view: "urgent" as const, category: "all" as const },
    },
    {
      id: "htn",
      label: "Hypertensive — not seen 60+ days",
      count: PANEL_PATIENTS.filter((p) => p.condition === "Hypertension" && p.categories.includes("follow-up")).length,
      dot: "#E9A820",
      filter: { view: "panel" as const, category: "follow-up" as const },
    },
    {
      id: "labs",
      label: "Pending investigation results",
      count: PANEL_PATIENTS.filter((p) => p.pills.some((x) => x.includes("Lab") || x.includes("Result"))).length,
      dot: "#B8735D",
      filter: { view: "panel" as const, category: "all" as const },
    },
    {
      id: "rx",
      label: "Prescriptions expiring (<7 days)",
      count: PANEL_PATIENTS.filter((p) => p.pills.some((x) => x.includes("Rx"))).length,
      dot: "#E9A820",
      filter: { view: "panel" as const, category: "all" as const },
    },
  ].filter((x) => x.count > 0);
}

export function DoctorHomeDashboard() {
  const { entries, bookingRequests, accepting, room } = useLiveQueue();
  const overview = computeClinicOverview({ accepting, room, entries, bookingRequests });
  const counts = panelCounts();
  const panelHealth = panelHealthItems();

  const kpiCards = [
    {
      label: "In line",
      value: String(overview.inLine),
      hint: `${overview.waiting} waiting`,
      to: "/doctor/queue" as const,
      Icon: Clock,
      iconBg: "#F0DDD6",
      color: "#B8735D",
    },
    {
      label: "Completed",
      value: String(overview.completedToday),
      hint: "Today",
      to: "/doctor/queue" as const,
      Icon: Calendar,
      iconBg: "#EDEAE6",
      color: "#1B3B2E",
    },
    {
      label: "Open tasks",
      value: String(overview.openTasksCount),
      hint: "Needs action",
      to: "/doctor/patients/tasks" as const,
      Icon: ClipboardList,
      iconBg: "#F0DDD6",
      color: "#B8735D",
    },
    {
      label: "Panel",
      value: String(counts.panel),
      hint: `${counts.urgent} urgent`,
      to: "/doctor/patients" as const,
      search: { view: "panel" as const, category: "all" as const },
      Icon: Users,
      iconBg: "#E8EFE6",
      color: "#1B3B2E",
    },
  ];

  return (
    <div className="space-y-5">
      <DoctorClinicOnboardingBanner />

      {/* Now — live triage */}
      <DoctorHomeTriage layout="grid" />

      {/* Authoritative work queue — top 3 */}
      <DoctorAuthoritativeWorkQueue limit={3} />

      {/* Collapsible clinic overview — KPIs, panel health, timeline */}
      <DoctorClinicOverviewCollapsible>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpiCards.map(({ label, value, hint, to, search, Icon, iconBg, color }) => (
            <Link
              key={label}
              to={to}
              search={search}
              className="rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className="mb-3 grid h-10 w-10 place-items-center rounded-xl"
                style={{ backgroundColor: iconBg }}
              >
                <Icon className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
              </span>
              <p className="text-2xl font-bold tabular-nums" style={{ color }}>
                {value}
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#1B3B2E]">{label}</p>
              <p className="text-xs text-[#8A8F8C]">{hint}</p>
            </Link>
          ))}
        </div>

        <DoctorHomeNextActions />

        <div className="grid gap-4 xl:grid-cols-2">
          {panelHealth.length > 0 && (
            <section className="rounded-2xl border border-[#EDEAE6] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#1B3B2E]">Panel health</h3>
                <Link to="/doctor/patients" className="text-xs font-semibold text-[#B8735D]">
                  View panel
                </Link>
              </div>
              <ul className="mt-3 divide-y divide-[#F0EDE9]">
                {panelHealth.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/doctor/patients"
                      search={item.filter}
                      className="flex items-center gap-3 py-3 hover:opacity-80"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.dot }} />
                      <span className="min-w-0 flex-1 text-sm text-[#1B3B2E]">{item.label}</span>
                      <span className="text-sm font-semibold text-[#1B3B2E]">{item.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <DoctorResultsInboxStrip />
        </div>

        {overview.urgentWaitingCount > 0 && (
          <Link
            to="/doctor/queue"
            className="flex items-center gap-3 rounded-2xl border border-[#FCE8E6] bg-[#FCE8E6]/40 px-5 py-3.5 hover:bg-[#FCE8E6]/60"
          >
            <AlertTriangle className="h-5 w-5 text-[#C45C4A]" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1B3B2E]">
                {overview.urgentWaitingCount} urgent patient{overview.urgentWaitingCount > 1 ? "s" : ""} in queue
              </p>
              <p className="text-sm text-[#8A8F8C]">Open live queue to call next</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#B8735D]" />
          </Link>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">TODAY&apos;S TIMELINE</h2>
            <Link to="/doctor/schedule" className="text-[11px] font-semibold text-[#B8735D]">
              Full schedule
            </Link>
          </div>
          <DoctorTodayTimeline />
        </section>
      </DoctorClinicOverviewCollapsible>
    </div>
  );
}
