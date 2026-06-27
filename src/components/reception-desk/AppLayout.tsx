import { Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Sidebar, { MobileSidebarTrigger } from "./Sidebar";
import { Bell, Clock } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearchBar } from "@/components/desk-shell/GlobalSearchBar";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

const titleFromPath = (pathname: string) => {
  if (pathname === "/reception" || pathname === "/reception/")
    return { eyebrow: "Today", title: "Reception dashboard" };
  if (pathname.startsWith("/reception/register"))
    return { eyebrow: "Patient intake", title: "Register patient" };
  if (pathname.startsWith("/reception/patients"))
    return { eyebrow: "Records", title: "Patients" };
  if (pathname.startsWith("/reception/appointments/new"))
    return { eyebrow: "Scheduling", title: "New appointment" };
  if (pathname.startsWith("/reception/appointments"))
    return { eyebrow: "Scheduling", title: "Appointments" };
  if (pathname.startsWith("/reception/admissions"))
    return { eyebrow: "Inpatient", title: "Admissions & Bed Board" };
  if (pathname.startsWith("/reception/check-in"))
    return { eyebrow: "Arrivals", title: "Check-in" };
  if (pathname.startsWith("/reception/vitals"))
    return { eyebrow: "Clinical", title: "Record vitals" };
  if (pathname.startsWith("/reception/queue"))
    return { eyebrow: "Live", title: "Queue management" };
  if (pathname.startsWith("/reception/board"))
    return { eyebrow: "Live", title: "Doctor & room board" };
  if (pathname.startsWith("/reception/billing"))
    return { eyebrow: "Front desk", title: "Billing" };
  if (pathname.startsWith("/reception/cash-drawer"))
    return { eyebrow: "Front desk", title: "Cash drawer & handover" };
  if (pathname.startsWith("/reception/insurance"))
    return { eyebrow: "Front desk", title: "Insurance & pre-auth" };
  if (pathname.startsWith("/reception/day-sheet"))
    return { eyebrow: "End of day", title: "Day sheet" };
  if (pathname.startsWith("/reception/reports"))
    return { eyebrow: "Insights", title: "Reception reports" };
  return { eyebrow: "Reception", title: "Maple Hospital" };
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const { eyebrow, title } = titleFromPath(pathname);
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="reception-desk flex min-h-screen bg-paper text-ink-900">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col lg:ml-60">
        <header
          data-testid="app-topbar"
          className="print-hide sticky top-0 z-20 border-b border-ink-200 bg-paper/90 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-4 lg:px-8">
            <MobileSidebarTrigger />
            <div className="min-w-0 shrink-0">
              <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
                {eyebrow}
              </div>
              <h1 className="font-heading mt-0.5 truncate text-[18px] font-semibold leading-tight text-ink-900 sm:text-[22px]">
                {title}
              </h1>
            </div>

            <div className="hidden max-w-md flex-1 md:block">
              <GlobalSearchBar placeholder="Search patient, MRN, phone, invoice…" />
            </div>

            <div className="ml-auto flex items-center gap-3 text-[12px] sm:gap-5">
              <div className="hidden items-center gap-2 text-ink-600 md:flex">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">{time}</span>
                <span className="text-ink-400">·</span>
                <span>{date}</span>
              </div>
              <button type="button" data-testid="topbar-notif" className="btn-icon relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage" />
              </button>
            </div>
          </div>
        </header>
        <div className="animate-fade-in print-area flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
