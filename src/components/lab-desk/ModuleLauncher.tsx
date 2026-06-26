import { Link, useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLabStore } from "@/lib/lab-desk/store";
import { useLabAuth } from "@/lib/lab-desk/useLabAuth";
import { technicianOwnsOrder, useTechnicianContext } from "@/lib/lab-desk/technician";
import { labNavForRole, type LabNavLink } from "@/lib/lab-desk/roles";
import { SectionLabel } from "@/components/lab-desk/Pills";

const MODULE_HINTS: Record<string, string> = {
  "/lab": "Today's overview and quick actions",
  "/lab/orders": "All open orders from doctors and reception",
  "/lab/validation": "Review results and release reports",
  "/lab/samples": "Physical tubes — rack, temperature, custody",
  "/lab/collection": "Draw queue — patients not yet collected",
  "/lab/processing": "Analyzer bench — enter results",
  "/lab/my-submissions": "Results sent for supervisor sign-off only",
  "/lab/reports": "Turnaround times, volume, and CSV export",
  "/lab/team": "Bench staff, sections, and shift coverage",
  "/lab/settings": "TAT rules, critical values, lab profile",
  "/lab/catalog": "Test panels, tubes, and reference ranges",
};

const LOCKED_HINTS: Record<string, string> = {
  Collection: "Bench work — technicians only",
  Processing: "Bench work — technicians only",
  Validation: "Supervisor sign-off required",
  Analytics: "Supervisor operations only",
};

function useNavCounts() {
  const { orders } = useLabStore();
  const techCtx = useTechnicianContext();
  return useMemo(() => {
    const open = orders.filter((o) => !["validated", "cancelled"].includes(o.status));
    const benchActive = orders.filter((o) =>
      ["ordered", "collected", "processing"].includes(o.status),
    );
    const statBench = benchActive.filter((o) => o.priority === "stat" || o.priority === "urgent");
    const myBench = orders.filter((o) => technicianOwnsOrder(o, techCtx));
    const submissions = myBench.filter((o) => ["validation", "validated"].includes(o.status));
    return {
      orders: open.length,
      validation: orders.filter((o) => o.status === "validation").length,
      bench: myBench.filter((o) => ["ordered", "collected", "processing"].includes(o.status)).length || statBench.length,
      submissions: submissions.length,
      collection: myBench.filter((o) => o.status === "ordered").length,
      processing: myBench.filter((o) => o.status === "collected" || o.status === "processing").length,
    };
  }, [orders, techCtx]);
}

function ModuleCard({
  item,
  badge,
  currentPath,
}: {
  item: LabNavLink;
  badge?: number;
  currentPath: string;
}) {
  const Icon = item.icon;
  const isCurrent = item.exact
    ? currentPath === item.to || currentPath === `${item.to}/`
    : currentPath.startsWith(item.to);

  return (
    <Link
      to={item.to}
      className={cn(
        "surface group row-hover flex flex-col gap-3 p-4 transition-colors",
        isCurrent && "border-sage ring-1 ring-sage/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            isCurrent
              ? "bg-sage text-white"
              : "bg-sage-soft text-sage group-hover:bg-sage group-hover:text-white",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        {badge !== undefined && badge > 0 && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px] font-medium",
              item.urgentBadge ? "bg-clay text-white" : "bg-ink-200/80 text-ink-600",
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="font-medium text-ink-900">{item.label}</div>
        <div className="mt-1 text-[12px] leading-snug text-ink-400">
          {MODULE_HINTS[item.to] ?? "Open module"}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-medium text-sage opacity-0 transition-opacity group-hover:opacity-100">
        Open <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

function LockedModuleCard({ label }: { label: string }) {
  return (
    <div className="surface flex flex-col gap-3 border-dashed p-4 opacity-60">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-200/50 text-ink-400">
        <Lock className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <div className="font-medium text-ink-600">{label}</div>
        <div className="mt-1 text-[12px] text-ink-400">
          {LOCKED_HINTS[label] ?? "Not available for your role"}
        </div>
      </div>
    </div>
  );
}

export default function ModuleLauncher() {
  const { pathname } = useLocation();
  const { session, name } = useLabAuth();
  const config = labNavForRole(session?.roles ?? []);
  const counts = useNavCounts();

  return (
    <div className="space-y-6" data-testid="module-launcher">
      {config.sections.map((section) => (
        <div key={section.title}>
          <SectionLabel>{section.title}</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <ModuleCard
                key={item.to}
                item={item}
                badge={item.countKey ? counts[item.countKey] : undefined}
                currentPath={pathname}
              />
            ))}
          </div>
        </div>
      ))}

      {config.locked.length > 0 && (
        <div>
          <SectionLabel>No access</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.locked.map((item) => (
              <LockedModuleCard key={item.label} label={item.label} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
