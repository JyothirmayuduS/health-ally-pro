import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Sidebar, { MobileSidebarTrigger } from "./Sidebar";
import { Bell, Clock, LogOut, X } from "lucide-react";
import { GlobalSearchBar } from "@/components/desk-shell/GlobalSearchBar";
import { Toaster } from "@/components/ui/sonner";
import { signOut } from "@/lib/supabase/auth";
import { usePharmacyAuth } from "@/lib/pharmacy-desk/usePharmacyAuth";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

const titleFromPath = (pathname: string) => {
  if (pathname === "/pharmacy" || pathname === "/pharmacy/")
    return { eyebrow: "Pharmacy", title: "Control desk" };
  if (pathname.startsWith("/pharmacy/prescriptions"))
    return { eyebrow: "Queue", title: "Prescriptions inbox" };
  if (pathname.startsWith("/pharmacy/billing"))
    return { eyebrow: "Counter", title: "Billing" };
  if (pathname.startsWith("/pharmacy/dispense"))
    return { eyebrow: "Counter", title: "Dispense" };
  if (pathname.startsWith("/pharmacy/refills"))
    return { eyebrow: "Ongoing", title: "Refills" };
  if (pathname.startsWith("/pharmacy/search"))
    return { eyebrow: "Lookup", title: "Medicine search" };
  if (pathname.startsWith("/pharmacy/inventory"))
    return { eyebrow: "Stock", title: "Inventory" };
  if (pathname.startsWith("/pharmacy/formulary"))
    return { eyebrow: "Catalog", title: "Formulary & pricing" };
  if (pathname.startsWith("/pharmacy/map"))
    return { eyebrow: "Storage", title: "Shelf map" };
  if (pathname.startsWith("/pharmacy/controlled"))
    return { eyebrow: "Compliance", title: "Controlled register" };
  if (pathname.startsWith("/pharmacy/operations"))
    return { eyebrow: "Insights", title: "Operations center" };
  if (pathname.startsWith("/pharmacy/ward"))
    return { eyebrow: "IPD", title: "Ward deliveries" };
  if (pathname.startsWith("/pharmacy/walk-in"))
    return { eyebrow: "Counter", title: "Walk-in OTC" };
  if (pathname.startsWith("/pharmacy/cycle-count"))
    return { eyebrow: "Stock", title: "Cycle count" };
  if (pathname.startsWith("/pharmacy/reports"))
    return { eyebrow: "Insights", title: "Operations center" };
  return { eyebrow: "Pharmacy", title: "Oak Haven Pharmacy" };
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const now = useClock();
  const { email } = usePharmacyAuth();
  const { alerts, dismissAlert } = usePharmacyStore();
  const { eyebrow, title } = titleFromPath(pathname);
  const [notifOpen, setNotifOpen] = useState(false);
  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="pharmacy-desk reception-desk flex min-h-screen bg-paper text-ink-900">
      <Sidebar />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-60">
        <header
          data-testid="pharmacy-topbar"
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

            <GlobalSearchBar
              className="hidden max-w-md flex-1 md:block"
              placeholder="Search patient, MRN, invoice, Rx…"
              searchRing="focus:border-mustard focus:ring-mustard"
            />

            <div className="ml-auto flex items-center gap-3 text-[12px] sm:gap-5">
              <div className="hidden items-center gap-2 text-ink-600 md:flex">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">{time}</span>
                <span className="text-ink-400">·</span>
                <span>{date}</span>
              </div>
              {email && (
                <span className="hidden text-[11px] text-ink-400 lg:inline">{email}</span>
              )}
              <div className="relative">
                <button
                  type="button"
                  className="btn-icon relative"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 font-mono text-[9px] font-bold text-white">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-ink-200 bg-white shadow-lg">
                      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
                        <span className="font-heading text-[14px] font-semibold">Alerts</span>
                        <button type="button" onClick={() => setNotifOpen(false)} className="rounded p-1 hover:bg-stone-100">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {activeAlerts.length === 0 ? (
                          <p className="px-4 py-6 text-center text-[13px] text-ink-400">All clear.</p>
                        ) : (
                          activeAlerts.map((a) => (
                            <div key={a.id} className="border-b border-ink-100 px-4 py-3 text-[12px]">
                              <div className="font-medium text-ink-900">{a.title}</div>
                              <p className="mt-0.5 text-ink-500">{a.body}</p>
                              <div className="mt-2 flex gap-2">
                                {a.action_to && (
                                  <Link to={a.action_to} onClick={() => setNotifOpen(false)} className="text-[11px] font-medium text-mustard hover:underline">
                                    {a.action_label}
                                  </Link>
                                )}
                                <button type="button" onClick={() => dismissAlert(a.id)} className="text-[11px] text-ink-400 hover:text-ink-600">
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Link to="/pharmacy/operations" onClick={() => setNotifOpen(false)} className="block border-t border-ink-200 px-4 py-2.5 text-center text-[12px] font-medium text-mustard hover:bg-stone-50">
                        Open operations center
                      </Link>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                className="btn-icon"
                title="Sign out"
                onClick={() => signOut().then(() => (window.location.href = "/login"))}
              >
                <LogOut className="h-4 w-4" />
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
