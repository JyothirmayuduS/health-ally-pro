import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  MapPin,
  User,
  UserPlus,
  Video,
} from "lucide-react";
import { ProfileEmptyState } from "@/components/doctor/profile/DoctorProfileSubpage";
import {
  formatDateKey,
  formatDisplayDate,
  formatVisitTime,
  getCalendarVisits,
  patientIdsForDate,
  parseDateKey,
  visitCountByDate,
  visitsWithPatients,
  type CalendarVisitStatus,
} from "@/lib/doctor-schedule-calendar";
import { getPanelPatient } from "@/lib/doctor-patients-apk-data";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { cn } from "@/lib/utils";

type CalendarViewMode = "month" | "week" | "agenda";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_STYLE: Record<CalendarVisitStatus, string> = {
  scheduled: "bg-[#F5E6B8] text-[#5C4A1E]",
  "in-progress": "bg-[#E8EFE6] text-[#1B3B2E]",
  completed: "bg-[#EDEAE6] text-[#6B6B6B]",
  cancelled: "bg-[#FCE8E6] text-[#C45C4A]",
};

function useIsMobileBelowLg() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function PatientAvatarChip({
  patientId,
  size = "sm",
}: {
  patientId: string;
  size?: "sm" | "md";
}) {
  const patient = getPanelPatient(patientId);
  if (!patient) return null;
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full font-bold text-[#1B3B2E]",
        size === "sm" ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]",
      )}
      style={{ backgroundColor: patient.accent }}
      title={patient.name}
    >
      {patient.initials}
    </span>
  );
}

function VisitDetailCard({
  visit,
  onOpenPatient,
  onAddToQueue,
}: {
  visit: ReturnType<typeof visitsWithPatients>[number];
  onOpenPatient: (patientId: string) => void;
  onAddToQueue?: (visit: ReturnType<typeof visitsWithPatients>[number]) => void;
}) {
  const { patient } = visit;

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#EDEAE6] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => onOpenPatient(patient.id)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-[#FAF9F7]"
      >
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-[#1B3B2E]"
          style={{ backgroundColor: patient.accent }}
        >
          {patient.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1B3B2E]">{patient.name}</p>
              <p className="text-xs text-[#8A8F8C]">
                {patient.age}y · {patient.gender} · {patient.patientRef}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                STATUS_STYLE[visit.status],
              )}
            >
              {visit.status.replace("-", " ")}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-[#1B3B2E]">{patient.condition}</p>
          {patient.alert && (
            <p className="mt-1 text-xs font-medium text-[#C45C4A]">{patient.alert}</p>
          )}
        </div>
      </button>

      <div className="border-t border-[#F0EDE8] bg-[#FAFAF8] px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8A8F8C]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B3B2E]">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            {formatVisitTime(visit.time)} · {visit.durationMin} min
          </span>
          <span>{visit.type}</span>
          <span className="inline-flex items-center gap-1">
            {visit.mode === "video" ? (
              <Video className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            {visit.mode === "video" ? "Video" : visit.room ?? "In-person"}
          </span>
        </div>
        {visit.notes && (
          <p className="mt-2 text-sm leading-relaxed text-[#1B3B2E]">{visit.notes}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/doctor/patients/$patientId"
            params={{ patientId: patient.id }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3 py-2 text-xs font-semibold text-white"
          >
            <User className="h-3.5 w-3.5" strokeWidth={1.75} />
            Open chart
          </Link>
          {onAddToQueue && visit.status !== "completed" && visit.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => onAddToQueue(visit)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#B8735D] px-3 py-2 text-xs font-semibold text-white"
            >
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Add to queue
            </button>
          )}
          <Link
            to="/doctor/queue"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#E8E4DF] bg-white px-3 py-2 text-xs font-semibold text-[#1B3B2E]"
          >
            Queue board
          </Link>
        </div>
      </div>
    </article>
  );
}

function DayDetailPanel({
  date,
  onOpenPatient,
  onAddToQueue,
  referenceDate,
}: {
  date: Date;
  onOpenPatient: (patientId: string) => void;
  onAddToQueue?: (visit: ReturnType<typeof visitsWithPatients>[number]) => void;
  referenceDate: Date;
}) {
  const dateKey = formatDateKey(date);
  const visits = visitsWithPatients(dateKey, referenceDate);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.12em] text-[#8A8F8C]">SELECTED DAY</p>
        <h2 className="font-serif text-xl font-semibold text-[#1B3B2E]">{formatDisplayDate(date)}</h2>
        <p className="mt-0.5 text-sm text-[#8A8F8C]">
          {visits.length === 0
            ? "No visits scheduled"
            : `${visits.length} visit${visits.length === 1 ? "" : "s"} · ${patientIdsForDate(dateKey, referenceDate).length} patient${patientIdsForDate(dateKey, referenceDate).length === 1 ? "" : "s"}`}
        </p>
      </div>

      {visits.length === 0 ? (
        <ProfileEmptyState
          title="No appointments"
          description="This day is clear. Bookings from reception and your slot settings will appear here."
            action={
            <Link
              to="/doctor/settings/slots"
              className="rounded-xl bg-[#1B3B2E] px-4 py-2 text-sm font-semibold text-white"
            >
              Set up booking slots
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {visits.map((visit) => (
            <li key={visit.id}>
              <VisitDetailCard
                visit={visit}
                onOpenPatient={onOpenPatient}
                onAddToQueue={onAddToQueue}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DoctorScheduleCalendarScreen({ selectedDateKey }: { selectedDateKey?: string }) {
  const navigate = useNavigate();
  const { addToQueue } = useLiveQueue();
  const today = useMemo(() => new Date(), []);
  const initialDate = parseDateKey(selectedDateKey ?? "") ?? today;
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const isMobileLayout = useIsMobileBelowLg();

  useEffect(() => {
    if (selectedDateKey) {
      const parsed = parseDateKey(selectedDateKey);
      if (parsed) {
        setSelectedDate(parsed);
        setViewMonth(parsed.getMonth());
        setViewYear(parsed.getFullYear());
      }
      return;
    }
    setSelectedDate(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    navigate({ to: "/doctor/schedule", search: { date: formatDateKey(today) }, replace: true });
  }, [selectedDateKey, today, navigate]);

  const visitCounts = useMemo(() => visitCountByDate(today), [today]);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    navigate({ to: "/doctor/schedule", search: { date: formatDateKey(date) } });
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const openPatient = (patientId: string) => {
    navigate({ to: "/doctor/patients/$patientId", params: { patientId } });
  };

  const handleAddToQueue = (visit: ReturnType<typeof visitsWithPatients>[number]) => {
    const result = addToQueue({
      patientId: visit.patientId,
      reason: visit.notes ?? visit.type,
      mode: visit.mode === "video" ? "Video" : "In-person",
      slot: visit.time,
    });
    if (result.alreadyInQueue) {
      toast.message("Already in queue", { description: `Token #${result.token}` });
    } else {
      toast.success("Added to queue", { description: `Token #${result.token}` });
    }
  };

  const weekStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  const agendaVisits = useMemo(() => {
    const all = getCalendarVisits(today);
    const start = formatDateKey(today);
    return all
      .filter((v) => v.date >= start)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 20);
  }, [today]);

  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = formatDateKey(today);
  const selectedKey = formatDateKey(selectedDate);

  return (
    <div className="mx-auto w-full max-w-2xl pb-8 lg:max-w-5xl">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">CLINIC</p>
          <h1 className="font-serif text-[1.75rem] font-semibold text-[#1B3B2E]">Schedule</h1>
          <p className="mt-0.5 text-sm text-[#8A8F8C]">Calendar · tap a date for visit details</p>
        </div>
        <Link
          to="/doctor/settings/slots"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E4DF] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1B3B2E] shadow-sm"
        >
          <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
          Booking slots
        </Link>
      </header>

      <div className="mb-4 flex gap-2">
        {(
          [
            { id: "month" as const, label: "Month" },
            { id: "week" as const, label: "Week" },
            { id: "agenda" as const, label: "Agenda" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setViewMode(m.id)}
            className={cn(
              "min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold",
              viewMode === m.id
                ? "bg-[#1B3B2E] text-white"
                : "border border-[#E8E4DF] bg-white text-[#8A8F8C]",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "space-y-5",
          !isMobileLayout && "lg:grid lg:grid-cols-[minmax(300px,1fr)_minmax(320px,400px)] lg:items-start lg:gap-6 lg:space-y-0",
        )}
      >
        <div className="rounded-[22px] border border-[#EDEAE6] bg-white p-4 shadow-sm sm:p-5">
          {viewMode === "agenda" ? (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <List className="h-4 w-4 text-[#B8735D]" />
                <h2 className="text-sm font-semibold text-[#1B3B2E]">Upcoming visits</h2>
              </div>
              <ul className="space-y-2">
                {agendaVisits.map((v) => {
                  const p = getPanelPatient(v.patientId);
                  const d = parseDateKey(v.date);
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => d && selectDate(d)}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-[#EDEAE6] px-3 py-2.5 text-left hover:bg-[#FAF9F7]"
                      >
                        <span className="w-14 shrink-0 text-xs font-bold text-[#B8735D]">
                          {d?.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-[#1B3B2E]">
                          {formatVisitTime(v.time)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1B3B2E]">
                          {p?.name ?? "Patient"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : viewMode === "week" ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1B3B2E]">Week view</h2>
                <button
                  type="button"
                  onClick={() => selectDate(today)}
                  className="text-xs font-semibold text-[#B8735D]"
                >
                  Today
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((date) => {
                  const dateKey = formatDateKey(date);
                  const count = visitCounts.get(dateKey) ?? 0;
                  const isSelected = dateKey === selectedKey;
                  const isToday = dateKey === todayKey;
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectDate(date)}
                      className={cn(
                        "flex min-h-[72px] flex-col items-center rounded-xl p-1 text-center",
                        isSelected ? "bg-[#1B3B2E] text-white" : isToday ? "bg-[#F0DDD6]" : "hover:bg-[#FAF9F7]",
                      )}
                    >
                      <span className="text-[10px] font-medium opacity-80">
                        {date.toLocaleDateString("en-GB", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-bold tabular-nums">{date.getDate()}</span>
                      {count > 0 && (
                        <span className={cn("text-[10px] font-bold", isSelected ? "text-white/80" : "text-[#B8735D]")}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1B3B2E]">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E8E4DF] text-[#8A8F8C] hover:bg-[#FAF9F7]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => selectDate(today)}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-[#B8735D] hover:bg-[#F0DDD6]/40"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E8E4DF] text-[#8A8F8C] hover:bg-[#FAF9F7]"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[10px] font-semibold tracking-wide text-[#8A8F8C]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day == null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }
              const date = new Date(viewYear, viewMonth, day);
              const dateKey = formatDateKey(date);
              const count = visitCounts.get(dateKey) ?? 0;
              const patientIds = patientIdsForDate(dateKey, today);
              const isSelected = dateKey === selectedKey;
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-start rounded-xl p-1 transition-colors",
                    isSelected
                      ? "bg-[#1B3B2E] text-white ring-2 ring-[#B8735D]/30"
                      : isToday
                        ? "bg-[#F0DDD6] text-[#1B3B2E]"
                        : count > 0
                          ? "bg-[#E8EFE6]/60 text-[#1B3B2E] hover:bg-[#E8EFE6]"
                          : "text-[#8A8F8C] hover:bg-[#FAF9F7]",
                  )}
                >
                  <span className={cn("text-sm font-bold tabular-nums", isSelected && "text-white")}>
                    {day}
                  </span>
                  {count > 0 && (
                    <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                      {patientIds.slice(0, 3).map((id) => (
                        <PatientAvatarChip key={id} patientId={id} />
                      ))}
                    </div>
                  )}
                  {count > 3 && (
                    <span
                      className={cn(
                        "mt-0.5 text-[9px] font-bold",
                        isSelected ? "text-white/80" : "text-[#8A8F8C]",
                      )}
                    >
                      +{count - 3}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
            </>
          )}
        </div>

        <div className="rounded-[22px] border border-[#EDEAE6] bg-[#F7F5F2] p-4 lg:p-5">
          <DayDetailPanel
            date={selectedDate}
            onOpenPatient={openPatient}
            onAddToQueue={handleAddToQueue}
            referenceDate={today}
          />
        </div>
      </div>
    </div>
  );
}
