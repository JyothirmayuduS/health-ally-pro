import { useLocation } from "@tanstack/react-router";
import { AlertTriangle, DoorOpen } from "lucide-react";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "card" | "toolbar" | "pill";
  embedded?: boolean;
  className?: string;
};

/** Clinic status — shown on queue page and prescription toolbar only */
export function DoctorClinicStatusBar({ variant = "card", embedded = false, className }: Props) {
  const { pathname } = useLocation();
  const { accepting, room, toggleAccepting } = useLiveQueue();
  const store = useProfileStore();
  const isQueuePage = pathname.startsWith("/doctor/queue");

  const statusLabel = store.away.active
    ? store.availabilityMode === "emergency"
      ? "Emergency away"
      : "Away"
    : accepting
      ? "Accepting"
      : "Paused";

  const dotColor = store.away.active
    ? "bg-[#E9A820]"
    : accepting
      ? "bg-[#7A9B7E]"
      : "bg-[#C45C4A]";

  const roomLabel = store.schedule.room || room;
  const isToolbar = variant === "toolbar";
  const isPill = variant === "pill" || isQueuePage;

  const inner = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {isQueuePage && !store.away.active ? (
        <button
          type="button"
          onClick={toggleAccepting}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            accepting
              ? "bg-[#E8EFE6] text-[#1B3B2E] hover:bg-[#DFEBDC]"
              : "bg-[#F5F2ED] text-[#8A8F8C] hover:bg-[#EDEAE6]",
          )}
          aria-label={accepting ? "Pause queue" : "Resume accepting"}
          title="Toggle accepting (P)"
        >
          {store.away.active && <AlertTriangle className="h-3 w-3 text-[#E9A820]" strokeWidth={2} />}
          <span className={cn("h-2 w-2 rounded-full", dotColor)} />
          {statusLabel}
        </button>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
            accepting ? "bg-[#E8EFE6] text-[#1B3B2E]" : "bg-[#F5F2ED] text-[#8A8F8C]",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", dotColor)} />
          {statusLabel}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F2ED] px-3 py-1.5 text-xs font-medium text-[#8A8F8C]">
        <DoorOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
        {roomLabel}
      </span>
    </div>
  );

  if (embedded) {
    return <div className={cn("min-w-0 flex-1", className)}>{inner}</div>;
  }

  if (isToolbar) {
    return (
      <div
        className={cn(
          "flex min-h-[40px] items-center border-t border-[#EDEAE6] bg-[#FAFAF8] px-4 py-2 sm:px-6 lg:px-8 xl:px-10",
          className,
        )}
      >
        {inner}
      </div>
    );
  }

  if (isPill) {
    return <div className={cn("mb-4", className)}>{inner}</div>;
  }

  return null;
}

export const doctorMainBleedX = "-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12";

export function isDoctorPrescriptionsRoute(pathname: string) {
  return pathname.startsWith("/doctor/prescriptions");
}
