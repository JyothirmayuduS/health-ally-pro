import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Activity, X } from "lucide-react";
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
  Wallet,
  ShieldCheck,
  Stethoscope,
  FileText,
} from "lucide-react";

const items = [
  { to: "/reception", label: "Dashboard", icon: LayoutDashboard, end: true, dot: "bg-sage" },
  { to: "/reception/register", label: "Register", icon: UserPlus, dot: "bg-teal" },
  { to: "/reception/patients", label: "Patients", icon: Users, dot: "bg-plum" },
  { to: "/reception/appointments", label: "Appointments", icon: CalendarDays, dot: "bg-clay" },
  { to: "/reception/check-in", label: "Check-in", icon: LogIn, dot: "bg-sage" },
  { to: "/reception/queue", label: "Queue", icon: ListOrdered, dot: "bg-mustard" },
  { to: "/reception/board", label: "Doctor board", icon: Stethoscope, dot: "bg-teal" },
  { to: "/reception/token-display", label: "Display", icon: MonitorPlay, dot: "bg-ink-900" },
];

const businessItems = [
  { to: "/reception/billing", label: "Billing", icon: Receipt, dot: "bg-money" },
  { to: "/reception/cash-drawer", label: "Cash drawer", icon: Wallet, dot: "bg-mustard" },
  { to: "/reception/insurance", label: "Insurance", icon: ShieldCheck, dot: "bg-teal" },
  { to: "/reception/reports", label: "Reports", icon: FileBarChart, dot: "bg-plum" },
  { to: "/reception/day-sheet", label: "Day sheet", icon: FileText, dot: "bg-clay" },
];

const disabled = [{ label: "Settings", icon: Settings }];

const NavItem = ({ to, label, icon: Icon, end, dot, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
    className={({ isActive }) =>
      [
        "group flex items-center gap-3 pl-3 pr-3 py-2 text-[13px] rounded-md transition-colors relative",
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

function NavContent({ onClick }) {
  return (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-ink-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-sage flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-heading font-semibold text-[15px] text-ink-900 leading-none">
              Maple Hospital
            </div>
            <div className="text-[11px] text-ink-400 mt-1 uppercase tracking-wider font-mono">
              Reception · v1.2
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.12em] text-ink-400 font-mono font-medium">
          Workflow
        </div>
        {items.map((i) => (
          <NavItem key={i.to} {...i} onClick={onClick} />
        ))}

        <div className="px-2 pt-5 pb-2 text-[10px] uppercase tracking-[0.12em] text-ink-400 font-mono font-medium">
          Business
        </div>
        {businessItems.map((i) => (
          <NavItem key={i.to} {...i} onClick={onClick} />
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
            <span className="ml-auto text-[9px] font-mono bg-ink-200/50 text-ink-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
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
          <div className="text-[10.5px] text-ink-400 font-mono uppercase tracking-wider">
            Front desk · OPD
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <aside
      data-testid="app-sidebar"
      className="w-60 shrink-0 bg-deeppaper border-r border-ink-200 flex-col h-screen sticky top-0 hidden lg:flex"
    >
      <NavContent />
    </aside>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  useLocation(); // close on nav (re-renders Trigger on each route)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          data-testid="mobile-menu-btn"
          className="lg:hidden btn-icon"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-72 bg-deeppaper border-r border-ink-200"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex flex-col h-full">
          <NavContent onClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
