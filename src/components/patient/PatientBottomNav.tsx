import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  CalendarPlus,
  Dumbbell,
  LayoutDashboard,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EXERCISE_ACTIVE_SESSION_EVENT } from "@/lib/exercise-session-store";
import { isCareRoute, isExerciseRoute, isHealthRoute } from "@/lib/patient-nav-utils";
import { isReportDetailRoute } from "@/lib/reports-utils";

const tabs = [
  { to: "/", label: "Home", icon: LayoutDashboard, match: (p: string) => p === "/" },
  {
    to: "/care",
    label: "Care",
    icon: CalendarPlus,
    match: isCareRoute,
  },
  {
    to: "/health",
    label: "Health",
    icon: Activity,
    match: isHealthRoute,
  },
  {
    to: "/diet",
    label: "Diet",
    icon: UtensilsCrossed,
    match: (p: string) => p.startsWith("/diet"),
  },
  {
    to: "/exercise",
    label: "Move",
    icon: Dumbbell,
    match: isExerciseRoute,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserRound,
    match: (p: string) => p.startsWith("/profile"),
  },
] as const;

export function PatientBottomNav() {
  const location = useLocation();
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    const onSession = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean }>).detail;
      setSessionActive(detail?.active ?? false);
    };
    window.addEventListener(EXERCISE_ACTIVE_SESSION_EVENT, onSession);
    return () => window.removeEventListener(EXERCISE_ACTIVE_SESSION_EVENT, onSession);
  }, []);

  const hideOnDetail =
    /^\/medications\/[^/]+/.test(location.pathname) ||
    /^\/care\/visits\/[^/]+/.test(location.pathname) ||
    (location.pathname.startsWith("/diet/") && location.pathname.length > "/diet/".length) ||
    (location.pathname.startsWith("/book/") && location.pathname.length > "/book/".length) ||
    isReportDetailRoute(location.pathname);

  if (hideOnDetail || sessionActive) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1.5 sm:max-w-2xl sm:px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(location.pathname);

          return (
            <Link
              key={tab.label}
              to={tab.to}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl transition-colors ${
                  active ? "bg-ink/10" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-ink" : "text-ink-muted"}`}
                  strokeWidth={active ? 2 : 1.75}
                />
              </span>
              <span
                className={`text-[9px] font-medium tracking-wide sm:text-[10px] ${
                  active ? "text-ink" : "text-ink-muted"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
