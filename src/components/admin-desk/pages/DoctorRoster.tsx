import { useState, useMemo } from "react";
import { useAdminStore } from "@/lib/admin-desk/store";
import { loadServiceFees } from "@/lib/shared/services";
import { listClinicQueue } from "@/lib/shared/clinic-queue";
import { Calendar, UserCheck, Clock, Check, X, Users, AlertCircle } from "lucide-react";

const SHIFTS = [
  { value: "morning", label: "Morning (08:00 – 16:00)" },
  { value: "afternoon", label: "Afternoon (16:00 – 24:00)" },
  { value: "night", label: "Night (00:00 – 08:00)" },
  { value: "off", label: "Off Duty" },
  { value: "leave", label: "Leave" },
] as const;

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export default function AdminDoctorRoster() {
  const {
    roster,
    updateRosterCell,
    publishRoster,
    leaveRequests,
    approveLeave,
    rejectLeave,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<"roster" | "leaves" | "onduty">("roster");
  const [selectedCell, setSelectedCell] = useState<{ docId: string; day: string } | null>(null);
  const [locumModal, setLocumModal] = useState<{ leaveId: string } | null>(null);
  const [selectedLocumId, setSelectedLocumId] = useState<string>("");

  const doctorsList = useMemo(() => loadServiceFees(), []);
  const queueList = useMemo(() => listClinicQueue(), []);

  // Compute metrics
  const onDutyCount = useMemo(() => {
    const todayDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
    return roster?.filter((r) => r.schedule[todayDay] !== "off" && r.schedule[todayDay] !== "leave").length ?? 0;
  }, [roster]);

  const pendingLeavesCount = useMemo(() => {
    return leaveRequests?.filter((lr) => lr.status === "pending").length ?? 0;
  }, [leaveRequests]);

  const handleApproveLeave = (leaveId: string) => {
    // Open modal to choose locum
    setLocumModal({ leaveId });
  };

  const handleConfirmLocum = () => {
    if (!locumModal) return;
    const locumDoc = doctorsList.find((d) => d.doctorId === selectedLocumId);
    approveLeave(locumModal.leaveId, selectedLocumId, locumDoc?.doctorName ?? "Unknown");
    setLocumModal(null);
    setSelectedLocumId("");
  };

  return (
    <div className="space-y-6" data-testid="admin-doctor-roster">
      {/* Roster Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Doctors On Duty Today</div>
          <div className="mt-1.5 text-3xl font-heading font-semibold text-teal">{onDutyCount}</div>
        </div>

        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Pending Leave Requests</div>
          <div className="mt-1.5 text-3xl font-heading font-semibold text-clay">{pendingLeavesCount}</div>
        </div>

        <div className="surface px-5 py-4">
          <div className="text-[10.5px] uppercase tracking-widest text-ink-400 font-mono">Queue Load</div>
          <div className="mt-1.5 text-3xl font-heading font-semibold text-plum">{queueList.length} waiting</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-ink-100 bg-bone/60 p-1">
        <button
          onClick={() => setActiveTab("roster")}
          className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
            activeTab === "roster" ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          Weekly Roster Grid
        </button>
        <button
          onClick={() => setActiveTab("leaves")}
          className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
            activeTab === "leaves" ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          Leave Management ({pendingLeavesCount})
        </button>
        <button
          onClick={() => setActiveTab("onduty")}
          className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-colors ${
            activeTab === "onduty" ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          Live Doctor Board
        </button>
      </div>

      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-bone/20">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Weekly Schedule</span>
              <button
                onClick={() => publishRoster()}
                className="rounded-md bg-teal px-3 py-1 text-[11px] font-medium text-white hover:bg-teal/80 transition"
              >
                Publish & Sync to Reception
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] whitespace-nowrap">
                <thead className="border-b border-ink-100 bg-bone/40 font-mono">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Doctor</th>
                    {DAYS.map((d) => (
                      <th key={d.key} className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-400 w-28">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {roster?.map((entry) => (
                    <tr key={entry.doctorId} className="hover:bg-bone/10">
                      <td className="px-5 py-3 font-medium">
                        <div className="font-semibold text-ink-900">{entry.doctorName}</div>
                        <div className="text-[11px] text-ink-400">{entry.specialty}</div>
                      </td>
                      {DAYS.map((d) => {
                        const val = entry.schedule[d.key];
                        return (
                          <td key={d.key} className="px-2 py-3 text-center">
                            <button
                              onClick={() => setSelectedCell({ docId: entry.doctorId, day: d.key })}
                              className={`w-full rounded px-2 py-1.5 text-[11.5px] font-medium capitalize border transition-all ${
                                val === "morning"
                                  ? "bg-blue-50 border-blue-200 text-blue-800"
                                  : val === "afternoon"
                                  ? "bg-purple-50 border-purple-200 text-purple-800"
                                  : val === "night"
                                  ? "bg-amber-50 border-amber-200 text-amber-800"
                                  : val === "leave"
                                  ? "bg-red-50 border-red-200 text-red-800 font-semibold"
                                  : "bg-stone-50 border-stone-200 text-ink-400"
                              }`}
                            >
                              {val}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[11px] text-ink-400 font-mono italic">
            * Click any shift box to assign/edit morning, afternoon, night, off-duty or leave status.
          </div>
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Leave Requests Ledger</span>
          </div>
          <div className="divide-y divide-ink-100">
            {leaveRequests?.length === 0 ? (
              <div className="px-5 py-8 text-center text-ink-400">No leave requests logged.</div>
            ) : (
              leaveRequests?.map((req) => (
                <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[14px] text-ink-900">{req.doctorName}</span>
                      <span className="text-[12px] text-ink-400">({req.specialty})</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        req.leaveType === "sick" ? "bg-red-100 text-red-800" :
                        req.leaveType === "emergency" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {req.leaveType}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-ink-600">
                      Reason: <span className="italic">"{req.reason}"</span>
                    </div>
                    <div className="text-[11.5px] text-ink-400 font-mono">
                      Dates: {req.fromDate} to {req.toDate} ({req.days} days)
                    </div>
                    {req.locumDoctorName && (
                      <div className="text-[12px] text-teal font-medium">
                        Locum Coverage: {req.locumDoctorName}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {req.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApproveLeave(req.id)}
                          className="rounded bg-teal px-3 py-1.5 text-[12px] font-medium text-white hover:bg-teal/80 transition flex items-center gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectLeave(req.id)}
                          className="rounded bg-clay px-3 py-1.5 text-[12px] font-medium text-white hover:bg-clay/80 transition flex items-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`px-2 py-1 rounded text-[11px] font-semibold capitalize ${
                        req.status === "approved" ? "bg-status-doneBg text-status-doneText" : "bg-red-50 text-red-600"
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "onduty" && (
        <div className="surface overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3 bg-bone/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Current Doctor Load & Status</span>
          </div>
          <table className="w-full text-[13px]">
            <thead className="border-b border-ink-100 bg-bone/40">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Doctor</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Room</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Encounter Queue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {roster?.map((r) => {
                const todayDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
                const isWorking = r.schedule[todayDay] !== "off" && r.schedule[todayDay] !== "leave";
                const qDepth = queueList.filter((q) => q.doctorId === r.doctorId && q.status !== "completed").length;

                return (
                  <tr key={r.doctorId} className="hover:bg-bone/10">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-900">{r.doctorName}</div>
                      <div className="text-[11.5px] text-ink-400">{r.specialty}</div>
                    </td>
                    <td className="px-5 py-3 font-mono">{r.room}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        isWorking ? "bg-status-doneBg text-status-doneText" : "bg-stone-100 text-ink-400"
                      }`}>
                        {isWorking ? "On Duty" : "Offline"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-medium">
                      {isWorking ? `${qDepth} patient(s)` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Shift Editor Popover */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="surface max-w-sm w-full overflow-hidden shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-heading font-semibold text-ink-950">Assign Shift</h3>
              <p className="text-[12px] text-ink-400 uppercase font-mono">Day: {selectedCell.day}</p>
            </div>
            <div className="space-y-2">
              {SHIFTS.map((sh) => (
                <button
                  key={sh.value}
                  onClick={() => {
                    updateRosterCell(selectedCell.docId, selectedCell.day, sh.value);
                    setSelectedCell(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md border border-ink-100 hover:bg-plum-soft hover:text-plum hover:border-plum/30 transition text-[12.5px] font-medium"
                >
                  {sh.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCell(null)}
                className="rounded border border-ink-200 px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locum Assignment Modal */}
      {locumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="surface max-w-md w-full overflow-hidden shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-heading font-semibold text-ink-950">Assign Locum Doctor</h3>
              <p className="text-[12px] text-ink-400 mt-1">
                Select a doctor to cover shifts during this leave period.
              </p>
            </div>
            <div className="space-y-3">
              <label className="block text-[11.5px] uppercase font-mono text-ink-400">Locum doctor</label>
              <select
                value={selectedLocumId}
                onChange={(e) => setSelectedLocumId(e.target.value)}
                className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
              >
                <option value="">-- Select Locum Cover --</option>
                {doctorsList.map((d) => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.doctorName} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLocumModal(null)}
                className="rounded border border-ink-200 px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocum}
                disabled={!selectedLocumId}
                className="rounded bg-teal px-3 py-1.5 text-[12px] font-medium text-white hover:bg-teal/80 disabled:opacity-50 transition"
              >
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
