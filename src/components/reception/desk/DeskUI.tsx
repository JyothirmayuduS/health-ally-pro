import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function DeskCard({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white shadow-sm",
        padding && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DeskCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const btnVariants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
  secondary: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function DeskButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        btnVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DeskLinkButton({
  to,
  children,
  variant = "primary",
  className,
}: {
  to: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
        variant === "primary"
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export const deskInputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export const deskLabelClass = "mb-1.5 block text-xs font-medium text-zinc-600";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-600",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  info: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
};

export function DeskBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        badgeStyles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function DeskKpi({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <DeskCard className="flex items-start gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
        {hint && (
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-600",
              !trend && "text-zinc-400",
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </DeskCard>
  );
}

export function DeskEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-zinc-500">{description}</p>}
    </div>
  );
}

export function DeskAlert({
  children,
  variant = "success",
}: {
  children: React.ReactNode;
  variant?: "success" | "info";
}) {
  return (
    <div
      className={cn(
        "mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        variant === "info" && "border-indigo-200 bg-indigo-50 text-indigo-800",
      )}
    >
      {children}
    </div>
  );
}
