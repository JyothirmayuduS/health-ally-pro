import { Link, useLocation } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePharmacyStore } from "@/lib/pharmacy-desk/store";
import { usePharmacyAuth } from "@/lib/pharmacy-desk/usePharmacyAuth";
import { HOSPITAL } from "@/lib/pharmacy-desk/mockData";
import { PHARMACY_NAV, type PharmacyNavLink } from "@/lib/pharmacy-desk/nav";
import { isLowStock } from "@/lib/pharmacy-desk/location";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s.replace(/\./g, "")[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NavLinkItem({
  to,
  label,
  icon: Icon,
  exact,
  badge,
  urgentBadge,
  onClick,
}: PharmacyNavLink & { badge?: number; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] transition-colors",
        active
          ? "bg-mustard-soft font-medium text-mustard"
          : "text-ink-600 hover:bg-white hover:text-ink-900",
      )}
    >
      {active && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-mustard" />
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

function NavContent({ onClick }: { onClick?: () => void }) {
  const { prescriptions, refills, drugs, batches, wardOrders, alerts } = usePharmacyStore();
  const { name, email } = usePharmacyAuth();

  const counts = useMemo(() => {
    const inbox = prescriptions.filter((r) =>
      ["received", "in_review"].includes(r.status),
    ).length;
    const dispense = prescriptions.filter((r) =>
      ["ready_to_dispense", "dispensing"].includes(r.status),
    ).length;
    const pickup = prescriptions.filter((r) => r.status === "ready_pickup").length;
    const pendingRefills = refills.filter((r) => r.status === "pending").length;
    const lowStock = drugs.filter((d) => isLowStock(d, batches.filter((b) => b.drug_id === d.id))).length;
    const hold = prescriptions.filter((r) => r.status === "on_hold").length;
    const ward = wardOrders.filter((w) => !["delivered"].includes(w.status)).length;
    const activeAlerts = alerts.filter((a) => !a.dismissed).length;
    const billing = prescriptions.filter((r) =>
      ["received", "in_review", "ready_to_dispense", "dispensing"].includes(r.status) &&
      r.payment_status !== "paid",
    ).length;

    return { inbox, dispense, pickup, refills: pendingRefills, lowStock, hold, ward, alerts: activeAlerts, billing };
  }, [prescriptions, refills, drugs, batches, wardOrders, alerts]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-ink-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mustard-soft font-mono text-[11px] font-semibold text-mustard">
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
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-mustard">
            <Pill className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-heading text-[13px] font-semibold text-ink-900">
              {HOSPITAL.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              Pharmacist
            </div>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {PHARMACY_NAV.map((section) => (
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
        <SheetTitle className="sr-only">Pharmacy navigation</SheetTitle>
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
      data-testid="pharmacy-sidebar"
      className="print-hide fixed inset-y-0 left-0 z-30 hidden h-dvh w-60 flex-col border-r border-ink-200 bg-deeppaper lg:flex"
    >
      <NavContent />
    </aside>
  );
}
