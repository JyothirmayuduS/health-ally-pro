import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell,
  LayoutDashboard,
  Users,
  CalendarDays,
  ListOrdered,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { receptionist } from "@/lib/reception-mock-data";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/reception", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/reception/patients", label: "Patients", icon: Users },
  { to: "/reception/appointments", label: "Schedule", icon: CalendarDays },
  { to: "/reception/queue", label: "Queue", icon: ListOrdered },
  { to: "/reception/check-in", label: "Check-in", icon: UserCheck },
] as const;

function MedoraLogo() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D4F064]">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M16 4c-3 0-5 2.5-5 5.5 0 2 1.2 3.8 3 4.6V18h-2c-.8 0-1.5.7-1.5 1.5V21c0 .8.7 1.5 1.5 1.5h2v1.5c0 .8.7 1.5 1.5 1.5h4c.8 0 1.5-.7 1.5-1.5V22.5h2c.8 0 1.5-.7 1.5-1.5v-1.5c0-.8-.7-1.5-1.5-1.5h-2v-3.9c1.8-.8 3-2.6 3-4.6C21 6.5 19 4 16 4z"
          fill="#1C2A2E"
        />
      </svg>
    </span>
  );
}

export function ReceptionTopNav() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-[#F5F7F8] pb-2">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-4 px-4 lg:px-8">
        <Link to="/reception" className="shrink-0">
          <MedoraLogo />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 rounded-full bg-[#E0E7EB] p-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[#1C2A2E] text-white shadow-sm"
                    : "text-[#64748B] hover:text-[#1C2A2E]",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#64748B] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Messages"
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#64748B] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <div className="ml-1 flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face"
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-[#1C2A2E]">
                {receptionist.name}
              </p>
              <p className="text-[11px] text-[#94A3B8]">{receptionist.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
