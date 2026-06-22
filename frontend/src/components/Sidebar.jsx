import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarDays,
  LogIn,
  ListOrdered,
  MonitorPlay,
  Receipt,
  FileBarChart,
  Settings,
  Activity,
} from "lucide-react";

const items = [
  { to: "/reception", label: "Dashboard", icon: LayoutDashboard, end: true, dot: "bg-sage", testId: "nav-dashboard" },
  { to: "/reception/register", label: "Register", icon: UserPlus, dot: "bg-teal", testId: "nav-register" },
  { to: "/reception/patients", label: "Patients", icon: Users, dot: "bg-plum", testId: "nav-patients" },
  { to: "/reception/appointments", label: "Appointments", icon: CalendarDays, dot: "bg-clay", testId: "nav-appointments" },
  { to: "/reception/check-in", label: "Check-in", icon: LogIn, dot: "bg-sage", testId: "nav-checkin" },
  { to: "/reception/queue", label: "Queue", icon: ListOrdered, dot: "bg-mustard", testId: "nav-queue" },
  { to: "/reception/token-display", label: "Display", icon: MonitorPlay, dot: "bg-ink-900", testId: "nav-display" },
];

const businessItems = [
  { to: "/reception/billing", label: "Billing", icon: Receipt, dot: "bg-money", testId: "nav-billing" },
  { to: "/reception/reports", label: "Reports", icon: FileBarChart, dot: "bg-plum", testId: "nav-reports" },
];

const disabled = [{ label: "Settings", icon: Settings }];

const NavItem = ({ to, label, icon: Icon, end, dot, testId }) => (
  <NavLink
    to={to}
    end={end}
    data-testid={testId}
    className={({ isActive }) =>
      [
        "group flex items-center gap-3 pl-3 pr-3 py-2 text-[13px] rounded-sm transition-colors relative",
        isActive
          ? "bg-sage-soft text-sage font-medium"
          : "text-ink-600 hover:bg-white hover:text-ink-900",
      ].join(" ")
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-sage rounded-full" />
        )}
        <Icon className="w-4 h-4" strokeWidth={2} />
        <span className="flex-1">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${dot} opacity-80`} />
      </>
    )}
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside
      data-testid="app-sidebar"
      className="w-60 shrink-0 bg-bone border-r border-ink-200 flex flex-col h-screen sticky top-0"
    >
      <div className="px-5 pt-6 pb-5 border-b border-ink-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-sage flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-heading font-semibold text-[15px] text-ink-900 leading-none">
              Maple Hospital
            </div>
            <div className="text-[11px] text-ink-400 mt-1 uppercase tracking-wider font-mono">
              Reception · v1.1
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.12em] text-ink-400 font-mono font-medium">
          Workflow
        </div>
        {items.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}

        <div className="px-2 pt-5 pb-2 text-[10px] uppercase tracking-[0.12em] text-ink-400 font-mono font-medium">
          Business
        </div>
        {businessItems.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}

        <div className="px-2 pt-5 pb-2 text-[10px] uppercase tracking-[0.12em] text-ink-400 font-mono font-medium">
          Coming soon
        </div>
        {disabled.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 pl-3 pr-3 py-2 text-[13px] text-ink-400 cursor-not-allowed"
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            <span>{label}</span>
            <span className="ml-auto text-[9px] font-mono bg-ink-200/50 text-ink-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              Soon
            </span>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-200 px-4 py-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-sage-soft flex items-center justify-center text-sage font-medium text-[12px]">
          RD
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-ink-900 truncate">Reena D&apos;souza</div>
          <div className="text-[10.5px] text-ink-400 font-mono uppercase tracking-wider">Front desk · OPD</div>
        </div>
      </div>
    </aside>
  );
}
