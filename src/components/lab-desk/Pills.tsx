import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PriorityPill({
  priority,
  ...props
}: {
  priority: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const cls =
    priority === "stat"
      ? "bg-status-noshowBg text-status-noshowText border-status-noshowBorder"
      : priority === "urgent"
        ? "bg-clay-soft text-clay border-clay/30"
        : "bg-sage-soft text-sage border-sage/20";
  const label = priority === "stat" ? "STAT" : priority === "urgent" ? "Urgent" : "Routine";
  return (
    <span
      data-testid={`priority-${priority}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        cls,
      )}
      {...props}
    >
      {priority === "stat" && (
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current opacity-80" />
      )}
      {label}
    </span>
  );
}

export function StatusPill({
  status,
  ...props
}: {
  status: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const map: Record<string, string> = {
    ordered: "bg-mustard-soft text-mustard border-mustard/30",
    collected: "bg-teal-soft text-teal border-teal/30",
    processing: "bg-status-consultBg text-status-consultText border-status-consultBorder",
    validation: "bg-clay-soft text-clay border-clay/30",
    validated: "bg-status-doneBg text-status-doneText border-status-doneBorder",
    cancelled: "bg-ink-200/50 text-ink-600 border-ink-200",
  };
  const labels: Record<string, string> = {
    ordered: "Ordered",
    collected: "Collected",
    processing: "Processing",
    validation: "Pending validation",
    validated: "Released",
    cancelled: "Cancelled",
  };
  return (
    <span
      data-testid={`status-${status}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        map[status] || map.ordered,
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status] || status}
    </span>
  );
}

export function FlagBadge({ level, label }: { level: string; label: string }) {
  if (level === "empty" || level === "normal") return null;
  const palette: Record<string, string> = {
    low: "bg-teal-soft text-teal",
    high: "bg-mustard-soft text-mustard",
    critical: "bg-status-noshowBg text-status-noshowText ring-1 ring-status-noshowBorder",
  };
  return (
    <span className={cn("rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase", palette[level])}>
      {label}
    </span>
  );
}

export function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between border-b border-ink-200 pb-3">
      <div>
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
          Maple · Laboratory
        </div>
        <h2 className="font-heading mt-1 text-[22px] font-semibold text-ink-900">{children}</h2>
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  testid,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  testid?: string;
  onClick?: () => void;
}) {
  return (
    <div
      data-testid={testid}
      onClick={onClick}
      className={cn(
        "surface border-l-4 border-l-sage px-5 py-4",
        onClick && "cursor-pointer hover:shadow-md transition-shadow active:bg-stone-50"
      )}
    >
      <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
        {label}
      </div>
      <div className="font-heading mt-2 text-[32px] font-semibold leading-none tabular-nums text-ink-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-[12px] text-ink-400">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-sage-soft">
          <Icon className="h-7 w-7 text-sage" />
        </div>
      )}
      <div className="font-heading text-lg font-semibold text-ink-900">{title}</div>
      {hint && <div className="mt-1 max-w-xs text-[13px] text-ink-400">{hint}</div>}
    </div>
  );
}
