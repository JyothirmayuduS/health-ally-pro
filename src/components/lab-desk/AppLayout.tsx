import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Sidebar, { MobileSidebarTrigger } from "./Sidebar";
import { Bell, Clock, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { signOut } from "@/lib/supabase/auth";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { GlobalSearchBar } from "@/components/desk-shell/GlobalSearchBar";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

const titleFromPath = (pathname: string, isSupervisor: boolean) => {
  if (pathname === "/lab" || pathname === "/lab/")
    return isSupervisor
      ? { eyebrow: "Supervision", title: "Control desk" }
      : { eyebrow: "Bench", title: "My bench" };
  if (pathname.startsWith("/lab/my-submissions"))
    return { eyebrow: "Results", title: "My submissions" };
  if (pathname.startsWith("/lab/orders"))
    return { eyebrow: "Worklist", title: "Orders inbox" };
  if (pathname.startsWith("/lab/collection"))
    return { eyebrow: "Phlebotomy", title: "Collection queue" };
  if (pathname.startsWith("/lab/processing"))
    return { eyebrow: "Analyzer", title: "Processing bench" };
  if (pathname.startsWith("/lab/validation"))
    return { eyebrow: "Supervisor", title: "Validation & release" };
  if (pathname.startsWith("/lab/walk-in"))
    return { eyebrow: "Front desk", title: "Walk-in registration" };
  if (pathname.startsWith("/lab/team"))
    return { eyebrow: "Admin", title: "Team & roles" };
  if (pathname.startsWith("/lab/catalog"))
    return { eyebrow: "Reference", title: "Test catalog" };
  if (pathname.startsWith("/lab/samples"))
    return {
      eyebrow: "Specimens",
      title: isSupervisor ? "All samples" : "My samples",
    };
  if (pathname.startsWith("/lab/radiology"))
    return { eyebrow: "Imaging", title: "Radiology queue" };
  if (pathname.startsWith("/lab/reports"))
    return { eyebrow: "Insights", title: "Lab reports" };
  if (pathname.startsWith("/lab/qc"))
    return { eyebrow: "Quality", title: "QC Run Registry" };
  if (pathname.startsWith("/lab/reagents"))
    return { eyebrow: "Inventory", title: "Reagent & Consumables" };
  if (pathname.startsWith("/lab/storage"))
    return { eyebrow: "Specimens", title: "Storage & Aliquots" };
  if (pathname.startsWith("/lab/settings"))
    return { eyebrow: "Operations", title: "Lab settings" };
  return { eyebrow: "Laboratory", title: "Maple Hospital" };
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const now = useClock();
  const { email, isSupervisor } = useLabAuth();
  const { eyebrow, title } = titleFromPath(pathname, isSupervisor);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="lab-desk reception-desk flex min-h-screen bg-paper text-ink-900">
      <Sidebar />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-60">
        <header
          data-testid="lab-topbar"
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
              <GlobalSearchBar placeholder="Search order, MRN, patient, invoice…" />
            </div>

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
              <button type="button" data-testid="topbar-notif" className="btn-icon relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage" />
              </button>
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
