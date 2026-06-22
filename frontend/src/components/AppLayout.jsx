import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Search, Bell, Clock } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

const titleFromPath = (pathname) => {
  if (pathname === "/reception" || pathname === "/reception/") {
    return { eyebrow: "Today", title: "Reception dashboard" };
  }
  if (pathname.startsWith("/reception/register"))
    return { eyebrow: "Patient intake", title: "Register patient" };
  if (pathname.startsWith("/reception/patients"))
    return { eyebrow: "Records", title: "Patients" };
  if (pathname.startsWith("/reception/appointments/new"))
    return { eyebrow: "Scheduling", title: "New appointment" };
  if (pathname.startsWith("/reception/appointments"))
    return { eyebrow: "Scheduling", title: "Appointments" };
  if (pathname.startsWith("/reception/check-in"))
    return { eyebrow: "Arrivals", title: "Check-in" };
  if (pathname.startsWith("/reception/queue"))
    return { eyebrow: "Live", title: "Queue management" };
  if (pathname.startsWith("/reception/billing"))
    return { eyebrow: "Front desk", title: "Billing" };
  if (pathname.startsWith("/reception/cash-drawer"))
    return { eyebrow: "Front desk", title: "Cash drawer & handover" };
  if (pathname.startsWith("/reception/insurance"))
    return { eyebrow: "Front desk", title: "Insurance & pre-auth" };
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
    <div className="flex min-h-screen bg-bone text-ink-900">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header
          data-testid="app-topbar"
          className="sticky top-0 z-20 bg-bone/90 backdrop-blur-sm border-b border-ink-200"
        >
          <div className="flex items-center gap-6 px-8 py-4">
            <div className="min-w-0">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                {eyebrow}
              </div>
              <h1 className="text-[22px] font-heading font-semibold text-ink-900 leading-tight mt-0.5">
                {title}
              </h1>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  data-testid="global-search"
                  type="text"
                  placeholder="Search patient, MRN, phone…"
                  className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage placeholder:text-ink-400"
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-5 text-[12px]">
              <div className="flex items-center gap-2 text-ink-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{time}</span>
                <span className="text-ink-400">·</span>
                <span>{date}</span>
              </div>
              <button
                data-testid="topbar-notif"
                className="relative w-8 h-8 grid place-items-center text-ink-600 hover:text-ink-900 hover:bg-white rounded-sm border border-transparent hover:border-ink-200 transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sage animate-pulse-dot" />
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 px-8 py-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
