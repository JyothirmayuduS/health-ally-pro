import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import StatusPill from "@/components/StatusPill";
import { Plus, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const FILTERS = ["All", "Scheduled", "Checked-in", "In consult", "Completed", "No-show"];

const filterMatch = (status, f) => {
  if (f === "All") return true;
  if (f === "Scheduled") return status === "scheduled";
  if (f === "Checked-in") return status === "checked-in";
  if (f === "In consult") return status === "in-progress";
  if (f === "Completed") return status === "completed";
  if (f === "No-show") return status === "no-show";
  return true;
};

export default function Appointments() {
  const { appointments, patients, doctors, updateAppointmentStatus } = useStore();
  const [date, setDate] = useState(new Date());
  const [filter, setFilter] = useState("All");
  const [doctorId, setDoctorId] = useState("ALL");

  const iso = toISO(date);

  const day = useMemo(
    () =>
      appointments
        .filter((a) => a.date === iso)
        .filter((a) => (doctorId === "ALL" ? true : a.doctorId === doctorId))
        .filter((a) => filterMatch(a.status, filter))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, iso, doctorId, filter],
  );

  const shift = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  return (
    <div data-testid="appointments-page" className="space-y-4">
      <div className="surface flex items-center gap-3 px-4 py-3 flex-wrap">
        <div className="flex items-center gap-1 border border-ink-200 rounded-sm">
          <button
            data-testid="appt-prev"
            onClick={() => shift(-1)}
            className="h-8 w-8 grid place-items-center text-ink-600 hover:text-ink-900 hover:bg-bone"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-[13px] font-mono text-ink-900 inline-flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-sage" />
            {date.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <button
            data-testid="appt-next"
            onClick={() => shift(1)}
            className="h-8 w-8 grid place-items-center text-ink-600 hover:text-ink-900 hover:bg-bone"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          data-testid="appt-today"
          onClick={() => setDate(new Date())}
          className="h-8 px-3 text-[12.5px] border border-ink-200 rounded-sm hover:bg-bone text-ink-600"
        >
          Today
        </button>

        <div className="ml-2 flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              data-testid={`appt-filter-${f.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setFilter(f)}
              className={`h-8 px-3 text-[12px] rounded-sm font-medium ${
                filter === f
                  ? "bg-sage text-white"
                  : "text-ink-600 hover:text-ink-900 hover:bg-bone"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <select
          data-testid="appt-doctor-filter"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className="ml-auto h-8 px-3 text-[12.5px] bg-white border border-ink-200 rounded-sm focus:outline-none focus:border-sage"
        >
          <option value="ALL">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <Link
          to="/reception/appointments/new"
          data-testid="appt-new"
          className="h-8 px-3 inline-flex items-center gap-2 text-[12.5px] bg-sage hover:bg-sage-hover text-white rounded-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Book appointment
        </Link>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-bone border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-400 font-mono">
            <tr>
              <th className="text-left font-medium px-5 py-2.5 w-20">Time</th>
              <th className="text-left font-medium px-3 py-2.5">Patient</th>
              <th className="text-left font-medium px-3 py-2.5">Doctor</th>
              <th className="text-left font-medium px-3 py-2.5 w-24">Type</th>
              <th className="text-left font-medium px-3 py-2.5 w-20">Token</th>
              <th className="text-left font-medium px-3 py-2.5 w-32">Status</th>
              <th className="text-right font-medium px-5 py-2.5 w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {day.map((a) => {
              const p = patients.find((x) => x.id === a.patientId);
              const d = doctors.find((x) => x.id === a.doctorId);
              return (
                <tr key={a.id} data-testid={`appt-row-${a.id}`} className="row-hover">
                  <td className="px-5 py-3 font-mono text-ink-900 tabular-nums">{a.time}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-ink-900">{p?.name}</div>
                    <div className="text-[11px] text-ink-400 font-mono">{p?.id}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-ink-900">{d?.name}</div>
                    <div className="text-[11px] text-ink-400">{d?.specialty}</div>
                  </td>
                  <td className="px-3 py-3 text-ink-600">{a.type}</td>
                  <td className="px-3 py-3 font-mono text-ink-900">
                    {a.tokenNumber ? `#${a.tokenNumber}` : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {a.status === "scheduled" && (
                      <Link
                        to="/reception/check-in"
                        data-testid={`appt-action-checkin-${a.id}`}
                        className="text-[12px] text-sage hover:text-sage-hover font-medium mr-3"
                      >
                        Check-in
                      </Link>
                    )}
                    {a.status === "scheduled" && (
                      <button
                        data-testid={`appt-action-cancel-${a.id}`}
                        onClick={() => updateAppointmentStatus(a.id, "cancelled")}
                        className="text-[12px] text-ink-600 hover:text-status-noshowText font-medium"
                      >
                        Cancel
                      </button>
                    )}
                    {a.status === "checked-in" && (
                      <button
                        data-testid={`appt-action-noshow-${a.id}`}
                        onClick={() => updateAppointmentStatus(a.id, "no-show")}
                        className="text-[12px] text-ink-600 hover:text-status-noshowText font-medium"
                      >
                        No-show
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {day.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-ink-400">
                  Nothing for this day. Try another date or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
