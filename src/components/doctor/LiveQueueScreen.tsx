import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Briefcase,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  DoorOpen,
  Megaphone,
  MessageCircle,
  Smartphone,
  Stethoscope,
  X,
} from "lucide-react";
import { DoctorClinicStatusBar } from "@/components/doctor/DoctorClinicStatusBar";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import {
  computeQueueStatsLive,
  formatCalledAt,
  formatConsultTimer,
  formatDisplayToken,
  formatLiveClock,
  formatQueueDate,
  formatRelativeLive,
  formatWaitLive,
  getQueueAlerts,
  getQueuePatient,
  type BookingRequest,
  type LiveQueueEntry,
} from "@/lib/doctor-live-queue";
import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import { cn } from "@/lib/utils";

function avatarBg(patientId: string, accent: string) {
  const soft: Record<string, string> = {
    p1: "#F0DDD6",
    p2: "#E8EFE6",
    p3: "#F5E6B8",
    p4: "#E8EFE6",
    p5: "#F5F2ED",
  };
  return soft[patientId] ?? accent;
}
function PatientAvatar({
  initials,
  accent,
  size = "md",
}: {
  initials: string;
  accent: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-sm",
  };
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-[#1B3B2E]",
        sizes[size],
      )}
      style={{ backgroundColor: accent }}
    >
      {initials}
    </span>
  );
}

function NowServingCard({
  serving,
  patient,
  room,
  nowMs,
  onDone,
  variant = "mobile",
}: {
  serving: LiveQueueEntry;
  patient: PanelPatient;
  room: string;
  nowMs: number;
  onDone: () => void;
  variant?: "mobile" | "desk";
}) {
  const isUrgent = patient.status === "Urgent";
  const consultTimer = formatConsultTimer(serving.servingStartedAt, nowMs);
  const calledLabel = formatCalledAt(serving.calledAt ?? serving.servingStartedAt);
  const waitBeforeCall = formatWaitLive(
    { ...serving, status: "waiting", checkInAt: serving.checkInAt },
    serving.servingStartedAt
      ? new Date(serving.servingStartedAt).getTime()
      : nowMs,
  );

  if (variant === "desk") {
    return (
      <article className="overflow-hidden rounded-2xl border border-[#254A3A]/80 bg-gradient-to-br from-[#1F4234] to-[#1B3B2E] text-white shadow-[0_8px_32px_rgba(27,59,46,0.22)]">
        <div className="h-1 bg-gradient-to-r from-[#B8735D] via-[#E8EFE6] to-[#B8735D]/40" />
        <div className="p-5">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7A9B7E] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A9B7E]" />
              </span>
              <p className="text-[11px] font-bold tracking-[0.14em] text-white/85">NOW SERVING</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2">
                <p className="text-[9px] font-semibold tracking-wider text-white/45">IN CONSULT</p>
                <p className="font-mono text-2xl font-semibold tabular-nums leading-none text-white">
                  {consultTimer}
                </p>
              </div>
              <div className="hidden text-right text-[11px] text-white/55 xl:block">
                {calledLabel && <p>{calledLabel}</p>}
                <p>Waited {waitBeforeCall}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                <DoorOpen className="h-3.5 w-3.5" strokeWidth={2} />
                {room}
              </span>
            </div>
          </div>

          {/* Token + patient — horizontal */}
          <div className="mt-4 flex gap-5">
            <div className="shrink-0 border-r border-white/10 pr-5 text-center">
              <p className="font-serif text-5xl font-semibold leading-none text-white">
                {String(serving.token).padStart(2, "0")}
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-wider text-white/45">TOKEN</p>
              <p className="text-sm font-semibold text-white/80">{formatDisplayToken(serving.token)}</p>
              {serving.slot && (
                <p className="mt-0.5 text-[11px] text-white/50">Slot {serving.slot}</p>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <PatientAvatar
                  initials={patient.initials}
                  accent={avatarBg(serving.patientId, patient.accent)}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/doctor/patients/$patientId"
                      params={{ patientId: serving.patientId }}
                      className="text-lg font-semibold text-white hover:underline"
                    >
                      {patient.name}
                    </Link>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                      {patient.patientRef}
                    </span>
                    {isUrgent && (
                      <span className="rounded-full bg-[#C45C4A] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-white/60">
                    {patient.condition} · {patient.gender === "M" ? "Male" : "Female"} · {patient.age}y
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{serving.reason}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80">
                  <Stethoscope className="h-3 w-3" strokeWidth={1.75} />
                  {serving.mode}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#7A9B7E]/30 px-2.5 py-1 text-[10px] font-medium text-[#E8EFE6]">
                  <Clock className="h-3 w-3 animate-pulse" strokeWidth={1.75} />
                  {consultTimer} elapsed
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/65">
                  Checked in {serving.checkInTime}
                </span>
                {calledLabel && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/65 xl:hidden">
                    {calledLabel}
                  </span>
                )}
              </div>
              {patient.allergyWarning && (
                <p className="mt-2 rounded-lg border border-[#C45C4A]/30 bg-[#C45C4A]/15 px-3 py-1.5 text-[11px] text-[#FCE8E6]">
                  {patient.allergyWarning}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onDone}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B8735D] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(184,115,93,0.4)] hover:bg-[#A66550]"
            >
              <Check className="h-4 w-4" strokeWidth={2.25} />
              Done — release room
            </button>
            <div className="grid grid-cols-3 gap-2">
              <Link
                to="/doctor/vitals"
                search={{ patientId: patient.id }}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-[#254A3A] py-2.5 text-white hover:bg-[#2d5846]"
              >
                <Stethoscope className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span className="text-[10px] font-semibold">Vitals</span>
              </Link>
              <Link
                to="/doctor/encounters"
                search={{ patientId: patient.id }}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-[#254A3A] py-2.5 text-white hover:bg-[#2d5846]"
              >
                <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span className="text-[10px] font-semibold">Note</span>
              </Link>
              <Link
                to="/doctor/messaging"
                search={{ patientId: patient.id }}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-[#254A3A] py-2.5 text-white hover:bg-[#2d5846]"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span className="text-[10px] font-semibold">Chat</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#254A3A]/80 bg-gradient-to-b from-[#1F4234] to-[#1B3B2E] text-white shadow-[0_12px_40px_rgba(27,59,46,0.28)] sm:rounded-[24px]">
      <div className="h-1 bg-gradient-to-r from-[#B8735D] via-[#E8EFE6] to-[#B8735D]/40" />

      <div className="px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7A9B7E] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A9B7E]" />
            </span>
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/80">NOW SERVING</p>
          </div>
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:px-3">
            <DoorOpen className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{room}</span>
          </span>
        </div>

        {/* Live consult timer */}
        <div className="mt-3 flex flex-col gap-2 rounded-[14px] border border-white/10 bg-black/15 px-3 py-2.5 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.12em] text-white/45">IN CONSULT</p>
            <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight text-white sm:text-2xl">
              {consultTimer}
            </p>
          </div>
          <div className="text-left text-[11px] text-white/55 sm:text-right">
            {calledLabel && <p>{calledLabel}</p>}
            <p className="mt-0.5">Waited {waitBeforeCall}</p>
          </div>
        </div>

        {/* Token hero */}
        <div className="mt-4 flex items-end gap-3 border-b border-white/10 pb-4 sm:mt-5 sm:gap-4 sm:pb-5">
          <p className="font-serif text-[3rem] font-semibold leading-[0.85] tracking-tight text-white sm:text-[4rem] lg:text-[4.5rem]">
            {String(serving.token).padStart(2, "0")}
          </p>
          <div className="mb-1 min-w-0 flex-1 space-y-0.5 sm:mb-1.5 sm:flex-none">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-white/45">TOKEN</p>
            <p className="truncate text-sm font-semibold text-white/90 sm:text-base">
              {formatDisplayToken(serving.token)}
            </p>
            {serving.slot && (
              <p className="text-[11px] text-white/50">Slot {serving.slot}</p>
            )}
          </div>
        </div>

        {/* Patient panel */}
        <div className="mt-3.5 rounded-[16px] border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-[2px] sm:mt-4 sm:rounded-[18px] sm:p-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <PatientAvatar
              initials={patient.initials}
              accent={avatarBg(serving.patientId, patient.accent)}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Link
                  to="/doctor/patients/$patientId"
                  params={{ patientId: serving.patientId }}
                  className="text-base font-semibold leading-tight text-white hover:underline sm:text-[1.125rem]"
                >
                  {patient.name}
                </Link>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">
                  {patient.patientRef}
                </span>
                {isUrgent && (
                  <span className="rounded-full bg-[#C45C4A]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Urgent
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/65 sm:text-sm">
                {patient.condition} · {patient.gender === "M" ? "Male" : "Female"} · {patient.age}y
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80 sm:mt-2.5">{serving.reason}</p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/85">
              <Stethoscope className="h-3 w-3" strokeWidth={1.75} />
              {serving.mode}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#7A9B7E]/25 px-2.5 py-1 text-[10px] font-semibold text-[#E8EFE6]">
              <Clock className="h-3 w-3 animate-pulse" strokeWidth={1.75} />
              {consultTimer} elapsed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70">
              Checked in {serving.checkInTime}
            </span>
            {calledLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/70">
                {calledLabel}
              </span>
            )}
          </div>

          {patient.allergyWarning && (
            <p className="mt-3 rounded-xl border border-[#C45C4A]/30 bg-[#C45C4A]/15 px-3 py-2 text-[11px] leading-snug text-[#FCE8E6]">
              {patient.allergyWarning}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3.5 space-y-2 sm:mt-4">
          <button
            type="button"
            onClick={onDone}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#B8735D] px-3 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(184,115,93,0.45)] transition-colors hover:bg-[#A66550]"
          >
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Done — release room
          </button>
          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/doctor/vitals"
              search={{ patientId: patient.id }}
              className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-white/15 bg-[#254A3A] py-3 text-white transition-colors hover:bg-[#2d5846]"
            >
              <Stethoscope className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="text-[10px] font-semibold">Vitals</span>
            </Link>
            <Link
              to="/doctor/encounters"
              search={{ patientId: patient.id }}
              className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-white/15 bg-[#254A3A] py-3 text-white transition-colors hover:bg-[#2d5846]"
            >
              <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="text-[10px] font-semibold">Note</span>
            </Link>
            <Link
              to="/doctor/messaging"
              search={{ patientId: patient.id }}
              className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-white/15 bg-[#254A3A] py-3 text-white transition-colors hover:bg-[#2d5846]"
            >
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="text-[10px] font-semibold">Chat</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function BookingRequestsPanel({
  requests,
  nowMs,
  onApprove,
  onDismiss,
  variant = "default",
  hideHeader = false,
}: {
  requests: BookingRequest[];
  nowMs: number;
  onApprove: (id: string, name: string) => void;
  onDismiss: (id: string, name: string) => void;
  variant?: "default" | "sidebar";
  hideHeader?: boolean;
}) {
  if (requests.length === 0) return null;

  return (
    <section className={cn("min-w-0", variant === "sidebar" && !hideHeader && "flex h-full flex-col")}>
      {!hideHeader && (
      <div
        className={cn(
          variant === "sidebar" && "shrink-0 border-b border-[#EDEAE6] pb-3",
        )}
      >
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0 text-[#B8735D]" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-[#1B3B2E]">Booking requests</h2>
          <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#E9A820] px-1.5 text-[10px] font-bold text-white">
            {requests.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#8A8F8C]">
          Approve to assign a queue token and notify the patient app.
        </p>
      </div>
      )}
      <div
        className={cn(
          "space-y-2.5",
          variant === "sidebar" && !hideHeader && "min-h-0 flex-1 overflow-y-auto pt-3 [scrollbar-width:thin] [scrollbar-color:#D4CFC8_transparent]",
          hideHeader && "space-y-2",
        )}
      >
        {requests.map((request) => {
          const patient = getQueuePatient(request.patientId);
          if (!patient) return null;
          return (
            <article
              key={request.id}
              className="relative min-w-0 overflow-hidden rounded-[16px] border border-[#EDEAE6] bg-white p-3.5 shadow-[0_2px_12px_rgba(27,59,46,0.05)] sm:rounded-[18px] sm:p-4"
            >
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#E9A820]" />
              <div className="flex items-start gap-3 pl-2">
                <PatientAvatar
                  initials={patient.initials}
                  accent={avatarBg(request.patientId, patient.accent)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#1B3B2E]">{patient.name}</p>
                    <span className="text-[10px] font-medium text-[#8A8F8C]">
                      {patient.patientRef}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8A8F8C]">
                    {request.time} · {request.mode}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-[#1B3B2E]">{request.reason}</p>
                  <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-[11px] text-[#8A8F8C]">
                    <Smartphone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    {formatRelativeLive(request.requestedAt, nowMs)}
                    {request.source === "patient-app" ? " · Patient app" : " · Reception"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 pl-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => onDismiss(request.id, patient.name)}
                  className="order-2 grid h-10 w-full place-items-center rounded-xl border border-[#E8E4DF] bg-white text-[#8A8F8C] sm:order-1 sm:w-10"
                  aria-label={`Decline ${patient.name}`}
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(request.id, patient.name)}
                  className="order-1 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1B3B2E] px-4 text-xs font-semibold text-white sm:order-2 sm:w-auto"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  Add to queue
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function LiveQueueScreen() {
  const {
    accepting,
    room,
    entries,
    bookingRequests,
    toggleAccepting,
    approveBooking,
    dismissBooking,
    callNext,
    callWaiting,
    markDone,
  } = useLiveQueue();

  const [showCompleted, setShowCompleted] = useState(true);
  const [showBookingsMobile, setShowBookingsMobile] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onCallNext = () => callNext();
    window.addEventListener("medora-doctor-queue-call-next", onCallNext);
    return () => window.removeEventListener("medora-doctor-queue-call-next", onCallNext);
  }, [callNext]);

  const now = new Date(nowMs);

  const serving = entries.find((e) => e.status === "serving");
  const waiting = entries
    .filter((e) => e.status === "waiting")
    .sort((a, b) => a.token - b.token);
  const completed = entries
    .filter((e) => e.status === "completed")
    .sort((a, b) => a.token - b.token);

  const stats = computeQueueStatsLive(entries, nowMs);
  const alerts = getQueueAlerts(entries, bookingRequests.length, nowMs);
  const servingPatient = serving ? getQueuePatient(serving.patientId) : null;

  const handleApprove = (id: string, name: string) => {
    const token = approveBooking(id);
    if (token == null) return;
    toast.success(`${name} added to queue`, {
      description: `${formatDisplayToken(token)} assigned · Push sent to patient app`,
    });
  };

  const handleDismiss = (name: string) => {
    toast("Booking declined", { description: `${name} was not added to the queue` });
  };

  const handleCallNext = () => {
    if (!waiting.length) {
      toast.error("No patients waiting in line");
      return;
    }
    callNext();
    const next = waiting[0]!;
    const patient = getQueuePatient(next.patientId);
    toast.success(`Calling ${patient?.name ?? "patient"}`, {
      description: `Token ${formatDisplayToken(next.token)} · ${room}`,
    });
  };

  const handleCall = (entryId: string, name: string, token: number) => {
    callWaiting(entryId);
    toast.success(`Calling ${name}`, {
      description: `Token ${formatDisplayToken(token)} · ${room}`,
    });
  };

  const handleDone = () => {
    if (!serving || !servingPatient) return;
    markDone();
    toast.success(`${servingPatient.name} marked complete`, {
      description: "Room ready for next patient",
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        if (accepting && waiting.length > 0) handleCallNext();
      } else if (key === "d" && serving) {
        e.preventDefault();
        handleDone();
      } else if (key === "p") {
        e.preventDefault();
        toggleAccepting();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accepting, waiting.length, serving, toggleAccepting]);

  const callNextButton = (
    <button
      type="button"
      onClick={handleCallNext}
      disabled={!accepting || waiting.length === 0}
      className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#B8735D] py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(184,115,93,0.35)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45 sm:py-4"
    >
      <Megaphone className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      Call next patient
      <span className="hidden rounded-md border border-white/25 px-1.5 py-0.5 text-[10px] font-medium text-white/70 lg:inline">
        N
      </span>
    </button>
  );

  const nowServingMobile =
    serving && servingPatient ? (
      <NowServingCard
        serving={serving}
        patient={servingPatient}
        room={room}
        nowMs={nowMs}
        onDone={handleDone}
        variant="mobile"
      />
    ) : (
      <article className="rounded-[20px] border border-dashed border-[#E8E4DF] bg-white px-4 py-7 text-center sm:rounded-[22px] sm:px-5 sm:py-8">
        <p className="text-sm font-semibold text-[#1B3B2E]">No patient in room</p>
        <p className="mt-1 text-xs text-[#8A8F8C]">
          Call the next patient or approve a booking request.
        </p>
      </article>
    );

  const nowServingDesk =
    serving && servingPatient ? (
      <NowServingCard
        serving={serving}
        patient={servingPatient}
        room={room}
        nowMs={nowMs}
        onDone={handleDone}
        variant="desk"
      />
    ) : (
      <article className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E4DF] bg-white px-6 py-10 text-center">
        <DoorOpen className="mb-3 h-8 w-8 text-[#C4C0BA]" strokeWidth={1.5} />
        <p className="text-base font-semibold text-[#1B3B2E]">Room is empty</p>
        <p className="mt-1 max-w-xs text-sm text-[#8A8F8C]">
          Call the next patient from the waiting line or approve a booking request.
        </p>
      </article>
    );

  const deskStatsBar = (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 border-r border-[#EDEAE6] pr-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C45C4A] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C45C4A]" />
        </span>
        <span className="text-[11px] font-bold tracking-[0.12em] text-[#C45C4A]">LIVE OPD</span>
      </div>
      {[
        { value: String(stats.inLine), label: "In line" },
        { value: String(stats.waiting), label: "Waiting" },
        { value: stats.avgWaitLabel, label: "Avg wait" },
      ].map((stat, i) => (
        <div
          key={stat.label}
          className={cn("flex items-baseline gap-2", i < 2 && "border-r border-[#EDEAE6] pr-4")}
        >
          <span className="text-xl font-bold tabular-nums text-[#1B3B2E]">{stat.value}</span>
          <span className="text-[11px] font-medium text-[#8A8F8C]">{stat.label}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#8A8F8C]">
        <DoorOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
        {room}
      </div>
    </div>
  );

  const waitingDesk =
    waiting.length > 0 ? (
      <section className="flex min-h-0 flex-col rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EDEAE6] px-4 py-3">
          <p className="text-xs font-bold tracking-[0.12em] text-[#8A8F8C]">WAITING LINE</p>
          <span className="rounded-full bg-[#E8EFE6] px-2 py-0.5 text-[10px] font-bold text-[#1B3B2E]">
            {waiting.length}
          </span>
        </div>
        <div className="divide-y divide-[#F0EDE9]">
          {waiting.map((entry) => {
            const patient = getQueuePatient(entry.patientId);
            if (!patient) return null;
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF8]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#E8EFE6] text-sm font-bold text-[#1B3B2E]">
                  {String(entry.token).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-[#1B3B2E]">{patient.name}</p>
                    {patient.status === "Urgent" && (
                      <span className="shrink-0 rounded-full bg-[#FCE8E6] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#C45C4A]">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-[#8A8F8C]">{entry.reason}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#8A8F8C]">
                  {formatWaitLive(entry, nowMs)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCall(entry.id, patient.name, entry.token)}
                  disabled={!accepting}
                  className="shrink-0 rounded-lg bg-[#1B3B2E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Call
                </button>
                <Link
                  to="/doctor/patients/$patientId"
                  params={{ patientId: entry.patientId }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#E8E4DF] text-[#8A8F8C] hover:bg-[#F5F2ED]"
                  aria-label={`Chart for ${patient.name}`}
                >
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    ) : (
      <section className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-[#E8E4DF] bg-white/60 px-4 py-8 text-center">
        <p className="text-sm text-[#8A8F8C]">No patients waiting</p>
      </section>
    );

  const completedDesk =
    completed.length > 0 ? (
      <section className="flex min-h-0 flex-col rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="flex items-center justify-between border-b border-[#EDEAE6] px-4 py-3 text-left hover:bg-[#FAFAF8]"
        >
          <p className="text-xs font-bold tracking-[0.12em] text-[#8A8F8C]">
            COMPLETED TODAY
          </p>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-[#F0DDD6] px-2 py-0.5 text-[10px] font-bold text-[#B8735D]">
              {completed.length}
            </span>
            <span className="text-[11px] font-semibold text-[#B8735D]">
              {showCompleted ? "Hide" : "Show"}
            </span>
          </span>
        </button>
        {showCompleted && (
          <div className="divide-y divide-[#F0EDE9]">
            {completed.map((entry) => {
              const patient = getQueuePatient(entry.patientId);
              if (!patient) return null;
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAF8]">
                  <span className="w-10 shrink-0 text-[10px] font-bold text-[#8A8F8C]">
                    {formatDisplayToken(entry.token)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1B3B2E]">{patient.name}</p>
                    <p className="truncate text-[11px] text-[#8A8F8C]">
                      {entry.completedLabel ?? `${entry.checkInTime} · ${entry.mode}`}
                    </p>
                  </div>
                  <Link
                    to="/doctor/patients/$patientId"
                    params={{ patientId: entry.patientId }}
                    className="shrink-0 text-[11px] font-semibold text-[#B8735D] hover:underline"
                  >
                    Chart
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    ) : null;

  const nowServingPanel = nowServingMobile;

  const handleDismissBooking = (id: string, name: string) => {
    dismissBooking(id);
    handleDismiss(name);
  };

  const bookingPanelMobile = bookingRequests.length > 0 && (
    <section className="min-w-0 space-y-2">
      <button
        type="button"
        onClick={() => setShowBookingsMobile((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3 text-left shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-[#1B3B2E]">
            {bookingRequests.length} booking request{bookingRequests.length > 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#B8735D]">
          {showBookingsMobile ? "Hide" : "Review"}
        </span>
      </button>
      {showBookingsMobile && (
        <BookingRequestsPanel
          requests={bookingRequests}
          nowMs={nowMs}
          onApprove={handleApprove}
          onDismiss={handleDismissBooking}
        />
      )}
    </section>
  );

  const statsRow = (
    <section className="min-w-0">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C45C4A] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C45C4A]" />
          </span>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#C45C4A]">LIVE OPD QUEUE</p>
        </div>
        <p className="truncate text-xs font-semibold text-[#8A8F8C]">{room}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: String(stats.inLine), label: "IN LINE" },
          { value: String(stats.waiting), label: "WAITING" },
          { value: stats.avgWaitLabel, label: "AVG WAIT" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-2xl border border-[#EDEAE6] bg-white px-3 py-3 text-center shadow-sm"
          >
            <p className="truncate text-lg font-bold tabular-nums text-[#1B3B2E]">{stat.value}</p>
            <p className="mt-0.5 truncate text-[9px] font-semibold tracking-[0.1em] text-[#8A8F8C]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

  const hasBookings = bookingRequests.length > 0;

  const waitingSection = waiting.length > 0 && (
    <section className="min-w-0 space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8A8F8C]">WAITING LINE</p>
      <div className="space-y-2">
        {waiting.map((entry) => {
          const patient = getQueuePatient(entry.patientId);
          if (!patient) return null;
          return (
            <article
              key={entry.id}
              className="flex items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-3 shadow-sm"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8EFE6] text-sm font-bold text-[#1B3B2E]">
                {String(entry.token).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-semibold text-[#1B3B2E]">{patient.name}</p>
                  {patient.status === "Urgent" && (
                    <span className="rounded-full bg-[#FCE8E6] px-2 py-0.5 text-[9px] font-bold uppercase text-[#C45C4A]">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[#8A8F8C]">{entry.reason}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1 font-mono text-[10px] tabular-nums text-[#8A8F8C]">
                  <Clock className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  <span>{formatWaitLive(entry, nowMs)} wait</span>
                  {entry.slot ? <span>· {entry.slot}</span> : null}
                  {entry.mode === "Walk-in" ? <span>· Walk-in</span> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCall(entry.id, patient.name, entry.token)}
                disabled={!accepting}
                className="shrink-0 rounded-xl bg-[#1B3B2E] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-45"
              >
                Call
              </button>
              <Link
                to="/doctor/patients/$patientId"
                params={{ patientId: entry.patientId }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E8E4DF] text-[#8A8F8C]"
                aria-label={`Open chart for ${patient.name}`}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );

  const completedSection = completed.length > 0 && (
    <section className="min-w-0 space-y-2">
      <button
        type="button"
        onClick={() => setShowCompleted((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <p className="text-sm font-semibold text-[#1B3B2E]">
          Completed today ({completed.length})
        </p>
        <span className="text-xs font-semibold text-[#B8735D]">
          {showCompleted ? "Hide" : "Show"}
        </span>
      </button>
      {showCompleted && (
        <div className="space-y-1.5">
          {completed.map((entry) => {
            const patient = getQueuePatient(entry.patientId);
            if (!patient) return null;
            return (
              <div
                key={entry.id}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#EDEAE6] bg-white px-3 py-2.5"
              >
                <span className="shrink-0 text-[10px] font-bold text-[#8A8F8C]">
                  {formatDisplayToken(entry.token)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1B3B2E]">{patient.name}</p>
                  <p className="truncate text-xs text-[#8A8F8C]">
                    {entry.completedLabel ?? `${entry.checkInTime} · ${entry.mode}`}
                  </p>
                </div>
                <Link
                  to="/doctor/patients/$patientId"
                  params={{ patientId: entry.patientId }}
                  className="shrink-0 text-xs font-semibold text-[#B8735D]"
                >
                  Chart
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const pausedBanner = !accepting && (
    <p className="rounded-xl border border-[#F5E6B8] bg-[#F5E6B8]/40 px-4 py-3 text-center text-xs text-[#5C4A1E]">
      Queue paused — patients cannot be called until you resume accepting.
    </p>
  );

  return (
    <div className={cn("w-full min-w-0 lg:pb-8", serving ? "pb-8" : "pb-32")}>
      <DoctorClinicStatusBar variant="pill" />

      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold leading-tight text-[#1B3B2E] sm:text-[1.75rem]">
            Live queue
          </h1>
          <p className="mt-0.5 text-sm text-[#8A8F8C]">{formatQueueDate(now)}</p>
          {!serving && waiting.length > 0 && (
            <p className="mt-1 text-xs font-semibold text-[#B8735D] lg:hidden">
              Next: {formatDisplayToken(waiting[0]!.token)} · {getQueuePatient(waiting[0]!.patientId)?.name}
            </p>
          )}
          <p className="mt-1 hidden text-[11px] text-[#ADADAD] lg:block">
            Shortcuts: <kbd className="rounded border border-[#E8E4DF] px-1">N</kbd> call next ·{" "}
            <kbd className="rounded border border-[#E8E4DF] px-1">D</kbd> mark done ·{" "}
            <kbd className="rounded border border-[#E8E4DF] px-1">P</kbd> pause
          </p>
          <p className="mt-1 inline-flex max-w-full flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#7A9B7E]">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7A9B7E] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#7A9B7E]" />
            </span>
            <span className="break-all sm:break-normal">
              Live · synced {formatLiveClock(now)}
            </span>
          </p>
        </div>
        {alerts.length === 0 && (
          <button
            type="button"
            aria-label="Queue alerts"
            onClick={() => {
              toast.message("No queue alerts", { description: "Everything looks on track." });
            }}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E8E4DF] bg-white text-[#8A8F8C]"
          >
            <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        )}
      </header>

      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="flex items-start gap-3 rounded-xl border border-[#F5E6B8] bg-[#F5E6B8]/40 px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C45C4A]" strokeWidth={1.75} />
              <p className="text-sm text-[#5C4A1E]">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Mobile / tablet: now serving first ── */}
      <div className="mt-5 space-y-5 lg:hidden">
        {pausedBanner}
        {nowServingPanel}
        {statsRow}
        {waitingSection}
        {bookingPanelMobile}
        {completedSection}
      </div>

      {/* Sticky call-next — only when no active consult (Done lives on the serving card) */}
      {!serving && (
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4 lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
            <button
              type="button"
              onClick={handleCallNext}
              disabled={!accepting || waiting.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#B8735D] py-3.5 text-sm font-semibold text-white shadow-lg disabled:opacity-45"
            >
              <Megaphone className="h-4 w-4" strokeWidth={1.75} />
              Call next
            </button>
        </div>
      </div>
      )}

      {/* ── Desktop: OPD control desk ── */}
      <div className="mt-6 hidden space-y-5 lg:block">
        {pausedBanner}

        {deskStatsBar}

        {/* Primary zone: now serving + booking rail */}
        <div
          className={cn(
            "grid gap-5",
            hasBookings
              ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]"
              : "grid-cols-1",
          )}
        >
          <div className="flex min-w-0 flex-col gap-4">
            {nowServingDesk}
            <button
              type="button"
              onClick={handleCallNext}
              disabled={!accepting || waiting.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B8735D] py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(184,115,93,0.3)] transition-opacity hover:bg-[#A66550] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Megaphone className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              Call next patient
              {waiting.length > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                  {formatDisplayToken(waiting[0]!.token)} next
                </span>
              )}
            </button>
          </div>

          {hasBookings && (
            <aside className="sticky top-6 flex max-h-[calc(100dvh-10rem)] min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm">
              <div className="shrink-0 border-b border-[#EDEAE6] bg-[#FAFAF8] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#B8735D]" strokeWidth={1.75} />
                  <h2 className="text-sm font-semibold text-[#1B3B2E]">Booking requests</h2>
                  <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#E9A820] px-1.5 text-[10px] font-bold text-white">
                    {bookingRequests.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#8A8F8C]">
                  Approve to assign token & notify patient
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin] [scrollbar-color:#D4CFC8_transparent]">
                <BookingRequestsPanel
                  requests={bookingRequests}
                  nowMs={nowMs}
                  onApprove={handleApprove}
                  onDismiss={handleDismissBooking}
                  variant="sidebar"
                  hideHeader
                />
              </div>
            </aside>
          )}
        </div>

        {/* Secondary zone: waiting + completed side by side */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {waitingDesk}
          {completedDesk}
        </div>
      </div>
    </div>
  );
}
