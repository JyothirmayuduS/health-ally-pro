import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DoctorGlobalActions } from "@/components/doctor/DoctorGlobalActions";
import { DOCTOR_CLINICAL_TOOLS, DOCTOR_PRIMARY_NAV } from "@/lib/doctor-portal-nav";
import { apkDoctor } from "@/lib/doctor-apk-data";
import { useDoctorMobileChrome } from "@/lib/doctor-mobile-chrome";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { navBadgeClass } from "@/lib/doctor-alert-tiers";
import {
  computeClinicOverview,
  formatQueueBadge,
  panelCounts,
} from "@/lib/doctor-clinic-overview";
import { cn } from "@/lib/utils";

function isActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname.startsWith(to);
}

function useNavBadges() {
  const { entries, bookingRequests, accepting, room } = useLiveQueue();
  const overview = computeClinicOverview({ accepting, room, entries, bookingRequests });
  const patients = panelCounts();

  return {
    home: formatQueueBadge(overview.homeBadge),
    homeUrgent: overview.urgentWaitingCount > 0 || overview.bookingCount > 0,
    queue: formatQueueBadge(overview.queueBadge),
    queueUrgent: overview.urgentWaitingCount > 0,
    patients: patients.urgent > 0 ? String(patients.urgent) : null,
    patientsUrgent: patients.urgent > 0,
    reports: null as string | null,
    reportsUrgent: false,
  };
}

function useReportsBadge() {
  const [count, setCount] = useState(0);
  const [critical, setCritical] = useState(false);
  useEffect(() => {
    const refresh = () => {
      import("@/lib/doctor-results-imaging").then(({ listResultDocuments, awaitingSignOffCount }) => {
        const docs = listResultDocuments();
        setCount(awaitingSignOffCount(docs));
        setCritical(docs.some((d) => d.needsReview && d.analytes?.some((a) => a.flag === "Critical")));
      });
    };
    refresh();
    window.addEventListener("medora-doctor-results-updated", refresh);
    return () => window.removeEventListener("medora-doctor-results-updated", refresh);
  }, []);
  return {
    badge: count > 0 ? (count > 9 ? "9+" : String(count)) : null,
    urgent: critical || count > 0,
  };
}

function ClinicalToolsSidebar() {
  const { pathname } = useLocation();

  return (
    <>
      <p className="mb-2 mt-5 px-3 text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">CLINICAL TOOLS</p>
      <ul className="flex flex-col gap-1">
        {DOCTOR_CLINICAL_TOOLS.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#F0DDD6] text-[#B8735D]"
                    : "text-[#8A8F8C] hover:bg-white hover:text-[#1B3B2E]",
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F5F2ED]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function NavItems({ layout }: { layout: "bottom" | "side" }) {
  const { pathname } = useLocation();
  const badges = useNavBadges();
  const reports = useReportsBadge();

  const badgeFor = (to: string) => {
    if (to === "/doctor") return badges.home;
    if (to === "/doctor/queue") return badges.queue;
    if (to === "/doctor/patients") return badges.patients;
    if (to === "/doctor/reports") return reports.badge;
    return null;
  };

  const urgentFor = (to: string) => {
    if (to === "/doctor") return badges.homeUrgent;
    if (to === "/doctor/queue") return badges.queueUrgent;
    if (to === "/doctor/patients") return badges.patientsUrgent;
    if (to === "/doctor/reports") return reports.urgent;
    return false;
  };

  return (
    <>
      {DOCTOR_PRIMARY_NAV.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(pathname, tab.to, tab.exact);
        const badge = badgeFor(tab.to);
        const urgent = urgentFor(tab.to);

        if (layout === "side") {
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                search={tab.to === "/doctor/reports" ? {} : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#F0DDD6] text-[#B8735D]"
                    : "text-[#8A8F8C] hover:bg-white hover:text-[#1B3B2E]",
                )}
              >
                <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#F5F2ED]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {badge && (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 min-w-[18px] rounded-full px-1 text-center text-[9px] font-bold",
                        navBadgeClass(urgent),
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        }

        return (
          <li key={tab.to} className="flex-1">
            <Link
              to={tab.to}
              search={tab.to === "/doctor/reports" ? {} : undefined}
              className={cn(
                "relative flex min-h-[44px] flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium",
                active ? "text-[#B8735D]" : "text-[#8A8F8C]",
              )}
            >
              <span className={cn("relative grid h-9 w-9 place-items-center rounded-full", active && "bg-[#F0DDD6]")}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {badge && (
                  <span
                    className={cn(
                      "absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full px-1 text-center text-[9px] font-bold",
                      navBadgeClass(urgent),
                    )}
                  >
                    {badge}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}

export function DoctorBottomNav() {
  const { hideTabBar } = useDoctorMobileChrome();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 w-full border-t border-[#E8E4DF] bg-white/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
        hideTabBar && "pointer-events-none translate-y-full",
      )}
      aria-label="Doctor portal"
      aria-hidden={hideTabBar}
    >
      <ul className="mx-auto flex max-w-lg items-center justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:max-w-2xl">
        <NavItems layout="bottom" />
      </ul>
    </nav>
  );
}

export function DoctorSideNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-[#E8E4DF] bg-white lg:flex xl:w-[280px]">
      <div className="border-b border-[#E8E4DF] px-5 py-6">
        <p className="font-serif text-2xl font-semibold text-[#1B3B2E]">Medora</p>
        <p className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-[#8A8F8C]">DOCTOR PORTAL</p>
        <div className="mt-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1B3B2E] text-sm font-semibold text-white">
            {apkDoctor.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1B3B2E]">{apkDoctor.shortName}</p>
            <p className="truncate text-xs text-[#B8735D]">{apkDoctor.specialty}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Doctor portal">
        <ul className="flex flex-col gap-1">
          <NavItems layout="side" />
        </ul>
        <ClinicalToolsSidebar />
      </nav>
      <div className="border-t border-[#E8E4DF] px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">QUICK ACCESS</p>
        <DoctorGlobalActions layout="sidebar" />
      </div>
    </aside>
  );
}
