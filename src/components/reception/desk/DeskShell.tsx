import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarDays,
  ClipboardCheck,
  ListOrdered,
  Monitor,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { ReceptionProvider } from "@/lib/reception-store";
import { receptionist } from "@/lib/reception-mock-data";
import { cn } from "@/lib/utils";
import "./reception.css";

const nav = [
  { to: "/reception", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/reception/register", label: "Register", icon: UserPlus },
  { to: "/reception/patients", label: "Patients", icon: Users },
  { to: "/reception/appointments", label: "Schedule", icon: CalendarDays },
  { to: "/reception/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/reception/queue", label: "Queue", icon: ListOrdered },
  { to: "/reception/token-display", label: "Display", icon: Monitor },
] as const;

export function DeskShell() {
  const { pathname } = useLocation();
  const fullscreen = pathname === "/reception/token-display";

  if (fullscreen) {
    return (
      <ReceptionProvider>
        <Outlet />
      </ReceptionProvider>
    );
  }

  return (
    <ReceptionProvider>
      <div className="reception-app rx-mesh flex min-h-dvh">
        {/* Icon rail */}
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[72px] flex-col items-center border-r border-stone-200/80 bg-white/90 py-5 backdrop-blur-xl">
          <Link
            to="/reception"
            className="mb-8 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-lg font-bold text-white shadow-lg shadow-teal-500/30"
          >
            M
          </Link>

          <nav className="flex flex-1 flex-col items-center gap-1.5" aria-label="Main">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "group relative grid h-11 w-11 place-items-center rounded-xl text-stone-400 transition-all",
                    active ? "rx-rail-active shadow-sm" : "hover:bg-stone-100 hover:text-stone-700",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-h-dvh flex-1 flex-col pl-[72px]">
          <header className="sticky top-0 z-40 flex h-[60px] items-center gap-4 border-b border-stone-200/60 bg-white/70 px-6 backdrop-blur-xl lg:px-8">
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-700">
                Front desk
              </p>
              <p className="text-sm font-semibold text-stone-800">Oak Haven Clinic</p>
            </div>

            <div className="relative mx-auto hidden max-w-md flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                placeholder="Search patients, doctors, tokens…"
                className="rx-input h-10 w-full pl-10 text-sm"
              />
            </div>

            <button
              type="button"
              className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-800"
            >
              <Bell className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 hover:bg-stone-50"
            >
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face"
                alt=""
                className="h-8 w-8 rounded-lg object-cover"
              />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-stone-800">{receptionist.name}</p>
                <p className="text-[10px] text-stone-500">{receptionist.role}</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-stone-400 sm:block" />
            </button>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </ReceptionProvider>
  );
}
