import { Clock, User } from "lucide-react";
import type { QueueEntry } from "@/lib/reception-mock-data";
import { getDoctorById, getPatientById } from "@/lib/reception-mock-data";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

type QueueCardProps = {
  entry: QueueEntry;
  onCallNext?: () => void;
  onStatusChange?: (status: QueueEntry["status"]) => void;
  showActions?: boolean;
  className?: string;
};

export function QueueCard({
  entry,
  onCallNext,
  onStatusChange,
  showActions = false,
  className,
}: QueueCardProps) {
  const patient = getPatientById(entry.patientId);
  const doctor = getDoctorById(entry.doctorId);

  return (
    <div
      className={cn(
        "rounded-[20px] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]",
        entry.status === "in-consultation" && "ring-2 ring-[#D4F06D]/50",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#1e293b] text-xl font-bold text-[#D4F06D]">
          {entry.tokenNumber}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[#1e293b]">{patient?.name ?? "Unknown"}</p>
            <StatusPill status={entry.status} />
          </div>
          <p className="mt-1 text-sm text-[#64748B]">
            {doctor?.name} · Room {doctor?.room}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Checked in {entry.checkInTime}
            </span>
            {entry.status === "waiting" && entry.waitMinutes > 0 && (
              <span className="font-medium text-[#B45309]">Wait: {entry.waitMinutes} min</span>
            )}
          </div>
        </div>
        {patient && (
          <img
            src={patient.photoUrl}
            alt=""
            className="hidden h-10 w-10 shrink-0 rounded-full object-cover sm:block"
          />
        )}
      </div>

      {showActions && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#F0F0F0] pt-4">
          {entry.status === "waiting" && onCallNext && (
            <button
              type="button"
              onClick={onCallNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1e293b] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#334155]"
            >
              <User className="h-3.5 w-3.5" />
              Call Patient
            </button>
          )}
          {onStatusChange && entry.status !== "completed" && entry.status !== "cancelled" && (
            <>
              {entry.status === "in-consultation" && (
                <button
                  type="button"
                  onClick={() => onStatusChange("completed")}
                  className="rounded-xl bg-[#E8F5D4] px-3 py-2 text-xs font-medium text-[#4D7C0F] hover:bg-[#d9eeb8]"
                >
                  Mark Complete
                </button>
              )}
              <button
                type="button"
                onClick={() => onStatusChange("cancelled")}
                className="rounded-xl bg-[#FEF3C7] px-3 py-2 text-xs font-medium text-[#B45309] hover:bg-[#fde68a]"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
