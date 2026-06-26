import { Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Bell, Clock, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { signOut } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";
import type { DeskPortalConfig } from "@/lib/desk-shell/types";
import { DeskSidebar, DeskMobileTrigger } from "./DeskSidebar";
import { GlobalSearchBar } from "./GlobalSearchBar";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  return now;
}

type Props = {
  config: DeskPortalConfig;
  children?: React.ReactNode;
};

export function DeskLayout({ config, children }: Props) {
  const { pathname } = useLocation();
  const now = useClock();
  const { eyebrow, title } = config.titleFromPath(pathname);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const ring = config.theme.searchRing;

  return (
    <div className={cn(config.wrapperClass, "flex min-h-screen bg-paper text-ink-900")}>
      <DeskSidebar config={config} />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-60">
        <header
          data-testid="desk-topbar"
          className="print-hide sticky top-0 z-20 border-b border-ink-200 bg-paper/90 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-4 lg:px-8">
            <DeskMobileTrigger config={config} />
            <div className="min-w-0 shrink-0">
              <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
                {eyebrow}
              </div>
              <h1 className="font-heading mt-0.5 truncate text-[18px] font-semibold leading-tight text-ink-900 sm:text-[22px]">
                {title}
              </h1>
            </div>

            <div className="hidden max-w-md flex-1 md:block">
              <GlobalSearchBar placeholder={config.searchPlaceholder} searchRing={ring} />
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
          {children ?? <Outlet />}
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
