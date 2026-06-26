import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeskKpi({
  label,
  value,
  sub,
  accent,
  testId,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="surface px-5 py-4">
      <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="font-heading text-[32px] font-semibold leading-none tabular-nums text-ink-900">
          {value}
        </div>
        {sub && (
          <div className={cn("text-[12px] font-medium", accent ?? "text-ink-400")}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export function DeskQuickAction({
  to,
  icon: Icon,
  label,
  testId,
  accentClass = "bg-sage-soft text-sage group-hover:bg-sage group-hover:text-white",
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  testId?: string;
  accentClass?: string;
}) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="group surface flex items-center gap-3 px-4 py-3 transition-colors hover:border-sage hover:bg-sage-soft/40"
    >
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-sm transition-colors",
          accentClass,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1 text-[13px] font-medium text-ink-900">{label}</div>
      <ArrowRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-sage" />
    </Link>
  );
}

export function DeskPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
        <h2 className="font-heading text-[15px] font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DeskTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("w-full text-[13px]", className)}>
      {children}
    </table>
  );
}

export function DeskThead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-ink-200 bg-stone-50">
      <tr className="font-mono text-[10px] uppercase tracking-wider text-ink-400">{children}</tr>
    </thead>
  );
}

export function DeskTh({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-4 py-3", align === "right" ? "text-right" : "text-left")}>{children}</th>
  );
}

export function DeskEmpty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-[13px] text-ink-400">{children}</p>;
}
