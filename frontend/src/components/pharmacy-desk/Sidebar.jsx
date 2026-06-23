import React from "react";
import { NavLink } from "react-router-dom";
import { PORTALS } from "@/lib/portals/config";
import { usePharmacy } from "@/lib/pharmacy-desk/store";
import { useAuth } from "@/lib/auth/authContext";
import { Pill, LogOut, RefreshCcw } from "lucide-react";
import { fmt, classNames } from "@/lib/pharmacy-desk/utils";

export default function PharmacySidebar() {
  const portal = PORTALS.pharmacy;
  const { counts, resetDemoData } = usePharmacy();
  const { user, signOut } = useAuth();

  const badgeFor = (to) => {
    if (to === "/pharmacy/prescriptions") return counts.new + counts.in_review;
    if (to === "/pharmacy/dispense") return counts.ready_to_dispense + counts.dispensing + counts.dispensed;
    if (to === "/pharmacy/refills") return counts.refillsPending;
    if (to === "/pharmacy/inventory") return counts.lowStock;
    return 0;
  };

  return (
    <aside
      data-testid="pharmacy-sidebar"
      className="w-64 shrink-0 h-screen sticky top-0 border-r border-border/70 bg-[hsl(var(--paper-100))]/60 backdrop-blur-sm flex flex-col"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--sage-500))] flex items-center justify-center shadow-sm">
            <Pill className="h-5 w-5 text-[hsl(var(--paper-50))]" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[18px] text-[hsl(var(--ink))]">Oakhaven</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pharmacy Desk</div>
          </div>
        </div>
      </div>

      <div className="pharm-divider mx-5" />

      {/* Sections */}
      <nav className="px-3 py-3 flex-1 overflow-y-auto scrollbar-thin">
        {portal.sections.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 font-medium">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = badgeFor(item.to);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      data-testid={item.testId}
                      className={({ isActive }) =>
                        classNames(
                          "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-[hsl(var(--sage-500))] text-[hsl(var(--paper-50))] shadow-sm"
                            : "text-[hsl(var(--ink))]/80 hover:bg-[hsl(var(--paper-200))]/60",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={classNames(
                              "h-4 w-4 transition-transform group-hover:scale-110",
                              isActive ? "" : "text-muted-foreground",
                            )}
                            strokeWidth={1.8}
                          />
                          <span className="flex-1">{item.label}</span>
                          {badge > 0 && (
                            <span
                              className={classNames(
                                "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium min-w-[20px] text-center",
                                isActive
                                  ? "bg-[hsl(var(--paper-50))]/20 text-[hsl(var(--paper-50))]"
                                  : "bg-[hsl(var(--sage-500))]/12 text-[hsl(var(--sage-500))]",
                              )}
                            >
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / user */}
      <div className="px-3 pb-4">
        <div className="pharm-divider mx-2 mb-3" />
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[hsl(var(--sage-100))] flex items-center justify-center font-medium text-[hsl(var(--sage-700))]">
            {fmt.initials(user?.name || "Riley Chen")}
          </div>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name || "Riley Chen"}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.title || "Lead Pharmacist"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 mt-1">
          <button
            data-testid="reset-demo-btn"
            onClick={resetDemoData}
            title="Reset demo data"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border/70 bg-card px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60 transition-colors"
          >
            <RefreshCcw className="h-3 w-3" /> Reset demo
          </button>
          <button
            data-testid="sign-out-btn"
            onClick={signOut}
            title="Sign out"
            className="inline-flex items-center justify-center rounded-md border border-border/70 bg-card p-1.5 text-muted-foreground hover:bg-[hsl(var(--paper-200))]/60 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
