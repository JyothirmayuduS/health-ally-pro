import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { PortalKey } from "@/lib/supabase/rbac";
import { PORTAL_LABELS } from "@/lib/supabase/rbac";
import { PORTAL_ACCENT, PORTAL_NAV } from "@/lib/portals/config";
import { signOut } from "@/lib/supabase/auth";

type Props = {
  portal: PortalKey;
};

export function StaffPortalShell({ portal }: Props) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const nav = PORTAL_NAV[portal];
  const label = PORTAL_LABELS[portal];
  const accent = PORTAL_ACCENT[portal];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar p-6 lg:flex">
        <PortalBrand portal={portal} label={label} accent={accent} />
        <nav className="mt-10 flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === `/${portal}`
                ? location.pathname === `/${portal}` || location.pathname === `/${portal}/`
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="nav-item text-sm font-medium"
                data-active={active}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <Link to="/" className="block text-xs font-medium uppercase tracking-widest text-clay hover:text-ink">
            Patient app →
          </Link>
          <button
            onClick={() => signOut().then(() => (window.location.href = "/login"))}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-muted hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar p-6">
            <div className="flex items-center justify-between">
              <PortalBrand portal={portal} label={label} accent={accent} />
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-surface-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="nav-item text-sm font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-sm">
          <div className="flex items-center gap-4 px-6 py-4 lg:px-10">
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-border p-2 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="label-eyebrow">{label} portal</p>
          </div>
        </header>
        <main className="px-6 py-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PortalBrand({
  portal,
  label,
  accent,
}: {
  portal: PortalKey;
  label: string;
  accent: string;
}) {
  return (
    <Link to={`/${portal}`} className="flex items-center gap-2.5">
      <span className={`grid h-9 w-9 place-items-center rounded-xl font-serif text-lg ${accent}`}>
        {label[0]}
      </span>
      <span>
        <span className="block font-serif text-xl leading-none tracking-tight">Medora</span>
        <span className="block text-[10px] uppercase tracking-[0.2em] text-ink-muted">{label}</span>
      </span>
    </Link>
  );
}
