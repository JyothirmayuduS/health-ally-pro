import { Link, useLocation } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, FlaskConical, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLabStore } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { HOSPITAL } from "@/lib/lab-desk/mockData";
import {
  technicianOwnsOrder,
  useTechnicianContext,
} from "@/lib/lab-desk/technician";
import {
  labNavForRole,
  labRoleLabel,
  type LabNavLink,
  type LabNavLocked,
} from "@/lib/lab-desk/roles";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0].toLowerCase() === "dr.") {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (name.includes(".")) {
    return name
      .split(/\s+/)
      .map((p) => p.replace(/\./g, "")[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return parts
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type NavLinkProps = LabNavLink & {
  badge?: number;
  onClick?: () => void;
};

function NavLinkItem({ to, label, icon: Icon, exact, badge, urgentBadge, onClick }: NavLinkProps) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] transition-colors",
        active
          ? "bg-sage-soft font-medium text-sage"
          : "text-ink-600 hover:bg-white hover:text-ink-900",
      )}
    >
      {active && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-sage" />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center font-mono text-[10px] font-medium leading-none",
            urgentBadge ? "bg-clay text-white" : "bg-ink-200/80 text-ink-600",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavLockedItem({ label }: LabNavLocked) {
  return (
    <div
      className="flex cursor-not-allowed items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] text-ink-400"
      aria-disabled
      title="Not available for your role"
    >
      <Lock className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{label}</span>
    </div>
  );
}

function NavContent({ onClick }: { onClick?: () => void }) {
  const { orders } = useLabStore();
  const { name, email, session, isSupervisor } = useLabAuth();
  const techCtx = useTechnicianContext();
  const roles = session?.roles ?? [];
  const config = labNavForRole(roles);

  const counts = useMemo(() => {
    const open = orders.filter((o) => !["validated", "cancelled"].includes(o.status));
    const myOrders = isSupervisor ? open : orders.filter((o) => technicianOwnsOrder(o, techCtx));
    const benchActive = myOrders.filter((o) =>
      ["ordered", "collected", "processing"].includes(o.status),
    );
    const statBench = benchActive.filter((o) => o.priority === "stat" || o.priority === "urgent");
    const submissions = myOrders.filter((o) => ["validation", "validated"].includes(o.status));

    return {
      orders: open.length,
      validation: orders.filter((o) => o.status === "validation").length,
      bench: statBench.length || benchActive.length,
      submissions: submissions.length,
      collection: myOrders.filter((o) => o.status === "ordered").length,
      processing: myOrders.filter((o) => o.status === "collected" || o.status === "processing").length,
    };
  }, [orders, isSupervisor, techCtx]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-ink-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
              isSupervisor ? "bg-sage-soft text-sage" : "bg-teal-soft text-teal",
            )}
          >
            {initials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-ink-900">{name}</div>
            <div className="truncate text-[11px] text-ink-400">{email}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-ink-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              isSupervisor ? "bg-sage" : "bg-teal",
            )}
          >
            <FlaskConical className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-heading text-[13px] font-semibold text-ink-900">
              {HOSPITAL.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              {labRoleLabel(roles)}
            </div>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {config.sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLinkItem
                  key={item.to}
                  {...item}
                  badge={item.countKey ? counts[item.countKey] : undefined}
                  onClick={onClick}
                />
              ))}
            </div>
          </div>
        ))}

        {config.locked.length > 0 && (
          <div>
            <div className="px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
              No access
            </div>
            <div className="space-y-0.5">
              {config.locked.map((item) => (
                <NavLockedItem key={item.label} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="btn-icon lg:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-ink-200 bg-deeppaper p-0">
        <SheetTitle className="sr-only">Lab navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <NavContent onClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Sidebar() {
  return (
    <aside
      data-testid="lab-sidebar"
      className="print-hide fixed inset-y-0 left-0 z-30 hidden h-dvh w-60 flex-col border-r border-ink-200 bg-deeppaper lg:flex"
    >
      <NavContent />
    </aside>
  );
}
