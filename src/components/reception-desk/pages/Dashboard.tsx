import React, { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useStore, getPatient } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import StatusPill from "@/components/reception-desk/StatusPill";
import {
  ArrowRight,
  UserPlus,
  LogIn,
  CalendarPlus,
  MonitorPlay,
  Stethoscope,
  Hourglass,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const Kpi = ({ label, value, sub, accent, testId }) => (
  <div data-testid={testId} className="surface px-5 py-4">
    <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
      {label}
    </div>
    <div className="flex items-baseline gap-2 mt-2">
      <div className="text-[32px] font-heading font-semibold leading-none text-ink-900 tabular-nums">
        {value}
      </div>
      {sub && (
        <div className={`text-[12px] font-medium ${accent || "text-ink-400"}`}>{sub}</div>
      )}
    </div>
  </div>
);

const QuickAction = ({ to, icon: Icon, label, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className="group flex items-center gap-3 px-4 py-3 surface hover:border-sage hover:bg-sage-soft/40 transition-colors"
  >
    <div className="w-9 h-9 rounded-sm bg-sage-soft text-sage grid place-items-center group-hover:bg-sage group-hover:text-white transition-colors">
      <Icon className="w-4 h-4" strokeWidth={2} />
    </div>
    <div className="flex-1">
      <div className="text-[13px] font-medium text-ink-900">{label}</div>
    </div>
    <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-sage group-hover:translate-x-0.5 transition" />
  </Link>
);

export default function Dashboard() {
  const { appointments, doctors, patients } = useStore();
  const today = useMemo(
    () => appointments.filter((a) => a.date === TODAY_STR),
    [appointments],
  );

  const checkedIn = today.filter((a) => a.status === "checked-in").length;
  const inConsult = today.filter((a) => a.status === "in-progress").length;
  const notArrived = today.filter((a) => a.status === "scheduled").length;
  const noShows = today.filter((a) => a.status === "no-show").length;
  const completed = today.filter((a) => a.status === "completed").length;

  const perDoctor = doctors
    .filter((d) => d.onDuty)
    .map((d) => {
      const docToday = today.filter((a) => a.doctorId === d.id);
      return {
        doctor: d,
        waiting: docToday.filter((a) => a.status === "checked-in").length,
        inConsult: docToday.filter((a) => a.status === "in-progress").length,
        scheduled: docToday.length,
      };
    });

  const upcoming = today
    .filter((a) => a.status === "scheduled" || a.status === "checked-in")
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6);

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      {/* KPI strip — compact pills, not big tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi
          testId="kpi-today"
          label="Today"
          value={today.length}
          sub="appointments"
        />
        <Kpi
          testId="kpi-checked-in"
          label="Checked-in"
          value={checkedIn}
          sub={`of ${today.length}`}
          accent="text-status-waitText"
        />
        <Kpi
          testId="kpi-in-consult"
          label="In consult"
          value={inConsult}
          sub="now"
          accent="text-status-consultText"
        />
        <Kpi
          testId="kpi-not-arrived"
          label="Not arrived"
          value={notArrived}
          sub="awaiting"
        />
        <Kpi
          testId="kpi-noshow"
          label="No-shows"
          value={noShows}
          sub="today"
          accent="text-status-noshowText"
        />
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium mb-2">
          Quick actions
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <QuickAction
            testId="qa-register"
            to="/reception/register"
            icon={UserPlus}
            label="Register patient"
          />
          <QuickAction
            testId="qa-checkin"
            to="/reception/check-in"
            icon={LogIn}
            label="Check-in arrival"
          />
          <QuickAction
            testId="qa-book"
            to="/reception/appointments/new"
            icon={CalendarPlus}
            label="Book appointment"
          />
          <QuickAction
            testId="qa-display"
            to="/reception/token-display"
            icon={MonitorPlay}
            label="Open waiting screen"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Doctor queue snapshot */}
        <section className="lg:col-span-2 surface">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink-200">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                Live — per doctor
              </div>
              <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
                Queue snapshot
              </h2>
            </div>
            <Link
              to="/reception/queue"
              data-testid="dashboard-open-queue"
              className="text-[12px] text-sage hover:text-sage-hover font-medium inline-flex items-center gap-1"
            >
              Open queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-ink-200">
            {perDoctor.map(({ doctor, waiting, inConsult, scheduled }) => (
              <div
                key={doctor.id}
                className="grid grid-cols-12 gap-3 items-center px-5 py-3 row-hover"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-sage-soft text-sage grid place-items-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-ink-900 truncate">
                      {doctor.name}
                    </div>
                    <div className="text-[11px] text-ink-400 truncate">
                      {doctor.specialty} · Room {doctor.room}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-[18px] font-heading font-semibold text-status-waitText tabular-nums">
                    {waiting}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-400 font-mono">
                    Waiting
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <div className="text-[18px] font-heading font-semibold text-status-consultText tabular-nums">
                    {inConsult}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-400 font-mono">
                    In consult
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <div className="text-[13px] font-mono text-ink-600">{doctor.shift}</div>
                  <div className="text-[10.5px] mt-0.5 text-ink-400 font-mono uppercase tracking-wider">
                    {scheduled} total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Next up */}
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Next up
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Upcoming today
            </h2>
          </div>
          <ul className="divide-y divide-ink-200">
            {upcoming.map((apt) => {
              const p = getPatient(patients, apt.patientId);
              return (
                <li key={apt.id} className="px-5 py-3 row-hover flex items-center gap-3">
                  <div className="text-[14px] font-mono font-semibold text-ink-900 w-12 tabular-nums">
                    {apt.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink-900 truncate">
                      {p?.name || "—"}
                    </div>
                    <div className="text-[11px] text-ink-400 truncate">
                      {apt.type} · {p?.id}
                    </div>
                  </div>
                  <StatusPill status={apt.status} />
                </li>
              );
            })}
            {upcoming.length === 0 && (
              <li className="px-5 py-8 text-center text-[13px] text-ink-400">
                Nothing scheduled.
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* Footer ledger */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface p-4 flex items-center gap-3">
          <Hourglass className="w-4 h-4 text-status-waitText" />
          <div>
            <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">
              Avg wait
            </div>
            <div className="text-[16px] font-heading font-semibold text-ink-900">
              14 min
            </div>
          </div>
        </div>
        <div className="surface p-4 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-status-doneText" />
          <div>
            <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">
              Completed
            </div>
            <div className="text-[16px] font-heading font-semibold text-ink-900">
              {completed}
            </div>
          </div>
        </div>
        <div className="surface p-4 flex items-center gap-3">
          <UserPlus className="w-4 h-4 text-sage" />
          <div>
            <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">
              Registered
            </div>
            <div className="text-[16px] font-heading font-semibold text-ink-900">
              {patients.length}
            </div>
          </div>
        </div>
        <div className="surface p-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-status-noshowText" />
          <div>
            <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">
              Walk-ins waiting
            </div>
            <div className="text-[16px] font-heading font-semibold text-ink-900">3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
