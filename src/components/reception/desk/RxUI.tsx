import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function RxPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 lg:p-8", className)}>{children}</div>;
}

export function RxHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="rx-display text-3xl font-semibold tracking-tight text-stone-900 lg:text-[2rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function RxCard({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn("rx-card", padding && "p-5 lg:p-6", className)}>{children}</div>
  );
}

export function RxBtn({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
}) {
  if (variant === "primary") {
    return (
      <button
        type="button"
        className={cn("rx-btn-primary", size === "sm" && "!px-3 !py-1.5 !text-xs", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-colors",
        variant === "outline" && "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
        variant === "ghost" && "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function RxLinkBtn({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={cn("rx-btn-primary", className)}>
      {children}
    </Link>
  );
}

export function RxBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "teal" | "amber" | "rose";
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-600",
    teal: "bg-teal-50 text-teal-800 ring-1 ring-teal-600/15",
    amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15",
    rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export const rxInput = "rx-input";
export const rxLabel = "mb-1.5 block text-xs font-semibold text-stone-600";

export function RxEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-14 text-center">
      <p className="text-sm font-semibold text-stone-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

export function RxStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rx-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="rx-stat-value mt-2 text-stone-900" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs font-medium text-stone-500">{sub}</p>}
    </div>
  );
}
