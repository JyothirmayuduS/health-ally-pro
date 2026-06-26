import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeskNavLink, DeskPortalConfig } from "@/lib/desk-shell/types";

function NavItem({
  item,
  theme,
  onClick,
}: {
  item: DeskNavLink;
  theme: DeskPortalConfig["theme"];
  onClick?: () => void;
}) {
  const { pathname } = useLocation();
  const { to, label, icon: Icon, exact, dot, badge } = item;
  const active = exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "group relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] transition-colors",
        active
          ? cn(theme.activeBg, "font-medium", theme.activeText)
          : "text-ink-600 hover:bg-white hover:text-ink-900",
      )}
    >
      {active && (
        <span className={cn("absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full", theme.activeBar)} />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[1.25rem] rounded-full bg-ink-200/80 px-1.5 py-0.5 text-center font-mono text-[10px] font-medium leading-none text-ink-600">
          {badge}
        </span>
      )}
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full opacity-80", dot)} />}
    </Link>
  );
}

function NavContent({ config, onClick }: { config: DeskPortalConfig; onClick?: () => void }) {
  const { theme, sections, portalLabel, version, hospitalName, staff } = config;

  return (
    <>
      <div className="border-b border-ink-200 px-5 pb-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              theme.brandIconBg,
              theme.brandIconFg,
            )}
          >
            <HeartPulse className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-heading text-[15px] font-semibold leading-none text-ink-900">
              {hospitalName}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-400">
              {portalLabel} · {version}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 pb-2 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400 first:pt-0">
              {section.title}
            </div>
            {section.items.map((item) => (
              <NavItem key={item.to} item={item} theme={theme} onClick={onClick} />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-ink-200 px-4 py-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-medium",
            theme.avatarBg,
            theme.avatarText,
          )}
        >
          {staff.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-ink-900">{staff.name}</div>
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-400">
            {staff.role}
          </div>
        </div>
      </div>
    </>
  );
}

export function DeskSidebar({ config }: { config: DeskPortalConfig }) {
  return (
    <aside
      data-testid="desk-sidebar"
      className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-60 flex-col border-r border-ink-200 bg-deeppaper lg:flex"
    >
      <NavContent config={config} />
    </aside>
  );
}

export function DeskMobileTrigger({ config }: { config: DeskPortalConfig }) {
  const [open, setOpen] = useState(false);
  useLocation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" data-testid="mobile-menu-btn" className="btn-icon lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r border-ink-200 bg-deeppaper p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <NavContent config={config} onClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
