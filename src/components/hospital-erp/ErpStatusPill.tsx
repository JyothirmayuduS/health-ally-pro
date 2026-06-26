import { cn } from "@/lib/utils";
import type { ErpStatus } from "@/lib/hospital-erp-data";

const STYLES: Record<string, string> = {
  paid: "bg-money-soft text-money",
  partial: "bg-mustard-soft text-mustard",
  pending: "bg-clay-soft text-clay",
  "in-progress": "bg-teal-soft text-teal",
  completed: "bg-sage-soft text-sage",
  upcoming: "bg-stone-100 text-ink-500",
  occupied: "bg-plum-soft text-plum",
  available: "bg-sage-soft text-sage",
  cleaning: "bg-mustard-soft text-mustard",
  maintenance: "bg-stone-200 text-ink-500",
  urgent: "bg-clay-soft text-clay",
  routine: "bg-stone-100 text-ink-500",
  stat: "bg-clay-soft text-clay",
  critical: "bg-red-100 text-red-700",
  high: "bg-mustard-soft text-mustard",
  medium: "bg-teal-soft text-teal",
};

export function ErpStatusPill({ status, label }: { status: ErpStatus | string; label?: string }) {
  const text = label ?? status.replace("-", " ");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STYLES[status] ?? "bg-stone-100 text-ink-500",
      )}
    >
      {text}
    </span>
  );
}
