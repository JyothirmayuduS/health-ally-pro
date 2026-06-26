import { cn } from "@/lib/utils";
import type { QueueStatus } from "@/lib/reception-mock-data";

const statusStyles: Record<QueueStatus, string> = {
  waiting: "bg-[#E8F4FD] text-[#2563EB]",
  "in-consultation": "bg-[#E8F5D4] text-[#4D7C0F]",
  completed: "bg-[#F0F0F0] text-[#64748B]",
  cancelled: "bg-[#FEF3C7] text-[#B45309]",
};

type StatusPillProps = {
  status: QueueStatus;
  className?: string;
  size?: "sm" | "md";
};

const labels: Record<QueueStatus, string> = {
  waiting: "Waiting",
  "in-consultation": "In Consultation",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusPill({ status, className, size = "sm" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        statusStyles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
