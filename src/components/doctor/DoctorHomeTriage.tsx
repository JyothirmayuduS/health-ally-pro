import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronRight,
  DoorOpen,
  Megaphone,
  X,
} from "lucide-react";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { computeClinicOverview } from "@/lib/doctor-clinic-overview";
import {
  formatConsultTimer,
  formatDisplayToken,
  formatRelativeLive,
  getQueuePatient,
} from "@/lib/doctor-live-queue";
import { cn } from "@/lib/utils";

type Layout = "stack" | "grid";

export function DoctorHomeTriage({ layout = "grid" }: { layout?: Layout }) {
  const {
    entries,
    bookingRequests,
    accepting,
    room,
    approveBooking,
    dismissBooking,
    callNext,
    markDone,
  } = useLiveQueue();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const overview = computeClinicOverview(
    { accepting, room, entries, bookingRequests },
    nowMs,
  );
  const servingPatient = overview.serving
    ? getQueuePatient(overview.serving.patientId)
    : null;
  const nextPatient = overview.nextWaiting
    ? getQueuePatient(overview.nextWaiting.patientId)
    : null;

  const handleApprove = (id: string, name: string) => {
    const token = approveBooking(id);
    if (token == null) return;
    toast.success(`${name} added to queue`, {
      description: `${formatDisplayToken(token)} assigned`,
    });
  };

  const handleCallNext = () => {
    if (!overview.nextWaiting || !nextPatient) {
      toast.error("No patients waiting");
      return;
    }
    callNext();
    toast.success(`Calling ${nextPatient.name}`, {
      description: `${formatDisplayToken(overview.nextWaiting.token)} · ${room}`,
    });
  };

  const handleDone = () => {
    if (!servingPatient) return;
    markDone();
    toast.success(`${servingPatient.name} marked complete`);
  };

  const nowCard = (
    <article
      className={cn(
        "flex min-h-[148px] flex-col rounded-2xl border p-4 sm:p-5",
        overview.serving
          ? "border-[#254A3A]/60 bg-gradient-to-br from-[#1F4234] to-[#1B3B2E] text-white"
          : "border-dashed border-[#E8E4DF] bg-white text-[#1B3B2E]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-[10px] font-bold tracking-[0.14em]",
            overview.serving ? "text-white/70" : "text-[#8A8F8C]",
          )}
        >
          NOW IN ROOM
        </p>
        <DoorOpen className="h-4 w-4 opacity-60" strokeWidth={1.75} />
      </div>
      {overview.serving && servingPatient ? (
        <>
          <p className="mt-2 font-serif text-3xl font-semibold tabular-nums sm:text-4xl">
            {formatDisplayToken(overview.serving.token)}
          </p>
          <p className="mt-0.5 text-base font-semibold sm:text-lg">{servingPatient.name}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-white/65">{overview.serving.reason}</p>
          <p className="mt-auto pt-3 font-mono text-sm tabular-nums text-[#A8C4B0]">
            {formatConsultTimer(overview.serving.servingStartedAt, nowMs)} in consult
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDone}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#B8735D] px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Mark done
            </button>
            <Link
              to="/doctor/patients/$patientId"
              params={{ patientId: overview.serving.patientId }}
              className="inline-flex items-center rounded-xl border border-white/20 px-3.5 py-2 text-xs font-semibold text-white"
            >
              Open chart
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-base font-semibold">Room empty</p>
          <p className="mt-1 text-sm text-[#8A8F8C]">Call the next patient from the queue</p>
          <button
            type="button"
            onClick={handleCallNext}
            disabled={!accepting || !overview.nextWaiting}
            className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3.5 py-2 pt-4 text-xs font-semibold text-white disabled:opacity-45"
          >
            <Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />
            Call next
          </button>
        </>
      )}
    </article>
  );

  const nextCard = (
    <article className="flex min-h-[148px] flex-col rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#8A8F8C]">UP NEXT</p>
        <Megaphone className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
      </div>
      {overview.nextWaiting && nextPatient ? (
        <>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#1B3B2E] sm:text-3xl">
            {formatDisplayToken(overview.nextWaiting.token)}
          </p>
          <p className="mt-0.5 text-base font-semibold text-[#1B3B2E] sm:text-lg">{nextPatient.name}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-[#8A8F8C]">{overview.nextWaiting.reason}</p>
          <p className="mt-auto pt-3 text-xs text-[#8A8F8C]">
            Avg wait {overview.avgWaitLabel} · {room}
          </p>
          <button
            type="button"
            onClick={handleCallNext}
            disabled={!accepting || !!overview.serving}
            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#B8735D] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-45"
          >
            Call now
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-base font-semibold text-[#1B3B2E]">No one waiting</p>
          <p className="mt-1 text-sm text-[#8A8F8C]">Waiting line is clear</p>
        </>
      )}
    </article>
  );

  const approvalsCard = (
    <article className="flex min-h-[148px] flex-col rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#8A8F8C]">APPROVALS</p>
        <Briefcase className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
      </div>
      {bookingRequests.length > 0 ? (
        <>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#1B3B2E] sm:text-4xl">
            {bookingRequests.length}
          </p>
          <p className="mt-0.5 text-sm font-medium text-[#1B3B2E]">Booking requests</p>
          <ul className="mt-2 space-y-2">
            {bookingRequests.slice(0, layout === "stack" ? 2 : 1).map((req) => {
              const patient = getQueuePatient(req.patientId);
              if (!patient) return null;
              return (
                <li
                  key={req.id}
                  className="flex items-center gap-2 rounded-xl border border-[#F0EDE9] bg-[#FAFAF8] px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#1B3B2E]">{patient.name}</p>
                    <p className="truncate text-[10px] text-[#8A8F8C]">
                      {req.time} · {formatRelativeLive(req.requestedAt, nowMs)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApprove(req.id, patient.name)}
                    className="shrink-0 rounded-lg bg-[#1B3B2E] px-2 py-1 text-[10px] font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    aria-label={`Decline ${patient.name}`}
                    onClick={() => dismissBooking(req.id)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#E8E4DF] text-[#8A8F8C]"
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </li>
              );
            })}
          </ul>
          {bookingRequests.length > (layout === "stack" ? 2 : 1) && (
            <Link
              to="/doctor/queue"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#B8735D]"
            >
              +{bookingRequests.length - (layout === "stack" ? 2 : 1)} more on queue
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-base font-semibold text-[#1B3B2E]">All caught up</p>
          <p className="mt-1 text-sm text-[#8A8F8C]">No pending booking requests</p>
        </>
      )}
    </article>
  );

  if (!accepting) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#F5E6B8] bg-[#F5E6B8]/50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#5C4A1E]" strokeWidth={1.75} />
          <p className="text-sm text-[#5C4A1E]">
            Queue paused —{" "}
            <Link to="/doctor/queue" className="font-semibold underline">
              resume on live queue
            </Link>
          </p>
        </div>
        <div
          className={cn(
            layout === "grid" ? "grid gap-3 sm:gap-4 lg:grid-cols-3" : "space-y-3",
          )}
        >
          {nowCard}
          {nextCard}
          {approvalsCard}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        layout === "grid" ? "grid gap-3 sm:gap-4 lg:grid-cols-3" : "space-y-3",
      )}
    >
      {nowCard}
      {nextCard}
      {approvalsCard}
    </div>
  );
}
