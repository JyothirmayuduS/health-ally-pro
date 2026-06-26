import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarDays,
  ClipboardCheck,
  ListOrdered,
  Monitor,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/reception", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/reception/register", label: "Register", icon: UserPlus },
  { to: "/reception/patients", label: "Patients", icon: Users },
  { to: "/reception/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/reception/check-in", label: "Check-in", icon: ClipboardCheck },
  { to: "/reception/queue", label: "Queue", icon: ListOrdered },
  { to: "/reception/token-display", label: "TV Display", icon: Monitor },
] as const;

export function DeskSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-zinc-800 bg-[#09090B]">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
          M
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Medora Desk</p>
          <p className="text-[11px] text-zinc-500">Reception</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Reception">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-zinc-800/80 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  active
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-300",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <Link
          to="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900">
            <LogOut className="h-4 w-4" />
          </span>
          Sign out
        </Link>
      </div>
    </aside>
  );
}
