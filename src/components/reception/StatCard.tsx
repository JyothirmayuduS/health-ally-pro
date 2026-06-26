import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: "lime" | "white" | "mint";
  className?: string;
  children?: React.ReactNode;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accent = "white",
  className,
  children,
}: StatCardProps) {
  const bg = accent === "lime" ? "bg-[#EEF6D4]" : accent === "mint" ? "bg-[#F0FAF0]" : "bg-white";

  return (
    <div
      className={cn(
        "rounded-[20px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]",
        bg,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1e293b]">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trendUp ? "text-[#4D7C0F]" : "text-[#64748B]",
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E0E7EB]/60">
          <Icon className="h-5 w-5 text-[#64748B]" strokeWidth={1.75} />
        </span>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function MetricWidget({
  label,
  value,
  unit,
  progress,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  progress?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-[20px] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]", className)}
    >
      <p className="text-xs font-medium text-[#94A3B8]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#1e293b]">{value}</span>
        {unit && <span className="text-sm text-[#94A3B8]">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E0E7EB]">
          <div
            className="h-full rounded-full bg-[#D4F06D] transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
