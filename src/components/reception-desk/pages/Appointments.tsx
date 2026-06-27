import React, { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/reception-desk/store";
import StatusPill from "@/components/reception-desk/StatusPill";
import { Plus, CalendarDays, ChevronLeft, ChevronRight, List, Calendar as CalendarIcon, Check } from "lucide-react";
import CancelAppointmentModal from "@/components/reception-desk/CancelAppointmentModal";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const FILTERS = ["All", "Scheduled", "Checked-in", "In consult", "Completed", "No-show", "Cancelled"];

const filterMatch = (status, f) => {
  if (f === "All") return true;
  if (f === "Scheduled") return status === "scheduled";
  if (f === "Checked-in") return status === "checked-in";
  if (f === "In consult") return status === "in-progress";
  if (f === "Completed") return status === "completed";
  if (f === "No-show") return status === "no-show";
  if (f === "Cancelled") return status === "cancelled";
  return true;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Appointments() {
  const { appointments, patients, doctors, updateAppointmentStatus, cancelAppointment } = useStore();
  
  const [date, setDate] = useState(new Date());
  const [filter, setFilter] = useState("All");
  const [doctorId, setDoctorId] = useState("ALL");
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  
  // View mode: list vs calendar
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Calendar month state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const iso = toISO(date);

  // Appointments for the selected day (used in both views)
  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === iso)
        .filter((a) => (doctorId === "ALL" ? true : a.doctorId === doctorId))
        .filter((a) => filterMatch(a.status, filter))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, iso, doctorId, filter],
  );

  const shiftDay = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
    // Sync current month view
    setCurrentMonth(d);
  };

  const shiftMonth = (n) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + n, 1);
    setCurrentMonth(d);
  };

  // Helper to generate the monthly calendar grid days
  const calendarGridDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    
    // Previous month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        day: prevMonthTotalDays - i,
        monthOffset: -1,
        dateObj: new Date(year, month - 1, prevMonthTotalDays - i),
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        day: i,
        monthOffset: 0,
        dateObj: new Date(year, month, i),
      });
    }
    
    // Next month padding
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        day: i,
        monthOffset: 1,
        dateObj: new Date(year, month + 1, i),
      });
    }
    
    return grid;
  }, [currentMonth]);

  return (
    <div data-testid="appointments-page" className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="surface flex items-center gap-3 px-4 py-3 flex-wrap">
        {/* List vs Calendar Toggle */}
        <div className="flex items-center border border-ink-200 rounded-lg p-0.5 bg-bone">
          <button
            onClick={() => setViewMode("list")}
            className={`h-8 px-3 rounded-md text-[12.5px] font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "list" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`h-8 px-3 rounded-md text-[12.5px] font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "calendar" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </button>
        </div>

        {/* Date Selector (Only in List View) */}
        {viewMode === "list" && (
          <div className="flex items-center gap-1 border border-ink-200 rounded-sm">
            <button
              data-testid="appt-prev"
              onClick={() => shiftDay(-1)}
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
              onClick={() => shiftDay(1)}
              className="h-8 w-8 grid place-items-center text-ink-600 hover:text-ink-900 hover:bg-bone"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {viewMode === "list" && (
          <button
            data-testid="appt-today"
            onClick={() => {
              const today = new Date();
              setDate(today);
              setCurrentMonth(today);
            }}
            className="h-8 px-3 text-[12.5px] border border-ink-200 rounded-sm hover:bg-bone text-ink-600"
          >
            Today
          </button>
        )}

        <div className="flex items-center gap-1">
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
          className="btn-primary btn-sm"
        >
          <Plus className="w-4 h-4" />
          Book appointment
        </Link>
      </div>

      {/* ─── VIEW MODE: LIST VIEW ────────────────────────────────────── */}
      {viewMode === "list" && (
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
              {dayAppointments.map((a) => {
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
                      <div className="flex flex-col gap-1 items-start">
                        <StatusPill status={a.status} />
                        {a.status === "cancelled" && a.cancellationReason && (
                          <span className="text-[10px] font-semibold bg-clay-soft text-clay border border-clay/20 px-1.5 py-0.5 rounded-sm uppercase tracking-wide leading-none">
                            {a.cancellationReason}
                          </span>
                        )}
                      </div>
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
                          onClick={() => setCancelTarget(a)}
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
              {dayAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-ink-400">
                    Nothing for this day. Try another date or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── VIEW MODE: CALENDAR VIEW ────────────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Month Grid Board */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-ink-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[15px] font-semibold text-ink-900">
                {currentMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-1 border border-ink-200 rounded-lg p-0.5">
                <button
                  onClick={() => shiftMonth(-1)}
                  className="h-7 w-7 grid place-items-center hover:bg-bone rounded text-ink-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today);
                    setDate(today);
                  }}
                  className="px-2 text-[12px] hover:bg-bone rounded text-ink-600"
                >
                  Today
                </button>
                <button
                  onClick={() => shiftMonth(1)}
                  className="h-7 w-7 grid place-items-center hover:bg-bone rounded text-ink-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid (Header weekdays + 42 Days grid) */}
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-7 text-center font-mono text-[10.5px] uppercase tracking-wider text-ink-400 border-b border-ink-100 pb-1.5">
                {WEEKDAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarGridDays.map((dayObj, idx) => {
                  const dayIso = toISO(dayObj.dateObj);
                  const isSelected = iso === dayIso;
                  
                  // Filter appointments for this specific cell
                  const cellApts = appointments
                    .filter((a) => a.date === dayIso)
                    .filter((a) => (doctorId === "ALL" ? true : a.doctorId === doctorId))
                    .filter((a) => filterMatch(a.status, filter))
                    .sort((a, b) => a.time.localeCompare(b.time));

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setDate(dayObj.dateObj);
                        if (dayObj.monthOffset !== 0) {
                          setCurrentMonth(dayObj.dateObj);
                        }
                      }}
                      className={`text-left p-1.5 min-h-[90px] border rounded-lg transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "bg-sage-soft border-sage"
                          : dayObj.monthOffset !== 0
                          ? "bg-bone/40 border-ink-100/50 text-ink-300 opacity-60"
                          : "bg-white border-ink-200 text-ink-800 hover:border-sage/40 hover:bg-sage-soft/10"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`w-5 h-5 rounded-full text-[11px] font-mono flex items-center justify-center font-semibold ${
                            isSelected ? "bg-sage text-white" : "text-ink-900"
                          }`}
                        >
                          {dayObj.day}
                        </span>
                        {cellApts.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                        )}
                      </div>

                      {/* Display first 3 appointment patient names */}
                      <div className="flex flex-col gap-1 w-full mt-1">
                        {cellApts.slice(0, 3).map((a) => {
                          const pat = patients.find((p) => p.id === a.patientId);
                          const name = pat ? pat.name.split(" ")[0] : a.patientId.slice(-4);
                          return (
                            <div
                              key={a.id}
                              className="text-[9.5px] px-1 py-0.5 rounded bg-bone border border-ink-150 text-ink-700 truncate leading-none flex justify-between gap-1 items-center font-medium"
                            >
                              <span className="font-mono text-[8px] text-ink-400">{a.time}</span>
                              <span className="truncate">{name}</span>
                            </div>
                          );
                        })}
                        {cellApts.length > 3 && (
                          <div className="text-[8.5px] font-bold text-sage pl-1 font-mono">
                            +{cellApts.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Detailed Actions Sidebar */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-ink-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
            <div className="border-b border-ink-200 pb-2">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-400">Selected date details</span>
              <h3 className="font-heading text-[15.5px] font-semibold text-ink-900 mt-0.5">
                {date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </h3>
              <p className="text-[12px] text-ink-500 mt-1">
                {dayAppointments.length} appointment{dayAppointments.length !== 1 && "s"} scheduled.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 flex flex-col gap-2.5">
              {dayAppointments.map((a) => {
                const pat = patients.find((x) => x.id === a.patientId);
                const doc = doctors.find((x) => x.id === a.doctorId);
                return (
                  <div
                    key={a.id}
                    className="p-3 bg-bone border border-ink-150 rounded-xl text-[12.5px] flex flex-col gap-2 transition-all"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="font-mono text-ink-900 font-bold">{a.time}</span>
                      <StatusPill status={a.status} />
                    </div>

                    <div>
                      <div className="font-bold text-ink-900">{pat?.name}</div>
                      <div className="text-[11px] text-ink-400 font-mono flex justify-between">
                        <span>{pat?.id}</span>
                        <span>Token {a.tokenNumber ? `#${a.tokenNumber}` : "—"}</span>
                      </div>
                    </div>

                    <div className="text-[11.5px] text-ink-600 bg-white p-2 rounded border border-ink-100">
                      <div>Dr. {doc?.name}</div>
                      <div className="text-[10.5px] text-ink-400 mt-0.5">{doc?.specialty} · Type: {a.type}</div>
                    </div>

                    {a.status === "cancelled" && a.cancellationReason && (
                      <div className="text-[10px] uppercase font-bold bg-clay-soft text-clay border border-clay/20 px-2 py-0.5 rounded leading-none w-max">
                        Reason: {a.cancellationReason}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1 border-t border-ink-100">
                      {a.status === "scheduled" && (
                        <Link
                          to="/reception/check-in"
                          className="px-2.5 h-7 text-[12px] bg-sage text-white hover:bg-sage-hover rounded flex items-center font-medium transition-colors"
                        >
                          Check-in
                        </Link>
                      )}
                      {a.status === "scheduled" && (
                        <button
                          onClick={() => setCancelTarget(a)}
                          className="px-2.5 h-7 text-[12px] bg-white border border-ink-200 text-ink-600 hover:text-status-noshowText rounded font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {a.status === "checked-in" && (
                        <button
                          onClick={() => updateAppointmentStatus(a.id, "no-show")}
                          className="px-2.5 h-7 text-[12px] bg-white border border-ink-200 text-ink-600 hover:text-status-noshowText rounded font-medium transition-colors"
                        >
                          No-show
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {dayAppointments.length === 0 && (
                <div className="py-12 text-center text-ink-400 text-[12.5px]">
                  No appointments scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CancelAppointmentModal
        open={cancelTarget !== null}
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={(apptId, reason, notes, rescheduleObj) => {
          cancelAppointment(apptId, { reason, notes, reschedule: rescheduleObj });
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
