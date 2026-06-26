import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  CalendarPlus,
  Dumbbell,
  LayoutDashboard,
  Menu,
  Search,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isCareRoute, isHealthRoute, isPatientHubRoute } from "@/lib/patient-nav-utils";
import { isReportDetailRoute } from "@/lib/reports-utils";
import { fetchPatientProfile } from "@/lib/supabase/queries";
import { PatientSyncProvider } from "@/components/patient/PatientSyncProvider";
import { PatientBottomNav } from "@/components/patient/PatientBottomNav";
import { PatientCommandPalette } from "@/components/patient/PatientCommandPalette";
import { openPatientSearch } from "@/lib/patient-search";
import { PATIENT_MENU_OPEN_EVENT } from "@/lib/patient-shell-events";
import { unreadNotificationCount } from "@/lib/patient-notifications-store";
import { Toaster } from "@/components/ui/sonner";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/care", label: "Care", icon: CalendarPlus },
  { to: "/health", label: "Health", icon: Activity },
  { to: "/diet", label: "Diet", icon: UtensilsCrossed },
  { to: "/exercise", label: "Move", icon: Dumbbell },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState({ name: "Guest", initials: "G" });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchPatientProfile().then((p) => setPatient({ name: p.name, initials: p.initials }));
    setUnreadCount(unreadNotificationCount());
    const onNotif = () => setUnreadCount(unreadNotificationCount());
    window.addEventListener("medora-notifications-changed", onNotif);
    return () => window.removeEventListener("medora-notifications-changed", onNotif);
  }, []);

  useEffect(() => {
    const onMenu = () => setOpen(true);
    window.addEventListener(PATIENT_MENU_OPEN_EVENT, onMenu);
    return () => window.removeEventListener(PATIENT_MENU_OPEN_EVENT, onMenu);
  }, []);

  const isHome = location.pathname === "/";
  const isProfile = location.pathname.startsWith("/profile");
  const isCare = isCareRoute(location.pathname);
  const isHealth = isHealthRoute(location.pathname);
  const isMedDetail = /^\/medications\/[^/]+/.test(location.pathname);
  const isDietDetail =
    location.pathname.startsWith("/diet/") && location.pathname.length > "/diet/".length;
  const isBookDetail =
    location.pathname.startsWith("/book/") && location.pathname.length > "/book/".length;
  const isReportDetail = isReportDetailRoute(location.pathname);
  const isChefChat = location.pathname === "/diet/chef";
  const isDietMealPage =
    /^\/diet\/[^/]+$/.test(location.pathname) && location.pathname !== "/diet/chef";
  const isExerciseDetail =
    location.pathname.startsWith("/exercise/") && location.pathname.length > "/exercise/".length;
  const hideTopHeader = isPatientHubRoute(location.pathname);

  return (
    <div className="patient-shell hide-scrollbar min-h-dvh bg-[#F9F7F2] text-foreground">
      <PatientSyncProvider />
      <PatientCommandPalette />
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar p-6 lg:flex">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : item.to === "/care"
                  ? isCareRoute(location.pathname)
                  : item.to === "/health"
                    ? isHealthRoute(location.pathname)
                    : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="nav-item text-sm font-medium"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-border bg-surface p-5">
          <p className="label-eyebrow">Need help</p>
          <p className="mt-2 font-serif text-lg leading-tight">
            Speak with a care concierge.
          </p>
          <Link
            to="/profile/messages"
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-clay transition-colors hover:text-ink"
          >
            Start chat →
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar p-6 pt-[max(1.5rem,env(safe-area-inset-top))] animate-slide-in">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-ink-muted hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : item.to === "/care"
                      ? isCareRoute(location.pathname)
                      : item.to === "/health"
                        ? isHealthRoute(location.pathname)
                        : location.pathname.startsWith(item.to);
                return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="nav-item text-sm font-medium"
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {!hideTopHeader && (
        <header className="sticky top-0 z-30 border-b border-border bg-[#F9F7F2]/90 backdrop-blur-sm pt-[env(safe-area-inset-top)] lg:block">
          <div className="flex items-center gap-4 px-6 py-4 lg:px-10">
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-border p-2 text-ink-muted hover:bg-surface-2 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openPatientSearch()}
              className="relative flex-1 max-w-md rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-left text-sm text-ink-muted md:hidden"
              aria-label="Search"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              Search doctors, reports, meds…
            </button>
            <button
              type="button"
              onClick={() => openPatientSearch()}
              className="relative hidden flex-1 max-w-md md:block"
              aria-label="Search"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <span className="block w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-left text-sm text-ink-muted">
                Search doctors, reports, meds…
                <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-ink-muted lg:inline">
                  ⌘K
                </kbd>
              </span>
            </button>
            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/profile/notifications"
                aria-label="Notifications"
                className="relative rounded-full border border-border bg-surface p-2.5 text-ink transition-colors hover:bg-surface-2"
              >
                <Bell className="h-4 w-4" strokeWidth={1.75} />
                {unreadCount > 0 ? (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-clay animate-pulse-soft" />
                ) : null}
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 transition-colors hover:bg-surface-2"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-clay-soft font-serif text-sm text-ink">
                  {patient.initials}
                </span>
                <span className="hidden text-sm font-medium sm:inline">
                  {patient.name.split(" ")[0]}
                </span>
              </Link>
            </div>
          </div>
        </header>
        )}

        <main
          className={cn(
            "w-full",
            hideTopHeader
              ? cn(
                  "px-5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-10 lg:pt-8 xl:px-12",
                  isMedDetail || isDietDetail || isBookDetail || isReportDetail || isExerciseDetail
                    ? isChefChat
                      ? "flex min-h-dvh flex-col px-0 py-0"
                      : isDietMealPage || isExerciseDetail
                        ? "px-0 py-0 pb-0"
                        : "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10"
                    : "pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10",
                )
              : "px-6 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-10 lg:py-10 lg:pb-10",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full",
              isChefChat
                ? "flex h-full min-h-dvh flex-1 flex-col"
                : isDietMealPage || isExerciseDetail
                  ? "w-full max-w-none"
                  : "max-w-6xl",
            )}
          >
            <Outlet />
          </div>
        </main>

        <PatientBottomNav />
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-primary-foreground">
        <span className="font-serif text-lg leading-none">M</span>
      </span>
      <span>
        <span className="block font-serif text-xl leading-none tracking-tight">
          Medora
        </span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          Care · Curated
        </span>
      </span>
    </Link>
  );
}
