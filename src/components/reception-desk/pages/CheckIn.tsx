import React, { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import { TODAY_STR } from "@/lib/reception-desk/mockData";
import { toast } from "sonner";
import { printToken } from "@/lib/reception-desk/print";
import StatusPill from "@/components/reception-desk/StatusPill";
import { Search, Printer, LogIn, Zap, AlertTriangle, IndianRupee, FlaskConical, Activity } from "lucide-react";

export default function CheckIn() {
  const { appointments, patients, doctors, checkInAppointment, orderLabForPatient, labCatalog } = useStore();
  const [q, setQ] = useState("");
  const [lastToken, setLastToken] = useState(null);
  const [labTest, setLabTest] = useState("CBC");

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

  const doCheckIn = (apt) => {
    const tok = checkInAppointment(apt.id);
    const p = patients.find((x) => x.id === apt.patientId);
    const d = doctors.find((x) => x.id === apt.doctorId);
    setLastToken({ token: tok, patient: p, doctor: d, time: apt.time });
    toast.success(`Token #${tok} issued`, {
      description: `${p?.name} → ${d?.name} (Room ${d?.room})`,
    });
  };

  return (
    <div data-testid="checkin-page" className="grid grid-cols-12 gap-5">
      <section className="col-span-12 lg:col-span-8 surface flex flex-col h-[calc(100vh-140px)]">
        <div className="px-5 py-3 border-b border-ink-200 flex items-center gap-3">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Arrivals
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Scheduled · not arrived
            </h2>
          </div>
          <div className="ml-auto relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              data-testid="checkin-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Patient, MRN, appt ID…"
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-bone border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
            />
          </div>
        </div>
        <ul className="divide-y divide-ink-200 overflow-y-auto">
          {arrivals.map((a) => {
            const p = patients.find((x) => x.id === a.patientId);
            const d = doctors.find((x) => x.id === a.doctorId);
            return (
              <li
                key={a.id}
                data-testid={`checkin-row-${a.id}`}
                className="px-5 py-3 row-hover flex flex-wrap items-center gap-3"
              >
                <div className="font-mono text-[14px] text-ink-900 w-14 tabular-nums">
                  {a.time}
                </div>
                <div className="w-9 h-9 rounded-full bg-sage-soft text-sage flex items-center justify-center text-[12px] font-medium">
                  {p?.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-ink-900 truncate flex items-center gap-2">
                    {p?.name}
                    {p?.balance > 0 && (
                      <span
                        data-testid={`checkin-due-${a.id}`}
                        className="chip-clay"
                        title="Outstanding balance from previous visits"
                      >
                        <IndianRupee className="w-3 h-3" />
                        Due ₹{p.balance.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-400 font-mono">
                    {p?.id} · {p?.phone}
                  </div>
                </div>
                <div className="hidden md:block min-w-0">
                  <div className="text-[12.5px] text-ink-900 truncate">{d?.name}</div>
                  <div className="text-[11px] text-ink-400">
                    {d?.specialty} · Room {d?.room}
                  </div>
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-400 w-20 text-center hidden sm:block">
                  {a.type}
                </div>
                <button
                  data-testid={`checkin-btn-${a.id}`}
                  onClick={() => doCheckIn(a)}
                  className="btn-primary"
                >
                  <LogIn className="w-4 h-4" />
                  Check-in
                </button>
              </li>
            );
          })}
          {arrivals.length === 0 && (
            <li className="p-10 text-center text-[13px] text-ink-400">
              No one waiting to arrive. 
            </li>
          )}
        </ul>
      </section>

      <aside className="col-span-12 lg:col-span-4 space-y-5">
        {lastToken ? (
          <section
            data-testid="last-token-card"
            className="border-2 border-sage rounded-sm bg-white"
          >
            <div className="px-5 py-2.5 bg-sage text-white text-[11px] uppercase tracking-[0.14em] font-mono font-medium flex items-center justify-between">
              <span>Token issued</span>
              <span className="font-mono">{lastToken.time}</span>
            </div>
            <div className="p-6 text-center">
              <div className="text-[11px] uppercase tracking-wider text-ink-400 font-mono">
                Now
              </div>
              <div className="text-[64px] leading-none font-heading font-semibold text-sage tabular-nums my-2">
                #{lastToken.token}
              </div>
              <div className="text-[14px] font-medium text-ink-900">{lastToken.patient?.name}</div>
              <div className="text-[12px] text-ink-400 font-mono mt-1">
                {lastToken.patient?.id}
              </div>
              <div className="mt-5 pt-5 border-t border-ink-200 text-[13px]">
                <div>{lastToken.doctor?.name}</div>
                <div className="text-ink-400 text-[12px] mt-0.5">
                  {lastToken.doctor?.specialty} · Room {lastToken.doctor?.room}
                </div>
              </div>
              <button
                data-testid="print-token-btn"
                onClick={() =>
                  printToken({
                    token: lastToken.token,
                    patient: lastToken.patient,
                    doctor: lastToken.doctor,
                    appointment: { time: lastToken.time, type: "Token" },
                  })
                }
                className="mt-5 inline-flex items-center gap-2 text-[12.5px] text-sage hover:text-sage-hover font-medium"
              >
                <Printer className="w-4 h-4" /> Print token
              </button>
              {lastToken.patient?.id ? (
                <Link
                  to="/reception/vitals"
                  search={{ patientId: lastToken.patient.id }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-sage bg-sage-soft py-2.5 text-[12.5px] font-medium text-sage hover:bg-white"
                >
                  <Activity className="h-4 w-4" /> Record vitals
                </Link>
              ) : null}
              <div className="mt-5 rounded-sm border border-ink-200 bg-bone p-3 text-left">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-400">
                  <FlaskConical className="h-3.5 w-3.5" /> Order lab test
                </div>
                <div className="mt-2 flex gap-2">
                  <select
                    value={labTest}
                    onChange={(e) => setLabTest(e.target.value)}
                    className="h-9 flex-1 rounded-sm border border-ink-200 bg-white px-2 text-[13px]"
                    data-testid="checkin-lab-select"
                  >
                    {labCatalog.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.code} — {t.name} (₹{t.price})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-outline shrink-0"
                    data-testid="checkin-order-lab"
                    onClick={() => {
                      const ok = orderLabForPatient(lastToken.patient?.id, labTest);
                      if (ok) {
                        toast.success("Lab order sent", {
                          description: `${labTest} queued for ${lastToken.patient?.name}`,
                        });
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="surface p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-sm bg-sage-soft text-sage grid place-items-center">
              <LogIn className="w-5 h-5" />
            </div>
            <div className="text-[14px] font-medium text-ink-900 mt-3">No token issued yet</div>
            <div className="text-[12px] text-ink-400 mt-1">
              Check a patient in to issue their token.
            </div>
          </section>
        )}

        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Walk-in
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Fast track
            </h2>
          </div>
          <div className="p-5 text-[13px] text-ink-600 leading-relaxed">
            Patient without an appointment? Register + book + check-in in one go.
          </div>
          <div className="px-5 pb-5 flex gap-2">
            <Link
              to="/reception/register"
              data-testid="walkin-register"
              className="flex-1 h-9 inline-flex items-center justify-center gap-2 text-[12.5px] border border-ink-200 hover:bg-bone rounded-sm text-ink-900 font-medium"
            >
              Register first
            </Link>
            <Link
              to="/reception/appointments/new"
              data-testid="walkin-book"
              className="flex-1 h-9 inline-flex items-center justify-center gap-2 text-[12.5px] bg-sage hover:bg-sage-hover text-white rounded-sm font-medium"
            >
              <Zap className="w-3.5 h-3.5" /> Book now
            </Link>
          </div>
        </section>

        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200 text-[13px] font-medium text-ink-900">
            Recently checked-in
          </div>
          <ul className="divide-y divide-ink-200">
            {appointments
              .filter((a) => a.date === TODAY_STR && a.status === "checked-in")
              .slice(0, 5)
              .map((a) => {
                const p = patients.find((x) => x.id === a.patientId);
                return (
                  <li key={a.id} className="px-5 py-2.5 flex items-center gap-3 text-[12.5px]">
                    <span className="font-mono text-sage font-semibold tabular-nums w-12">
                      #{a.tokenNumber}
                    </span>
                    <span className="flex-1 truncate text-ink-900">{p?.name}</span>
                    <StatusPill status={a.status} />
                  </li>
                );
              })}
          </ul>
        </section>
      </aside>
    </div>
  );
}
