import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { TIME_SLOTS, VISIT_TYPES, TODAY_STR } from "@/lib/mockData";
import { toast } from "sonner";
import { Search, AlertCircle, Check, Stethoscope } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function NewAppointment() {
  const { patients, doctors, appointments, addAppointment } = useStore();
  const { state } = useLocation();
  const nav = useNavigate();

  const [patientQ, setPatientQ] = useState("");
  const [patientId, setPatientId] = useState(state?.patientId || "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || "");
  const [date, setDate] = useState(TODAY_STR);
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("New");
  const [duration, setDuration] = useState(15);
  const [notes, setNotes] = useState("");

  const matchingPatients = useMemo(() => {
    if (!patientQ.trim()) return patients.slice(0, 6);
    const s = patientQ.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.id.toLowerCase().includes(s) ||
          p.phone.includes(s),
      )
      .slice(0, 6);
  }, [patientQ, patients]);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const conflict = useMemo(() => {
    return appointments.find(
      (a) => a.doctorId === doctorId && a.date === date && a.time === time,
    );
  }, [appointments, doctorId, date, time]);

  const doctorDayAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.doctorId === doctorId && a.date === date)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, doctorId, date],
  );

  const submit = (e) => {
    e.preventDefault();
    if (!patientId) {
      toast.error("Select a patient");
      return;
    }
    if (conflict) {
      toast.error("Slot already taken — pick another time");
      return;
    }
    const apt = addAppointment({
      patientId,
      doctorId,
      date,
      time,
      type,
      duration: Number(duration),
      notes,
    });
    toast.success("Appointment booked", {
      description: `${selectedPatient.name} → ${selectedDoctor.name} · ${date} ${time}`,
    });
    nav("/reception/appointments");
    return apt;
  };

  return (
    <form
      data-testid="new-appt-page"
      onSubmit={submit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-5"
    >
      <div className="lg:col-span-2 space-y-5">
        {/* Patient picker */}
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Step 1
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Choose patient
            </h2>
          </div>
          <div className="p-5">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                data-testid="newappt-patient-search"
                value={patientQ}
                onChange={(e) => setPatientQ(e.target.value)}
                placeholder="Search name, MRN or phone…"
                className="w-full h-9 pl-9 pr-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
              />
            </div>
            <ul className="border border-ink-200 rounded-sm divide-y divide-ink-200 max-h-72 overflow-y-auto">
              {matchingPatients.map((p) => {
                const active = patientId === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      data-testid={`newappt-pick-${p.id}`}
                      onClick={() => setPatientId(p.id)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                        active ? "bg-sage-soft" : "hover:bg-bone"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white border border-ink-200 text-ink-600 text-[11px] font-medium flex items-center justify-center">
                        {p.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink-900 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-ink-400 font-mono">
                          {p.id} · {p.phone}
                        </div>
                      </div>
                      {active && <Check className="w-4 h-4 text-sage" />}
                    </button>
                  </li>
                );
              })}
              {matchingPatients.length === 0 && (
                <li className="px-4 py-6 text-center text-[12.5px] text-ink-400">
                  No match — register first.
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Slot picker */}
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Step 2
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Doctor, date & time
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <label className="block">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
                Doctor
              </div>
              <select
                data-testid="newappt-doctor"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage"
              >
                {doctors.map((d) => {
                  const label = `${d.name} — ${d.specialty}`;
                  return (
                    <option key={d.id} value={d.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
                Visit type
              </div>
              <select
                data-testid="newappt-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage"
              >
                {VISIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
                Date
              </div>
              <input
                data-testid="newappt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage"
              />
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
                Duration (minutes)
              </div>
              <select
                data-testid="newappt-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage"
              >
                {[10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </label>

            <div className="col-span-2">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-2">
                Available slots
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                {TIME_SLOTS.map((slot) => {
                  const taken = appointments.some(
                    (a) => a.doctorId === doctorId && a.date === date && a.time === slot,
                  );
                  const active = time === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      data-testid={`newappt-slot-${slot}`}
                      disabled={taken}
                      onClick={() => setTime(slot)}
                      className={`h-8 text-[12px] font-mono rounded-sm border transition ${
                        taken
                          ? "border-ink-200 bg-ink-200/30 text-ink-400 line-through cursor-not-allowed"
                          : active
                            ? "border-sage bg-sage text-white font-medium"
                            : "border-ink-200 bg-white text-ink-900 hover:border-sage hover:bg-sage-soft"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block col-span-2">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-600 font-mono mb-1.5">
                Notes (optional)
              </div>
              <textarea
                data-testid="newappt-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage"
                placeholder="Reason for visit, special notes…"
              />
            </label>
          </div>
        </section>
      </div>

      {/* Side rail */}
      <aside className="space-y-5">
        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-mono font-medium">
              Summary
            </div>
            <h2 className="text-[15px] font-heading font-semibold text-ink-900 mt-0.5">
              Confirm booking
            </h2>
          </div>
          <div className="p-5 text-[13px] space-y-3">
            <div className="flex justify-between">
              <span className="text-ink-400">Patient</span>
              <span className="text-ink-900 font-medium">
                {selectedPatient?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Doctor</span>
              <span className="text-ink-900 inline-flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-sage" />
                {selectedDoctor?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Date · Time</span>
              <span className="text-ink-900 font-mono">
                {date} · {time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Type · Length</span>
              <span className="text-ink-900">
                {type} · {duration} min
              </span>
            </div>
          </div>

          {conflict && (
            <div
              data-testid="newappt-conflict"
              className="mx-5 mb-5 border border-status-noshowBorder bg-status-noshowBg/50 rounded-sm p-3 flex items-start gap-2 text-[12px]"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 text-status-noshowText" />
              <div>
                <div className="font-medium text-status-noshowText">Slot conflict</div>
                <div className="text-ink-600 mt-0.5">
                  {selectedDoctor?.name} already has a patient at {time}.
                </div>
              </div>
            </div>
          )}

          <div className="px-5 pb-5 flex gap-2">
            <button
              type="button"
              onClick={() => nav(-1)}
              data-testid="newappt-cancel"
              className="flex-1 h-10 text-[13px] text-ink-600 border border-ink-200 hover:bg-bone rounded-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="newappt-submit"
              disabled={!!conflict || !patientId}
              className="flex-1 h-10 text-[13px] font-medium bg-sage hover:bg-sage-hover text-white rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Book
            </button>
          </div>
        </section>

        <section className="surface">
          <div className="px-5 py-3 border-b border-ink-200 text-[13px] font-medium text-ink-900">
            {selectedDoctor?.name} · {date.slice(5)}
          </div>
          <ul className="divide-y divide-ink-200 max-h-72 overflow-y-auto">
            {doctorDayAppts.length === 0 && (
              <li className="px-5 py-6 text-center text-[12px] text-ink-400">
                No bookings yet today.
              </li>
            )}
            {doctorDayAppts.map((a) => {
              const p = patients.find((x) => x.id === a.patientId);
              return (
                <li key={a.id} className="px-5 py-2.5 flex items-center gap-3 text-[12.5px]">
                  <span className="font-mono text-ink-900 w-12">{a.time}</span>
                  <span className="flex-1 truncate text-ink-600">{p?.name}</span>
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-400">
                    {a.type}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </form>
  );
}
