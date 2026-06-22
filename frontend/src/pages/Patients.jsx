import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { TODAY_STR } from "@/lib/mockData";
import StatusPill from "@/components/StatusPill";
import {
  Search,
  Phone,
  Mail,
  CalendarPlus,
  LogIn,
  Printer,
  IndianRupee,
  Droplet,
  Shield,
} from "lucide-react";

const age = (dob) => {
  if (!dob) return "—";
  const d = new Date(dob);
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
};

export default function Patients() {
  const { patients, appointments, doctors } = useStore();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(patients[0]?.id || null);

  const filtered = useMemo(() => {
    if (!q.trim()) return patients;
    const s = q.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s) ||
        p.phone.replace(/\s+/g, "").includes(s.replace(/\s+/g, "")),
    );
  }, [q, patients]);

  const selected = patients.find((p) => p.id === selectedId) || filtered[0];

  const history = useMemo(
    () =>
      selected
        ? appointments
            .filter((a) => a.patientId === selected.id)
            .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
        : [],
    [appointments, selected],
  );

  const upcoming = history.filter((a) => a.date >= TODAY_STR && a.status === "scheduled");

  return (
    <div data-testid="patients-page" className="grid grid-cols-12 gap-5">
      {/* List */}
      <section className="col-span-12 lg:col-span-5 surface overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="p-3 border-b border-ink-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              data-testid="patients-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, MRN, phone…"
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-bone border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
            />
          </div>
          <div className="mt-2 text-[11px] text-ink-400 font-mono uppercase tracking-wider">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </div>
        </div>
        <ul className="overflow-y-auto divide-y divide-ink-200">
          {filtered.map((p) => {
            const active = selected?.id === p.id;
            return (
              <li key={p.id}>
                <button
                  data-testid={`patient-row-${p.id}`}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left px-4 py-3 row-hover flex gap-3 items-center ${
                    active ? "bg-sage-soft/50" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-sage-soft text-sage flex items-center justify-center text-[12px] font-medium shrink-0">
                    {p.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-medium text-ink-900 truncate">
                        {p.name}
                      </div>
                      {p.balance > 0 && (
                        <span className="text-[10px] font-mono uppercase tracking-wider bg-status-noshowBg text-status-noshowText border border-status-noshowBorder px-1.5 py-0.5 rounded-sm">
                          Due ₹{p.balance}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-400 font-mono mt-0.5">
                      {p.id} · {p.phone}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-ink-400 font-mono">
                    {age(p.dob)} y · {p.gender[0]}
                  </div>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="p-8 text-center text-[13px] text-ink-400">No patients match.</li>
          )}
        </ul>
      </section>

      {/* Detail */}
      <section className="col-span-12 lg:col-span-7">
        {!selected ? (
          <div className="surface p-12 text-center text-ink-400">Select a patient</div>
        ) : (
          <div className="space-y-4">
            <div className="surface p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-sm bg-sage-soft text-sage flex items-center justify-center text-[18px] font-heading font-semibold">
                  {selected.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[20px] font-heading font-semibold text-ink-900">
                    {selected.name}
                  </h2>
                  <div className="text-[12px] text-ink-600 mt-1 font-mono">
                    {selected.id} · {age(selected.dob)} yrs · {selected.gender}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[12.5px] text-ink-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-ink-400" /> {selected.phone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-ink-400" /> {selected.email}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/reception/appointments/new"
                    data-testid="patient-book"
                    state={{ patientId: selected.id }}
                    className="h-9 px-3 inline-flex items-center gap-2 text-[12.5px] bg-sage hover:bg-sage-hover text-white rounded-sm font-medium"
                  >
                    <CalendarPlus className="w-4 h-4" /> Book
                  </Link>
                  <Link
                    to="/reception/check-in"
                    data-testid="patient-checkin"
                    className="h-9 px-3 inline-flex items-center gap-2 text-[12.5px] bg-white border border-ink-200 hover:bg-bone text-ink-900 rounded-sm font-medium"
                  >
                    <LogIn className="w-4 h-4" /> Check-in
                  </Link>
                  <button
                    data-testid="patient-print"
                    className="h-9 w-9 inline-flex items-center justify-center text-ink-600 hover:text-ink-900 hover:bg-bone border border-ink-200 rounded-sm"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-ink-200">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Blood
                  </div>
                  <div className="text-[14px] mt-1 font-mono inline-flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-status-noshowText" />
                    {selected.bloodGroup}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Allergies
                  </div>
                  <div className="text-[13px] mt-1 text-ink-900">{selected.allergies}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Insurance
                  </div>
                  <div className="text-[13px] mt-1 text-ink-900 inline-flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sage" />
                    {selected.insurance.provider}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Outstanding
                  </div>
                  <div
                    className={`text-[14px] mt-1 font-mono inline-flex items-center ${
                      selected.balance > 0 ? "text-status-noshowText" : "text-ink-900"
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    {selected.balance.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="surface">
                <div className="px-5 py-3 border-b border-ink-200 text-[13px] font-medium text-ink-900">
                  Upcoming appointments
                </div>
                <ul className="divide-y divide-ink-200">
                  {upcoming.length === 0 && (
                    <li className="px-5 py-6 text-center text-[12.5px] text-ink-400">
                      No upcoming visits.
                    </li>
                  )}
                  {upcoming.map((a) => {
                    const d = doctors.find((x) => x.id === a.doctorId);
                    return (
                      <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="font-mono text-[13px] w-20 text-ink-900">
                          {a.date.slice(5)} · {a.time}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] text-ink-900 truncate">{d?.name}</div>
                          <div className="text-[11px] text-ink-400">{a.type}</div>
                        </div>
                        <StatusPill status={a.status} />
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="surface">
                <div className="px-5 py-3 border-b border-ink-200 text-[13px] font-medium text-ink-900">
                  Visit history
                </div>
                <ul className="divide-y divide-ink-200">
                  {history.slice(0, 6).map((a) => {
                    const d = doctors.find((x) => x.id === a.doctorId);
                    return (
                      <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="font-mono text-[13px] w-20 text-ink-600">
                          {a.date.slice(5)}
                        </div>
                        <div className="flex-1 min-w-0 text-[12.5px] text-ink-900 truncate">
                          {d?.name} · {a.type}
                        </div>
                        <StatusPill status={a.status} />
                      </li>
                    );
                  })}
                  {history.length === 0 && (
                    <li className="px-5 py-6 text-center text-[12.5px] text-ink-400">
                      No visit history.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="surface p-5">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium mb-2">
                Address
              </div>
              <div className="text-[13px] text-ink-900">{selected.address}</div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-ink-200">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Emergency contact
                  </div>
                  <div className="text-[13px] text-ink-900 mt-1">{selected.emergency.name}</div>
                  <div className="text-[11px] text-ink-400 mt-0.5">
                    {selected.emergency.relation} · {selected.emergency.phone}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Policy ID
                  </div>
                  <div className="text-[13px] font-mono text-ink-900 mt-1">
                    {selected.insurance.policyId}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-mono">
                    Registered
                  </div>
                  <div className="text-[13px] font-mono text-ink-900 mt-1">
                    {selected.createdAt}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
