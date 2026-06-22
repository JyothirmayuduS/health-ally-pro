// Shared UI atoms for the lab portal
import { cn } from "@/lib/utils";

export const PRIORITY_META = {
  stat: { label: "STAT", bg: "bg-red-100", text: "text-red-700", ring: "ring-red-300" },
  urgent: { label: "Urgent", bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-300" },
  routine: { label: "Routine", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
};

export const STATUS_META = {
  ordered: { label: "Ordered", bg: "bg-stone-100", text: "text-stone-700", dot: "bg-stone-400" },
  collected: { label: "Collected", bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-500" },
  processing: { label: "Processing", bg: "bg-indigo-50", text: "text-indigo-800", dot: "bg-indigo-500" },
  validation: { label: "Pending Validation", bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
  validated: { label: "Released", bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
};

export function PriorityPill({ priority, ...props }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.routine;
  return (
    <span
      data-testid={`priority-${priority}`}
      className={cn("status-pill ring-1 ring-inset", m.bg, m.text, m.ring)}
      {...props}
    >
      {priority === "stat" && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
      {m.label}
    </span>
  );
}

export function StatusPill({ status, ...props }) {
  const m = STATUS_META[status] || STATUS_META.ordered;
  return (
    <span
      data-testid={`status-${status}`}
      className={cn("status-pill", m.bg, m.text)}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function FlagBadge({ level, label }) {
  if (level === "empty" || level === "normal") return null;
  const palette = {
    low: "bg-blue-100 text-blue-800",
    high: "bg-amber-100 text-amber-800",
    critical: "bg-red-100 text-red-800 ring-1 ring-red-300 animate-pulse",
  };
  return (
    <span className={cn("status-pill", palette[level])} data-testid={`flag-${level}`}>
      {label}
    </span>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <div className="flex items-end justify-between mb-4 pb-3 border-b border-stone-200/70">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-mono mb-1">
          Medora · Laboratory
        </div>
        <h2 className="text-2xl font-display font-semibold text-[var(--ink)]">{children}</h2>
      </div>
      {action}
    </div>
  );
}

export function KpiCard({ label, value, hint, accent = "sage", testid }) {
  const accents = {
    sage: "border-l-[var(--sage-700)]",
    amber: "border-l-amber-500",
    red: "border-l-red-500",
    sky: "border-l-sky-500",
    indigo: "border-l-indigo-500",
    emerald: "border-l-emerald-500",
  };
  return (
    <div
      data-testid={testid}
      className={cn(
        "bg-white rounded-xl border border-stone-200 p-5 border-l-4 transition-all hover:shadow-sm hover:-translate-y-px",
        accents[accent],
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.16em] text-stone-500 font-mono">{label}</div>
      <div className="text-3xl font-display font-semibold mt-2 text-[var(--ink)]">{value}</div>
      {hint && <div className="text-xs text-stone-500 mt-1">{hint}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="h-14 w-14 rounded-2xl bg-[var(--sage-50)] flex items-center justify-center mb-3">
          <Icon className="h-7 w-7 text-[var(--sage-700)]" />
        </div>
      )}
      <div className="font-display text-lg font-semibold text-[var(--ink)]">{title}</div>
      {hint && <div className="text-sm text-stone-500 mt-1 max-w-xs">{hint}</div>}
    </div>
  );
}
