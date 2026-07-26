/**
 * Doctor practice analytics — today / week / panel / clinical workload.
 */
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  Grid3X3,
  Pill,
  Send,
  Shield,
  Users,
} from "lucide-react";
import { computeDoctorAnalytics } from "@/lib/doctor-analytics";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { useProfileStore } from "@/lib/doctor-profile-store-context";
import { cn } from "@/lib/utils";

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(27,59,46,0.04)]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8F8C]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[#1B3B2E]">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-[#8A8F8C]">{hint}</p> : null}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  suffix,
  highlight,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  highlight?: boolean;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={cn("font-medium", highlight ? "text-[#1B3B2E]" : "text-[#5C6B63]")}>
          {label}
          {highlight ? " · today" : ""}
        </span>
        <span className="tabular-nums text-[#8A8F8C]">
          {value.toLocaleString("en-IN")}
          {suffix ?? ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F0EEE9]">
        <div
          className={cn("h-full rounded-full", highlight ? "bg-[#1B3B2E]" : "bg-[#8A8F8C]")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function DoctorAnalyticsScreen() {
  const queueCtx = useLiveQueue();
  // Re-render when schedule / referrals change
  useProfileStore();
  const a = computeDoctorAnalytics({
    accepting: queueCtx.accepting,
    room: queueCtx.room,
    entries: queueCtx.entries,
    bookingRequests: queueCtx.bookingRequests,
  });

  const maxConsults = Math.max(...a.week.days.map((d) => d.consults), 1);
  const maxCondition = Math.max(...a.panel.byCondition.map((c) => c.count), 1);
  const todayKey = (() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels[(new Date().getDay() + 6) % 7] ?? "";
  })();

  const shortcuts = [
    { to: "/doctor/settings/slots" as const, label: "Booking slots", icon: Grid3X3 },
    { to: "/doctor/schedule" as const, label: "Schedule", icon: CalendarDays },
    { to: "/doctor/queue" as const, label: "Live queue", icon: ClipboardList },
    { to: "/doctor/prescriptions" as const, label: "Prescribe", icon: Pill },
    { to: "/doctor/settings/referrals" as const, label: "Referrals", icon: Send },
    { to: "/doctor/settings/emergency" as const, label: "Coverage", icon: Shield },
    { to: "/doctor/leave" as const, label: "Leave", icon: CalendarOff },
    { to: "/doctor/patients" as const, label: "Panel", icon: Users },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1B3B2E] text-white">
            <BarChart3 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
              Practice insights
            </p>
            <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">
              Analytics
            </h1>
            <p className="mt-0.5 text-sm text-[#5C6B63]">
              {a.today.room} · queue, slots, panel &amp; clinical workload
            </p>
          </div>
        </div>
        <Link
          to="/doctor/settings/slots"
          className="rounded-full border border-[#E2E0DB] bg-white px-4 py-2 text-sm font-semibold text-[#1B3B2E] hover:border-[#C8C2BA]"
        >
          Manage slots
        </Link>
      </header>

      {/* Today KPIs */}
      <section>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A8F8C]">
          Today
        </p>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi
            label="Consults done"
            value={String(a.today.consults)}
            hint={`${a.today.inLine} in line · ${a.today.waiting} waiting`}
          />
          <Kpi
            label="Seat fill"
            value={`${a.today.fillPct}%`}
            hint={`${a.today.bookedSeats}/${a.today.capacity} · ${a.today.openSeats} open`}
          />
          <Kpi
            label="Booked revenue"
            value={`₹${a.today.revenueBooked.toLocaleString("en-IN")}`}
            hint={`Cap ₹${a.today.revenueCap.toLocaleString("en-IN")}`}
          />
          <Kpi label="Avg wait" value={a.today.avgWaitLabel} hint="Live queue" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Week consults */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#1B3B2E]">This week · consults</h2>
              <p className="text-xs text-[#8A8F8C]">
                {a.week.consults} total · avg fill {a.week.avgFillPct}%
              </p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-[#1B3B2E]">
              ₹{(a.week.revenue / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="space-y-2.5">
            {a.week.days.map((d) => (
              <BarRow
                key={d.key}
                label={d.label}
                value={d.consults}
                max={maxConsults}
                highlight={d.key === todayKey}
              />
            ))}
          </div>
          {a.week.noShows > 0 ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-[#8A8F8C]">
              <AlertTriangle className="h-3.5 w-3.5 text-[#C45C4A]" />
              {a.week.noShows} no-shows estimated this week
            </p>
          ) : null}
        </section>

        {/* Panel mix */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#1B3B2E]">Panel mix</h2>
              <p className="text-xs text-[#8A8F8C]">
                {a.panel.total} patients · {a.panel.urgent} urgent · {a.panel.followUp} follow-up
              </p>
            </div>
            <p className="text-xs font-semibold text-[#8A8F8C]">
              {a.panel.withAllergy} with allergy on file
            </p>
          </div>
          <div className="space-y-2.5">
            {a.panel.byCondition.map((c) => (
              <BarRow key={c.label} label={c.label} value={c.count} max={maxCondition} />
            ))}
          </div>
        </section>

        {/* Hottest slots */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[#1B3B2E]">Hottest slots today</h2>
          <p className="mb-4 text-xs text-[#8A8F8C]">Highest fill — protect or add capacity</p>
          {a.topSlots.length === 0 ? (
            <p className="text-sm text-[#8A8F8C]">No active slots published yet.</p>
          ) : (
            <ul className="space-y-2">
              {a.topSlots.map((s) => (
                <li
                  key={s.time}
                  className="flex items-center gap-3 rounded-xl border border-[#F0EDE8] px-3 py-2.5"
                >
                  <span className="w-14 text-sm font-semibold tabular-nums text-[#1B3B2E]">
                    {s.time}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0EEE9]">
                    <div
                      className="h-full rounded-full bg-[#1B3B2E]"
                      style={{ width: `${s.fillPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs tabular-nums text-[#8A8F8C]">
                    {s.booked}/{s.capacity} · {s.fillPct}%
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/doctor/settings/slots"
            className="mt-3 inline-block text-xs font-semibold text-[#1B3B2E] underline-offset-2 hover:underline"
          >
            Adjust booking slots →
          </Link>
        </section>

        {/* Clinical workload */}
        <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[#1B3B2E]">Clinical workload</h2>
          <p className="mb-4 text-xs text-[#8A8F8C]">Open loops that need your attention</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to="/doctor/prescriptions"
              search={{ view: "sent" }}
              className="rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 py-3 transition hover:border-[#C8C2BA]"
            >
              <p className="text-2xl font-semibold tabular-nums text-[#1B3B2E]">
                {a.clinical.rxSent}
              </p>
              <p className="text-[11px] font-medium text-[#8A8F8C]">Rx sent (session)</p>
            </Link>
            <Link
              to="/doctor/settings/referrals"
              search={{}}
              className="rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 py-3 transition hover:border-[#C8C2BA]"
            >
              <p className="text-2xl font-semibold tabular-nums text-[#1B3B2E]">
                {a.clinical.referralsAwaiting}
              </p>
              <p className="text-[11px] font-medium text-[#8A8F8C]">
                Referrals awaiting · {a.clinical.referralsTotal} total
              </p>
            </Link>
            <Link
              to="/doctor/settings/slots"
              className="rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 py-3 transition hover:border-[#C8C2BA]"
            >
              <p className="text-2xl font-semibold tabular-nums text-[#1B3B2E]">
                {a.clinical.videoSlots}
              </p>
              <p className="text-[11px] font-medium text-[#8A8F8C]">Video-ready slots</p>
            </Link>
            <Link
              to="/doctor/patients"
              search={{ view: "urgent" }}
              className="rounded-xl border border-[#EDEAE6] bg-[#FAF9F7] px-3 py-3 transition hover:border-[#C8C2BA]"
            >
              <p className="text-2xl font-semibold tabular-nums text-[#1B3B2E]">{a.panel.urgent}</p>
              <p className="text-[11px] font-medium text-[#8A8F8C]">Urgent on panel</p>
            </Link>
          </div>
        </section>
      </div>

      {/* Doctor tools that were easy to miss */}
      <section className="rounded-2xl border border-[#EDEAE6] bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-[#1B3B2E]">Doctor tools</h2>
        <p className="mb-3 text-xs text-[#8A8F8C]">
          Practice ops — leave, coverage, slots, queue &amp; panel
        </p>
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E0DB] bg-[#FAF9F7] px-3.5 py-2 text-xs font-semibold text-[#1B3B2E] transition hover:border-[#C8C2BA] hover:bg-white"
            >
              <s.icon className="h-3.5 w-3.5 text-[#8A8F8C]" />
              {s.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
