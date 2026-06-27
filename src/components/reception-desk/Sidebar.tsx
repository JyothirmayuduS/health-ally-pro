import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Activity } from "lucide-react";
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
  Bed,
  CalendarOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/reception", label: "Dashboard", icon: LayoutDashboard, exact: true, dot: "bg-sage" },
  { to: "/reception/register", label: "Register", icon: UserPlus, dot: "bg-teal" },
  { to: "/reception/patients", label: "Patients", icon: Users, dot: "bg-plum" },
  { to: "/reception/appointments", label: "Appointments", icon: CalendarDays, dot: "bg-clay" },
  { to: "/reception/admissions", label: "Admissions & Beds", icon: Bed, dot: "bg-teal" },
  { to: "/reception/check-in", label: "Check-in", icon: LogIn, dot: "bg-sage" },
  { to: "/reception/vitals", label: "Record vitals", icon: Activity, dot: "bg-teal" },
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
  { to: "/reception/leave", label: "My Leaves", icon: CalendarOff, dot: "bg-plum" },
  { to: "/reception/settings", label: "Settings", icon: Settings, dot: "bg-ink-900" },
];


const disabled: { label: string; icon: typeof Settings }[] = [];

type NavItemProps = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  dot: string;
  onClick?: () => void;
};

function NavItem({ to, label, icon: Icon, exact, dot, onClick }: NavItemProps) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] transition-colors",
        active ? "bg-sage-soft font-medium text-sage" : "text-ink-600 hover:bg-white hover:text-ink-900",
      )}
    >
      {active && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-sage" />
      )}
      <Icon className="h-4 w-4" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      <span className={cn("h-1.5 w-1.5 rounded-full opacity-80", dot)} />
    </Link>
  );
}

function NavContent({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <div className="border-b border-ink-200 px-5 pb-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sage">
            <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-heading text-[15px] font-semibold leading-none text-ink-900">
              Maple Hospital
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-400">
              Reception · v1.2
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <div className="px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
          Workflow
        </div>
        {items.map((i) => (
          <NavItem key={i.to} {...i} onClick={onClick} />
        ))}

        <div className="px-2 pb-2 pt-5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
          Business
        </div>
        {businessItems.map((i) => (
          <NavItem key={i.to} {...i} onClick={onClick} />
        ))}

        {disabled.length > 0 && (
          <>
            <div className="px-2 pb-2 pt-5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
              Coming soon
            </div>
            {disabled.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex cursor-not-allowed items-center gap-3 py-2 pl-3 pr-3 text-[13px] text-ink-400"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span>{label}</span>
                <span className="ml-auto rounded-md bg-ink-200/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-400">
                  Soon
                </span>
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-ink-200 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-soft text-[12px] font-medium text-sage">
          RD
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-ink-900">Reena D&apos;souza</div>
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-400">
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
      className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-60 flex-col border-r border-ink-200 bg-deeppaper lg:flex"
    >
      <NavContent />
    </aside>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-testid="mobile-menu-btn"
          className="btn-icon lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-ink-200 bg-deeppaper p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <NavContent onClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
