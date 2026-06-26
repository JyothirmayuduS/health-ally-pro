import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { DrugLocation } from "@/lib/pharmacy-desk/mockData";
import { formatLocation, zoneColor } from "@/lib/pharmacy-desk/location";

export function PriorityPill({ priority }: { priority: string }) {
  const cls =
    priority === "stat"
      ? "bg-status-noshowBg text-status-noshowText border-status-noshowBorder"
      : priority === "urgent"
        ? "bg-clay-soft text-clay border-clay/30"
        : "bg-sage-soft text-sage border-sage/20";
  const label = priority === "stat" ? "STAT" : priority === "urgent" ? "Urgent" : "Routine";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        cls,
      )}
    >
      {priority === "stat" && (
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current opacity-80" />
      )}
      {label}
    </span>
  );
}

export function RxStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    received: "bg-mustard-soft text-mustard border-mustard/30",
    in_review: "bg-teal-soft text-teal border-teal/30",
    on_hold: "bg-clay-soft text-clay border-clay/30",
    ready_to_dispense: "bg-sage-soft text-sage border-sage/30",
    dispensing: "bg-status-consultBg text-status-consultText border-status-consultBorder",
    dispensed: "bg-plum-soft text-plum border-plum/30",
    ready_pickup: "bg-status-doneBg text-status-doneText border-status-doneBorder",
    collected: "bg-ink-200/50 text-ink-600 border-ink-200",
    cancelled: "bg-ink-200/50 text-ink-600 border-ink-200",
  };
  const labels: Record<string, string> = {
    received: "Received",
    in_review: "In review",
    on_hold: "On hold",
    ready_to_dispense: "Ready",
    dispensing: "Dispensing",
    dispensed: "Dispensed",
    ready_pickup: "Ready pickup",
    collected: "Collected",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        map[status] ?? map.received,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status] ?? status}
    </span>
  );
}

export function PaymentPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-status-doneBg text-status-doneText border-status-doneBorder",
    partial: "bg-mustard-soft text-mustard border-mustard/30",
    unpaid: "bg-clay-soft text-clay border-clay/30",
  };
  const labels: Record<string, string> = {
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        map[status] ?? map.unpaid,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status] ?? status}
    </span>
  );
}

export function LocationChip({ location, size = "sm" }: { location: DrugLocation; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border font-mono",
        zoneColor(location.zone),
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      )}
      title={formatLocation(location)}
    >
      <span className="font-medium">{location.location_code}</span>
      <span className="opacity-60">·</span>
      <span>{location.rack}</span>
      <span className="opacity-60">·</span>
      <span>{location.tray}</span>
    </span>
  );
}

export function SectionLabel({
  children,
  action,
  eyebrow = "Maple · Pharmacy",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between border-b border-ink-200 pb-3">
      <div>
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
          {eyebrow}
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
  accent = "border-l-mustard",
}: {
  label: string;
  value: string | number;
  hint?: string;
  testid?: string;
  accent?: string;
}) {
  return (
    <div data-testid={testid} className={cn("surface border-l-4 px-5 py-4", accent)}>
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
  action,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-xl bg-mustard-soft">
          <Icon className="h-7 w-7 text-mustard" />
        </div>
      )}
      <div className="font-heading text-lg font-semibold text-ink-900">{title}</div>
      {hint && <div className="mt-1 max-w-xs text-[13px] text-ink-400">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PickPath({ location }: { location: DrugLocation }) {
  const steps = [
    { label: "Aisle", value: location.aisle },
    { label: "Rack", value: location.rack },
    { label: "Tray", value: location.tray },
    { label: "Slot", value: `S${location.slot}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-ink-300">→</span>}
          <div className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-center">
            <div className="font-mono text-[9px] uppercase tracking-wider text-ink-400">{s.label}</div>
            <div className="font-mono text-[12px] font-semibold text-ink-900">{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
