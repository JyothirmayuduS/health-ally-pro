import React, { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { toast } from "sonner";
import { printToken } from "@/lib/reception-desk/print";
import StatusPill from "@/components/reception-desk/StatusPill";
import {
  Search,
  Printer,
  LogIn,
  Zap,
  IndianRupee,
  FlaskConical,
  Activity,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronRight,
  Ticket,
  AlertTriangle,
  Users,
} from "lucide-react";
import WalkInModal from "@/components/reception-desk/WalkInModal";

/* ─── Mini KPI chip ─────────────────────────────────────────────────── */
function StatChip({
  label,
  value,
  color = "text-ink-900",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg border border-ink-200 bg-white px-4 py-2.5">
      <span className={`text-[22px] font-heading font-semibold tabular-nums leading-none ${color}`}>
        {value}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-400">
        {label}
      </span>
    </div>
  );
}

/* ─── Token display card ─────────────────────────────────────────────── */
function TokenCard({
  token,
  patient,
  doctor,
  time,
  findOpenEncounterForPatient,
  labCatalog,
  orderLabForPatient,
}: any) {
  const [labTest, setLabTest] = useState("CBC");
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-sage bg-white shadow-[0_8px_32px_-8px_rgba(44,94,78,0.25)]">
      {/* Header band */}
      <div className="flex items-center justify-between bg-sage px-5 py-2.5">
        <div className="flex items-center gap-2 text-white/80 text-[11px] font-mono uppercase tracking-[0.14em]">
          <Ticket className="w-3.5 h-3.5 text-white" />
          Token issued
        </div>
        <span className="text-white font-mono text-[12px] font-medium">{time}</span>
      </div>

      {/* Token number — hero */}
      <div className="flex flex-col items-center px-6 pt-6 pb-4">
        <div className="text-[9px] uppercase tracking-[0.2em] text-ink-400 font-mono mb-1">Now serving</div>
        <div
          className="text-[80px] leading-none font-heading font-bold tabular-nums"
          style={{ color: "#2c5e4e", textShadow: "0 2px 0 rgba(44,94,78,0.1)" }}
        >
          #{token}
        </div>
        <div className="mt-3 text-center">
          <div className="text-[15px] font-semibold text-ink-900">{patient?.name}</div>
          <div className="text-[12px] text-ink-400 font-mono mt-0.5">{patient?.id}</div>
        </div>

        {/* Doctor pill */}
        <div className="mt-4 w-full rounded-lg border border-sage/20 bg-sage-soft px-4 py-2.5 text-center">
          <div className="text-[12px] font-medium text-sage">{doctor?.name}</div>
          <div className="text-[11px] text-sage/70 font-mono mt-0.5">
            {doctor?.specialty} · Room {doctor?.room}
          </div>
        </div>

        {/* Encounter */}
        {patient?.id && (
          <div className="mt-2 w-full flex items-center justify-between rounded-lg bg-bone border border-ink-200 px-3 py-2">
            <span className="text-[11px] text-ink-400 font-mono">Encounter</span>
            <span className="text-[12px] font-medium text-ink-900 font-mono">
              {findOpenEncounterForPatient(patient.id)?.id ?? "Pending"}
            </span>
          </div>
        )}

        {/* Action row */}
        <div className="mt-4 w-full grid grid-cols-2 gap-2">
          <button
            data-testid="print-token-btn"
            onClick={() =>
              printToken({
                token,
                patient,
                doctor,
                appointment: { time, type: "Token" },
              })
            }
            className="btn-outline flex items-center justify-center gap-1.5 py-2 h-9"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          {patient?.id && (
            <Link
              to="/reception/vitals"
              search={{ patientId: patient.id }}
              className="btn-primary flex items-center justify-center gap-1.5 py-2 h-9 no-underline"
            >
              <Activity className="h-3.5 w-3.5" /> Vitals
            </Link>
          )}
        </div>

        {/* Lab quick-order */}
        <div className="mt-3 w-full rounded-lg border border-ink-200 bg-bone p-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.12em] text-ink-400 mb-2">
            <FlaskConical className="h-3.5 w-3.5" /> Quick lab order
          </div>
          <div className="flex gap-2">
            <select
              value={labTest}
              onChange={(e) => setLabTest(e.target.value)}
              className="h-8 flex-1 rounded-md border border-ink-200 bg-white px-2 text-[12px] focus:outline-none focus:border-sage"
              data-testid="checkin-lab-select"
            >
              {labCatalog.map((t: any) => (
                <option key={t.code} value={t.code}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-outline h-8 px-3 shrink-0 text-[12px]"
              data-testid="checkin-order-lab"
              onClick={() => {
                const ok = orderLabForPatient(patient?.id, labTest);
                if (ok) {
                  toast.success("Lab order sent", {
                    description: `${labTest} queued for ${patient?.name}`,
                  });
                }
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty token placeholder ─────────────────────────────────────────── */
function EmptyTokenCard({ onWalkIn }: { onWalkIn: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-sage-soft flex items-center justify-center">
        <Ticket className="w-6 h-6 text-sage" />
      </div>
      <div>
        <div className="text-[14px] font-medium text-ink-900">No token issued yet</div>
        <div className="text-[12px] text-ink-400 mt-1">
          Check a patient in to issue their token.
        </div>
      </div>
      <button
        onClick={onWalkIn}
        className="btn-primary mt-1 gap-2"
      >
        <Zap className="w-3.5 h-3.5" /> Quick walk-in
      </button>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function CheckIn() {
  const [walkOpen, setWalkOpen] = useState(false);
  const {
    appointments,
    patients,
    doctors,
    checkInAppointment,
    orderLabForPatient,
    labCatalog,
    findOpenEncounterForPatient,
  } = useStore();
  const [q, setQ] = useState("");
  const [lastToken, setLastToken] = useState<{
    token: number;
    patient: any;
    doctor: any;
    time: string;
  } | null>(null);

  const today = useMemo(
    () => appointments.filter((a) => a.date === TODAY_STR),
    [appointments],
  );

  const arrivals = useMemo(() => {
    const list = appointments
      .filter((a) => a.date === TODAY_STR && a.status === "scheduled")
      .sort((a, b) => a.time.localeCompare(b.time));
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((a) => {
      const p = patients.find((x) => x.id === a.patientId);
      return (
        p?.name.toLowerCase().includes(s) ||
        p?.id.toLowerCase().includes(s) ||
        p?.phone.includes(s) ||
        a.id.toLowerCase().includes(s)
      );
    });
  }, [appointments, patients, q]);

  const recentlyCheckedIn = useMemo(
    () =>
      appointments
        .filter((a) => a.date === TODAY_STR && a.status === "checked-in")
        .slice(0, 6),
    [appointments],
  );

  const scheduled = today.filter((a) => a.status === "scheduled").length;
  const checkedIn = today.filter((a) => a.status === "checked-in").length;
  const completed = today.filter((a) => a.status === "completed").length;
  const noShows = today.filter((a) => a.status === "no-show").length;

  const doCheckIn = (apt: any) => {
    const tok = checkInAppointment(apt.id);
    const p = patients.find((x) => x.id === apt.patientId);
    const d = doctors.find((x) => x.id === apt.doctorId);
    setLastToken({ token: tok, patient: p, doctor: d, time: apt.time });
    toast.success(`Token #${tok} issued`, {
      description: `${p?.name} → ${d?.name} (Room ${d?.room})`,
    });
  };

  return (
    <div data-testid="checkin-page" className="space-y-5">

      {/* ── Stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Awaiting" value={scheduled} color="text-status-waitText" />
        <StatChip label="Checked in" value={checkedIn} color="text-sage" />
        <StatChip label="Completed" value={completed} color="text-money" />
        <StatChip label="No-shows" value={noShows} color="text-status-noshowText" />
      </div>

      {/* ── Walk-in hero banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sage to-teal px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Background decoration */}
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="pointer-events-none absolute -right-2 -bottom-10 h-28 w-28 rounded-full opacity-5"
          style={{ background: "white" }}
        />

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-[15px]">Walk-in patient?</div>
            <div className="text-white/70 text-[12px] mt-0.5">
              Register, book, and check-in in one fast flow
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            to="/reception/register"
            data-testid="walkin-register"
            className="h-9 px-4 rounded-full bg-white/10 border border-white/25 text-white text-[12.5px] font-medium inline-flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Register first
          </Link>
          <button
            onClick={() => setWalkOpen(true)}
            data-testid="walkin-quick"
            className="h-9 px-5 rounded-full bg-white text-sage text-[12.5px] font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" /> Quick walk-in
          </button>
        </div>
      </div>

      {/* ── Main two-column content area ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Arrivals list ────────────────────────────────── */}
        <section className="lg:col-span-8 surface flex flex-col" style={{ minHeight: "520px" }}>

          {/* Section header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-200">
            <div className="w-8 h-8 rounded-lg bg-status-waitBg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-status-waitText" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
                Arrivals
              </div>
              <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
                Scheduled · Not yet arrived
              </h2>
            </div>
            {/* Search */}
            <div className="relative w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                data-testid="checkin-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, MRN, phone…"
                className="w-full h-8 pl-9 pr-3 text-[12.5px] bg-bone border border-ink-200 rounded-full focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/30 placeholder:text-ink-400"
              />
            </div>
          </div>

          {/* Arrival rows */}
          <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto">
            {arrivals.map((a) => {
              const p = patients.find((x) => x.id === a.patientId);
              const d = doctors.find((x) => x.id === a.doctorId);
              const initials = p?.name
                .split(" ")
                .map((s: string) => s[0])
                .slice(0, 2)
                .join("") ?? "?";

              return (
                <li
                  key={a.id}
                  data-testid={`checkin-row-${a.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-sage-soft/30"
                >
                  {/* Time */}
                  <div className="w-14 shrink-0">
                    <div className="text-[13px] font-mono font-semibold text-ink-900 tabular-nums">
                      {a.time}
                    </div>
                    <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider mt-0.5">
                      {a.type}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-sage-soft text-sage flex items-center justify-center text-[12px] font-semibold shrink-0 group-hover:bg-sage group-hover:text-white transition-colors">
                    {initials}
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-medium text-ink-900 truncate">
                        {p?.name}
                      </span>
                      {p?.balance > 0 && (
                        <span
                          data-testid={`checkin-due-${a.id}`}
                          className="chip-clay inline-flex items-center gap-1 text-[10.5px]"
                        >
                          <IndianRupee className="w-3 h-3" />
                          Due ₹{p.balance.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-400 font-mono mt-0.5 truncate">
                      {p?.id} · {p?.phone}
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="hidden md:block min-w-0 w-44 shrink-0">
                    <div className="text-[12.5px] text-ink-900 truncate">{d?.name}</div>
                    <div className="text-[11px] text-ink-400 font-mono truncate">
                      Rm {d?.room}
                    </div>
                  </div>

                  {/* Check-in button */}
                  <button
                    data-testid={`checkin-btn-${a.id}`}
                    onClick={() => doCheckIn(a)}
                    className="btn-primary shrink-0 gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Check-in
                  </button>
                </li>
              );
            })}

            {arrivals.length === 0 && (
              <li className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-money-soft flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-money" />
                </div>
                <div>
                  <div className="text-[13.5px] font-medium text-ink-900">
                    All caught up!
                  </div>
                  <div className="text-[12px] text-ink-400 mt-1">
                    {q ? "No results for your search." : "No scheduled arrivals remaining."}
                  </div>
                </div>
              </li>
            )}
          </ul>

          {/* Recently checked-in strip */}
          {recentlyCheckedIn.length > 0 && (
            <div className="border-t border-ink-200">
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-ink-100">
                <Users className="w-3.5 h-3.5 text-ink-400" />
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-ink-400">
                  Recently checked-in
                </span>
              </div>
              <ul className="flex flex-wrap gap-2 px-5 py-3">
                {recentlyCheckedIn.map((a) => {
                  const p = patients.find((x) => x.id === a.patientId);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 rounded-full bg-bone border border-ink-200 pl-2 pr-3 py-1"
                    >
                      <span className="font-mono text-[11px] font-semibold text-sage tabular-nums">
                        #{a.tokenNumber}
                      </span>
                      <span className="text-[12px] text-ink-700">{p?.name}</span>
                      <StatusPill status={a.status} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* ── Right panel ─────────────────────────────────────── */}
        <aside className="lg:col-span-4 space-y-4">

          {/* Token card */}
          {lastToken ? (
            <TokenCard
              token={lastToken.token}
              patient={lastToken.patient}
              doctor={lastToken.doctor}
              time={lastToken.time}
              findOpenEncounterForPatient={findOpenEncounterForPatient}
              labCatalog={labCatalog}
              orderLabForPatient={orderLabForPatient}
            />
          ) : (
            <EmptyTokenCard onWalkIn={() => setWalkOpen(true)} />
          )}

          {/* Walk-in quick actions card */}
          <div className="surface p-4 space-y-2">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium mb-3">
              Walk-in options
            </div>
            <Link
              to="/reception/register"
              className="flex items-center gap-3 rounded-xl border border-ink-200 bg-bone hover:border-sage hover:bg-sage-soft/30 px-4 py-3 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-ink-200 flex items-center justify-center group-hover:border-sage group-hover:bg-sage-soft transition-colors shrink-0">
                <UserPlus className="w-3.5 h-3.5 text-ink-600 group-hover:text-sage" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink-900">Register new patient</div>
                <div className="text-[11px] text-ink-400">First-time visitor</div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-sage transition-colors shrink-0" />
            </Link>

            <Link
              to="/reception/appointments/new"
              data-testid="walkin-book"
              className="flex items-center gap-3 rounded-xl border border-ink-200 bg-bone hover:border-teal hover:bg-teal-soft/30 px-4 py-3 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-ink-200 flex items-center justify-center group-hover:border-teal group-hover:bg-teal-soft transition-colors shrink-0">
                <LogIn className="w-3.5 h-3.5 text-ink-600 group-hover:text-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink-900">Book & check-in</div>
                <div className="text-[11px] text-ink-400">Returning patient, no slot</div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-teal transition-colors shrink-0" />
            </Link>

            <button
              onClick={() => setWalkOpen(true)}
              data-testid="walkin-quick-sidebar"
              className="w-full flex items-center gap-3 rounded-xl border border-sage/40 bg-sage-soft hover:bg-sage hover:border-sage px-4 py-3 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                <Zap className="w-3.5 h-3.5 text-sage group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-medium text-sage group-hover:text-white">Quick walk-in</div>
                <div className="text-[11px] text-sage/60 group-hover:text-white/70">One-flow: register → book → token</div>
              </div>
              <ChevronRight className="w-4 h-4 text-sage/50 group-hover:text-white/70 transition-colors shrink-0" />
            </button>
          </div>

          {/* Alert notice */}
          {noShows > 0 && (
            <div className="rounded-xl border border-status-noshowBorder bg-status-noshowBg px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-status-noshowText shrink-0 mt-0.5" />
              <div>
                <div className="text-[12.5px] font-medium text-status-noshowText">
                  {noShows} no-show{noShows !== 1 ? "s" : ""} today
                </div>
                <div className="text-[11px] text-status-noshowText/70 mt-0.5">
                  Consider calling patients to reschedule.
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <WalkInModal open={walkOpen} onClose={() => setWalkOpen(false)} />
    </div>
  );
}
