import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function ProfileSectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-serif text-xl text-ink sm:text-[22px]">{children}</h2>
      {action}
    </div>
  );
}

export function ProfileCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ProfileRow({
  icon: Icon,
  label,
  value,
  onClick,
  chevron,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value?: string;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const inner = (
    <>
      {Icon ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
          <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
          {label}
        </p>
        {value ? <p className="mt-0.5 text-sm font-medium text-ink">{value}</p> : null}
      </div>
      {chevron ? <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" /> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-[#F9F7F2]/60 sm:px-5"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3.5 px-4 py-4 sm:px-5">{inner}</div>
  );
}

export function ProfileLinkRow({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to?: string;
}) {
  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center gap-3.5 border-t border-[#EDEAE6] px-4 py-4 transition-colors first:border-t-0 hover:bg-[#F9F7F2]/60 sm:px-5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
          <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
        </span>
        <span className="flex-1 text-sm font-medium text-ink">{label}</span>
        <ChevronRight className="h-4 w-4 text-ink-muted" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3.5 border-t border-[#EDEAE6] px-4 py-4 text-left transition-colors first:border-t-0 hover:bg-[#F9F7F2]/60 sm:px-5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
        <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <ChevronRight className="h-4 w-4 text-ink-muted" />
    </button>
  );
}

export function ProfileToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3.5 border-t border-[#EDEAE6] px-4 py-4 first:border-t-0 sm:px-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
        <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-clay"
      />
    </div>
  );
}

export function AvatarWithAdherenceRing({
  initials,
  value,
  stroke = "#5B8DB8",
  trackStroke = "rgba(91, 141, 184, 0.22)",
  avatarClassName,
  size = 48,
}: {
  initials: string;
  value: number;
  stroke?: string;
  trackStroke?: string;
  avatarClassName: string;
  size?: number;
}) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const offset =
    circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const inset = Math.max(4, Math.round(size * 0.1));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 48 48"
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="3"
          stroke={trackStroke}
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={cn(
          "absolute grid place-items-center rounded-full font-semibold text-white",
          avatarClassName,
        )}
        style={{
          inset,
          fontSize: Math.max(11, Math.round(size * 0.28)),
        }}
      >
        {initials}
      </span>
    </div>
  );
}

export function AdherenceRing({
  value,
  stroke = "#5B8DB8",
  trackStroke = "rgba(91, 141, 184, 0.22)",
  size = 48,
  className,
}: {
  value: number;
  stroke?: string;
  trackStroke?: string;
  size?: number;
  className?: string;
}) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="3"
          stroke={trackStroke}
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center font-bold leading-none tabular-nums"
        style={{
          color: stroke,
          fontSize: Math.max(9, Math.round(size * 0.24)),
        }}
      >
        {value}%
      </span>
    </div>
  );
}
