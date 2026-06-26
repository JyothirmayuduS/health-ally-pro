import { Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  ChefHat,
  Dumbbell,
  FileText,
  Pill,
  Search,
  Settings,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CareContactActions } from "@/components/patient/CareContactActions";
import { LiveQueueHeroCard } from "@/components/patient/LiveQueueHeroCard";
import { HomeMedCard } from "@/components/patient/medications/HomeMedCard";
import { PatientProgressStrip } from "@/components/patient/PatientProgressStrip";
import { PatientViewAllPill } from "@/components/patient/PatientViewAllPill";
import { usePatientAppointments } from "@/hooks/usePatientAppointments";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import { doctors, reports } from "@/lib/mock-data";
import { getNextMealPreview } from "@/lib/diet-mock-data";
import { getPatientExerciseContext } from "@/lib/exercise-ai-client";
import { exerciseRoutines } from "@/lib/exercise-mock-data";
import { getTopExercisePicks } from "@/lib/exercise-recovery-picks";
import {
  EXERCISE_SESSION_EVENT,
  getTodayAdherence,
  isRoutineCompletedToday,
} from "@/lib/exercise-session-store";
import { getTimeAwareGreeting } from "@/lib/patient-greeting";
import { getLiveQueueContext } from "@/lib/patient-queue";
import {
  formatRxRelative,
  listPatientPrescriptions,
  PATIENT_RX_EVENT,
} from "@/lib/patient-prescription-store";
import { openPatientSearch } from "@/lib/patient-search";
import { unreadNotificationCount } from "@/lib/patient-notifications-store";
import { fetchPatientProfile } from "@/lib/supabase/queries";
import {
  appointmentStatusColor,
  appointmentStatusLabel,
  formatVisitDateShort,
} from "@/lib/patient-appointments-ui";

const NEXT_MEAL = getNextMealPreview();
const NEXT_EXERCISE = getTopExercisePicks(
  exerciseRoutines,
  getPatientExerciseContext(),
  1,
)[0]?.routine;

function statusLabel(status: string) {
  return appointmentStatusLabel(status as "in-queue" | "upcoming" | "completed" | "cancelled");
}

function statusColor(status: string) {
  return appointmentStatusColor(status as "in-queue" | "upcoming" | "completed" | "cancelled");
}

type FocusTask = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  params?: Record<string, string>;
  icon: typeof Pill;
  accent: string;
  action?: string;
};

export function PatientMobileDashboard() {
  const [patientName, setPatientName] = useState("Guest");
  const [unreadCount, setUnreadCount] = useState(0);
  const [exerciseTick, setExerciseTick] = useState(0);
  const [rxList, setRxList] = useState(listPatientPrescriptions());
  const { meds, toggle } = usePatientMedications();
  const { appointments } = usePatientAppointments();

  useEffect(() => {
    fetchPatientProfile().then((p) => setPatientName(p.name));
    setUnreadCount(unreadNotificationCount());
    const onNotif = () => setUnreadCount(unreadNotificationCount());
    window.addEventListener("medora-notifications-changed", onNotif);
    return () => window.removeEventListener("medora-notifications-changed", onNotif);
  }, []);

  useEffect(() => {
    const refresh = () => setRxList(listPatientPrescriptions());
    refresh();
    window.addEventListener(PATIENT_RX_EVENT, refresh);
    return () => window.removeEventListener(PATIENT_RX_EVENT, refresh);
  }, []);

  useEffect(() => {
    const onExercise = () => setExerciseTick((t) => t + 1);
    window.addEventListener(EXERCISE_SESSION_EVENT, onExercise);
    return () => window.removeEventListener(EXERCISE_SESSION_EVENT, onExercise);
  }, []);

  void exerciseTick;

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const liveQueue = getLiveQueueContext(doctors);
  const recentAppts = appointments.slice(0, 3);
  const recentReports = reports.slice(0, 3);
  const careTeam = doctors
    .filter((d) => appointments.some((a) => a.doctorId === d.id))
    .slice(0, 2);

  const nextMed = meds.find((m) => !m.taken);
  const upcomingAppt = appointments.find(
    (a) => a.status === "upcoming" || a.status === "in-queue",
  );
  const nextExerciseDone = NEXT_EXERCISE
    ? isRoutineCompletedToday(NEXT_EXERCISE.id)
    : false;
  const exerciseAdherence = getTodayAdherence(3);
  const visitsDone = appointments.filter((a) => a.status === "completed").length;

  const focusTasks = useMemo(() => {
    const tasks: FocusTask[] = [];

    if (nextMed) {
      tasks.push({
        id: "med",
        title: nextMed.name,
        subtitle: `Take at ${nextMed.time} · ${nextMed.dosage}`,
        to: "/medications/$medId",
        params: { medId: nextMed.id },
        icon: Pill,
        accent: "bg-clay/15",
        action: "Mark taken",
      });
    }

    if (!nextExerciseDone && NEXT_EXERCISE) {
      tasks.push({
        id: "move",
        title: NEXT_EXERCISE.name,
        subtitle: `${NEXT_EXERCISE.durationMinutes} min · ${exerciseAdherence.completed} of ${exerciseAdherence.prescribed} done today`,
        to: "/exercise/$routineId",
        params: { routineId: NEXT_EXERCISE.id },
        icon: Dumbbell,
        accent: "bg-ink/10",
      });
    } else if (NEXT_MEAL) {
      tasks.push({
        id: "meal",
        title: NEXT_MEAL.name,
        subtitle: `${NEXT_MEAL.mealType.charAt(0).toUpperCase()}${NEXT_MEAL.mealType.slice(1)} · ${NEXT_MEAL.calories} kcal`,
        to: "/diet/$mealId",
        params: { mealId: NEXT_MEAL.id },
        icon: ChefHat,
        accent: "bg-clay/15",
      });
    }

    if (upcomingAppt) {
      const doc = doctors.find((d) => d.id === upcomingAppt.doctorId);
      tasks.push({
        id: "appt",
        title: doc?.name ?? "Upcoming visit",
        subtitle: `${formatVisitDateShort(upcomingAppt.date)} · ${upcomingAppt.time}`,
        to: "/care/visits/$visitId",
        params: { visitId: upcomingAppt.id },
        icon: CalendarPlus,
        accent: "bg-emerald-600/10",
      });
    } else if (tasks.length < 3) {
      tasks.push({
        id: "book",
        title: "Book your next visit",
        subtitle: "Find a specialist and pick a time",
        to: "/book",
        icon: CalendarPlus,
        accent: "bg-[#E8F3EE]",
      });
    }

    return tasks.slice(0, 3);
  }, [nextMed, nextExerciseDone, upcomingAppt, exerciseAdherence]);

  return (
    <div className="w-full pb-28 lg:pb-0">
      <header className="lg:mb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">{getTimeAwareGreeting()}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="font-serif text-2xl tracking-tight text-ink">
                {patientName}
              </h1>
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openPatientSearch()}
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface"
              aria-label="Search"
            >
              <Search className="h-4 w-4 text-ink" strokeWidth={1.75} />
            </button>
            <Link
              to="/profile/notifications"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-surface"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-ink" strokeWidth={1.75} />
              {unreadCount > 0 ? (
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-clay" />
              ) : null}
            </Link>
            <Link
              to="/profile"
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface"
              aria-label="Profile"
            >
              <Settings className="h-4 w-4 text-ink" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
          {dateLabel}
        </p>
      </header>

      <div className="mt-5 flex flex-col gap-7 lg:mt-6 lg:gap-8">
        {liveQueue ? (
          <LiveQueueHeroCard
            appointment={liveQueue.appointment}
            doctor={liveQueue.doctor}
            queueDoctorId={liveQueue.doctor.id}
          />
        ) : null}

        <PatientProgressStrip visitsDone={visitsDone} />

        <section aria-labelledby="today-focus-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="today-focus-heading" className="font-serif text-lg text-ink">
              Today&apos;s focus
            </h2>
            <PatientViewAllPill to="/health" />
          </div>
          <ul className="flex flex-col gap-3">
            {focusTasks.map((task) => {
              const Icon = task.icon;
              return (
                <li key={task.id}>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${task.accent}`}
                    >
                      <Icon className="h-5 w-5 text-ink" strokeWidth={1.75} />
                    </span>
                    <Link
                      to={task.to}
                      params={task.params}
                      className="min-w-0 flex-1"
                    >
                      <p className="font-medium text-sm text-ink">{task.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{task.subtitle}</p>
                    </Link>
                    {task.id === "med" && nextMed ? (
                      <button
                        type="button"
                        onClick={() => toggle(nextMed.id)}
                        className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        {task.action}
                      </button>
                    ) : (
                      <Link
                        to={task.to}
                        params={task.params}
                        className="shrink-0 text-ink-muted"
                        aria-label={`Open ${task.title}`}
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {meds.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg text-ink">Quick dose check</h2>
              <PatientViewAllPill to="/medications" />
            </div>
            <div className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {meds.slice(0, 3).map((med) => (
                <HomeMedCard
                  key={med.id}
                  med={med}
                  onToggle={toggle}
                  className="lg:w-full"
                />
              ))}
            </div>
          </section>
        ) : null}

        <details className="group rounded-2xl border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-lg text-ink">Explore more</span>
            <ChevronDown className="h-5 w-5 text-ink-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-7 border-t border-border px-4 pb-5 pt-2">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Appointments</h3>
                <Link to="/care/visits" className="text-xs font-medium text-clay">
                  View all
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {recentAppts.map((appt, i) => {
                  const doc = doctors.find((d) => d.id === appt.doctorId);
                  if (!doc) return null;
                  return (
                    <div
                      key={appt.id}
                      className={`p-4 ${i < recentAppts.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <Link
                        to="/care/visits/$visitId"
                        params={{ visitId: appt.id }}
                        className="flex items-center gap-3"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay-soft font-serif text-sm text-ink">
                          {doc.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
                          <p className="mt-0.5 truncate text-xs text-ink-muted">
                            {doc.specialty} · {formatVisitDateShort(appt.date)}, {appt.time}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusColor(appt.status)}`}
                        >
                          {statusLabel(appt.status)}
                        </span>
                      </Link>
                      <div className="mt-4 border-t border-border/60 pt-4">
                        <CareContactActions doctorName={doc.name} variant="compact" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-7 lg:grid-cols-2">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Recent reports</h3>
                  <PatientViewAllPill to="/reports" />
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  {recentReports.map((r, i) => (
                    <Link
                      key={r.id}
                      to="/reports/$reportId"
                      params={{ reportId: r.id }}
                      className={`flex items-center gap-3 px-4 py-3.5 ${
                        i < recentReports.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface">
                        <FileText className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{r.title}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{r.type}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Prescriptions</h3>
                  <PatientViewAllPill to="/prescriptions" />
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  {rxList.slice(0, 2).map((rx, i) => (
                    <Link
                      key={rx.id}
                      to="/prescriptions/$rxId"
                      params={{ rxId: rx.id }}
                      className={`flex items-center gap-3 px-4 py-3.5 ${
                        i < Math.min(rxList.length, 2) - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface">
                        <Pill className="h-4 w-4 text-clay" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{rx.draft.diagnosis}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {rx.rx_number} · {formatRxRelative(rx.sent_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Care team</h3>
                <PatientViewAllPill to="/care/visits" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                {careTeam.map((doc, i) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3.5 px-4 py-4 ${
                      i < careTeam.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <Link
                      to="/care/visits"
                      search={{ doctor: doc.id }}
                      className="flex min-w-0 flex-1 items-center gap-3.5"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay-soft font-serif text-sm text-ink">
                        {doc.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{doc.name}</p>
                        <p className="text-xs text-ink-muted">{doc.specialty}</p>
                      </div>
                    </Link>
                    <CareContactActions doctorName={doc.name} variant="icon" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </details>
      </div>
    </div>
  );
}
