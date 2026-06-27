import React, { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { getPatient } from "@/lib/reception-desk/utils";
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
  AlertTriangle,
} from "lucide-react";
import WalkInModal from "@/components/reception-desk/WalkInModal";
import { getAnnouncements, ANNOUNCEMENTS_EVENT, type Announcement } from "@/lib/shared/announcements";

const Kpi = ({ label, value, sub, accent, testId }) => (
  <div data-testid={testId} className="surface px-5 py-4">
    <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
      {label}
    </div>
    <div className="flex items-baseline gap-2 mt-2">
      <div className="text-[32px] font-heading font-semibold leading-none text-ink-900 tabular-nums">
        {value}
      </div>
      {sub && <div className={`text-[12px] font-medium ${accent || "text-ink-400"}`}>{sub}</div>}
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
  const [walkOpen, setWalkOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("medora-reception-announcement-v1") || "Welcome to Oakhaven Hospital. Please wait for your token to be called. Keep your physical slips ready.";
  });

  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>(() =>
    getAnnouncements().filter(
      (a) =>
        a.status === "active" &&
        (a.targetModules.includes("all") || a.targetModules.includes("reception"))
    )
  );

  useEffect(() => {
    const handleUpdate = () => {
      setActiveAnnouncements(
        getAnnouncements().filter(
          (a) =>
            a.status === "active" &&
            (a.targetModules.includes("all") || a.targetModules.includes("reception"))
        )
      );
    };
    window.addEventListener(ANNOUNCEMENTS_EVENT, handleUpdate);
    return () => window.removeEventListener(ANNOUNCEMENTS_EVENT, handleUpdate);
  }, []);

  const { appointments, doctors, patients, encounters } = useStore();
  const today = useMemo(() => appointments.filter((a) => a.date === TODAY_STR), [appointments]);

  const checkedIn = today.filter((a) => a.status === "checked-in").length;
  const inConsult = today.filter((a) => a.status === "in-progress").length;
  const notArrived = today.filter((a) => a.status === "scheduled").length;
  const noShows = today.filter((a) => a.status === "no-show").length;
  const completed = today.filter((a) => a.status === "completed").length;

  const openEncounters = useMemo(
    () => encounters.filter((e) => e.status === "open").length,
    [encounters],
  );

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
    <>
      <div data-testid="dashboard-page" className="space-y-6">
        {/* Active Announcement Banners */}
        {activeAnnouncements.map((ann) => (
          <div
            key={ann.id}
            className={`rounded border px-4 py-3 text-[13px] flex gap-2.5 items-start ${
              ann.priority === "emergency"
                ? "bg-red-50 border-red-200 text-red-900"
                : ann.priority === "urgent"
                ? "bg-status-waitBg border-status-waitBorder text-status-waitText"
                : "bg-bone border-stone-200 text-ink-700"
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold uppercase tracking-wider text-[11px] mr-2">
                [{ann.priority}] {ann.title}
              </span>
              <p className="mt-0.5 text-[12px] opacity-90">{ann.body}</p>
            </div>
          </div>
        ))}

        {/* KPI strip — compact pills, not big tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi testId="kpi-today" label="Today" value={today.length} sub="appointments" />
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
          <Kpi testId="kpi-not-arrived" label="Not arrived" value={notArrived} sub="awaiting" />
          <Kpi
            testId="kpi-noshow"
            label="No-shows"
            value={noShows}
            sub="today"
            accent="text-status-noshowText"
          />
          <Kpi
            testId="kpi-encounters"
            label="Open encounters"
            value={openEncounters}
            sub="active"
            accent="text-plum"
          />
        </div>

        {/* Quick actions */}
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium mb-2">
            Quick actions
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
            <div>
              <button
                onClick={() => setWalkOpen(true)}
                data-testid="qa-walkin"
                className="group flex items-center gap-3 px-4 py-3 surface hover:border-sage hover:bg-sage-soft/40 transition-colors w-full h-full text-left"
              >
                <div className="w-9 h-9 rounded-sm bg-sage-soft text-sage grid place-items-center group-hover:bg-sage group-hover:text-white transition-colors shrink-0">
                  <UserPlus className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-ink-900">Walk-in</div>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-sage group-hover:translate-x-0.5 transition" />
              </button>
            </div>
            <QuickAction
              testId="qa-book"
              to="/reception/appointments/new"
              icon={CalendarPlus}
              label="Book appointment"
            />
            <a
              href="/reception/token-board"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="qa-display"
              className="group flex items-center gap-3 px-4 py-3 surface hover:border-sage hover:bg-sage-soft/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-sm bg-sage-soft text-sage grid place-items-center group-hover:bg-sage group-hover:text-white transition-colors shrink-0">
                <MonitorPlay className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-ink-900">Open Waiting Board</div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-sage group-hover:translate-x-0.5 transition" />
            </a>
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

        {/* Lobby Display & Announcements */}
        <section className="surface p-5">
          <h2 className="text-[15px] font-heading font-semibold text-ink-900 mb-3">
            Lobby Waiting Board
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label htmlFor="lobby-announcement" className="text-[11px] uppercase tracking-wider text-ink-400 font-mono block mb-1.5">
                Marquee Announcement Text
              </label>
              <input
                id="lobby-announcement"
                type="text"
                value={announcement}
                onChange={(e) => {
                  setAnnouncement(e.target.value);
                  localStorage.setItem("medora-reception-announcement-v1", e.target.value);
                  // Dispatch a storage event so other components in the same tab can sync if listening
                  window.dispatchEvent(new Event("storage"));
                }}
                className="w-full px-3 py-2 border border-ink-200 rounded-sm focus:outline-none focus:border-sage text-[13px] bg-white"
                placeholder="Enter message for waiting board marquee..."
              />
            </div>
            <button
              onClick={() => window.open("/reception/token-board", "_blank")}
              className="btn-outline flex items-center gap-2 h-9 shrink-0"
            >
              <MonitorPlay className="w-4 h-4" /> Open Waiting Board (TV)
            </button>
          </div>
        </section>

        {/* Footer ledger */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="surface p-4 flex items-center gap-3">
            <Hourglass className="w-4 h-4 text-status-waitText" />
            <div>
              <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">
                Avg wait
              </div>
              <div className="text-[16px] font-heading font-semibold text-ink-900">14 min</div>
            </div>
          </div>
          <div className="surface p-4 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-status-doneText" />
            <div>
              <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wider">
                Completed
              </div>
              <div className="text-[16px] font-heading font-semibold text-ink-900">{completed}</div>
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
      <WalkInModal open={walkOpen} onClose={() => setWalkOpen(false)} />
    </>
  );
}
