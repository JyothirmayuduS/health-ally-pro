import { useState, useEffect } from "react";
import {
  loadSharedLeaves,
  addLeaveRequest,
  type StaffLeaveRequest,
  type LeaveType,
  type StaffCategory,
} from "@/lib/shared/staff-leaves";
import {
  CalendarDays,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface StaffProfile {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  category: StaffCategory;
}

// Detect active staff profile based on path
function getActiveProfile(): StaffProfile {
  if (typeof window === "undefined") {
    return { staffId: "STF-GEN", staffName: "Staff Member", role: "Staff", department: "General", category: "staff" };
  }
  const path = window.location.pathname;
  if (path.startsWith("/doctor")) {
    return { staffId: "DOC-001", staffName: "Dr. Aarav Mehta", role: "General Physician", department: "General Medicine", category: "doctor" };
  }
  if (path.startsWith("/reception")) {
    return { staffId: "STF-001", staffName: "Reena D'souza", role: "Receptionist", department: "Reception", category: "staff" };
  }
  if (path.startsWith("/lab")) {
    return { staffId: "STF-003", staffName: "J. Mensah", role: "Lab Technician", department: "Laboratory", category: "staff" };
  }
  if (path.startsWith("/pharmacy")) {
    return { staffId: "STF-002", staffName: "Riley Chen", role: "Pharmacist", department: "Pharmacy", category: "staff" };
  }
  if (path.startsWith("/billing")) {
    return { staffId: "STF-004", staffName: "Anita Rao", role: "Billing Staff", department: "Billing", category: "staff" };
  }
  if (path.startsWith("/nursing")) {
    return { staffId: "NRS-001", staffName: "Sunita Pillai", role: "Staff Nurse", department: "ICU", category: "nurse" };
  }
  return { staffId: "STF-GEN", staffName: "Staff Member", role: "Staff", department: "General", category: "staff" };
}

const LEAVE_TYPES: { value: LeaveType; label: string; color: string }[] = [
  { value: "sick", label: "Sick Leave", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "casual", label: "Casual Leave", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "conference", label: "Conference / CME", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "emergency", label: "Emergency Leave", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "maternity", label: "Maternity Leave", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { value: "paternity", label: "Paternity Leave", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
];

const STATUS_STYLES = {
  pending: { icon: Clock, label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { icon: CheckCircle2, label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { icon: XCircle, label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function StaffLeavePortal() {
  const profile = getActiveProfile();
  const [leaves, setLeaves] = useState<StaffLeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setLeaves(loadSharedLeaves().filter((l) => l.staffId === profile.staffId));
  }, [profile.staffId]);

  const calcDays = () => {
    if (!fromDate || !toDate) return 0;
    const diff = (new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400_000;
    return Math.max(0, Math.round(diff) + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = calcDays();
    if (days === 0) { toast.error("Invalid date range"); return; }

    const req: StaffLeaveRequest = {
      id: `SLR-${Date.now()}`,
      staffId: profile.staffId,
      staffName: profile.staffName,
      role: profile.role,
      department: profile.department,
      category: profile.category,
      leaveType,
      fromDate,
      toDate,
      days,
      reason,
      status: "pending",
    };

    const nextList = addLeaveRequest(req);
    setLeaves(nextList.filter((l) => l.staffId === profile.staffId));
    setShowForm(false);
    setReason(""); setFromDate(""); setToDate(""); setLeaveType("casual");
    toast.success("Leave application submitted for admin review");
  };

  const filtered = filterStatus === "all" ? leaves : leaves.filter((l) => l.status === filterStatus);

  // Summary counts
  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;
  const totalDays = leaves.filter((l) => l.status === "approved").reduce((s, l) => s + l.days, 0);

  return (
    <div className="space-y-6" data-testid="staff-leave-portal">

      {/* Header action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 surface px-5 py-4 shadow-soft border border-ink-100 rounded-lg">
        <div>
          <h2 className="font-heading font-semibold text-ink-950 text-[15px]">Leave Management Portal</h2>
          <p className="text-[12px] text-ink-400 mt-0.5">Logged in as {profile.staffName} ({profile.role}) · {profile.department}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-plum text-white text-[13px] font-semibold hover:bg-plum/85 transition shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          Apply for Leave
        </button>
      </div>

      {/* Summary KPI strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface px-5 py-4 border-l-4 border-l-amber-400 shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">Pending Review</p>
          <p className="text-3xl font-heading font-bold text-amber-600 mt-1.5 tabular-nums">{pending}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">Awaiting admin decision</p>
        </div>
        <div className="surface px-5 py-4 border-l-4 border-l-teal shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">Approved This Year</p>
          <p className="text-3xl font-heading font-bold text-teal mt-1.5 tabular-nums">{approved}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">Leave requests approved</p>
        </div>
        <div className="surface px-5 py-4 border-l-4 border-l-plum shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">Days Availed</p>
          <p className="text-3xl font-heading font-bold text-plum mt-1.5 tabular-nums">{totalDays}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">Total approved leave days</p>
        </div>
      </div>

      {/* Filters + leave history list */}
      <div className="surface overflow-hidden shadow-soft">
        <div className="border-b border-ink-100 px-5 py-3.5 bg-bone/25 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            My Leave History
          </span>
          <div className="flex items-center gap-1">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded text-[11px] font-medium capitalize transition ${
                  filterStatus === s
                    ? "bg-plum text-white"
                    : "bg-white border border-stone-200 text-ink-500 hover:bg-stone-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-400">
              <CalendarDays className="h-10 w-10 opacity-30" />
              <p className="text-[13px]">No leave applications found</p>
            </div>
          ) : (
            filtered.map((req) => {
              const typeInfo = LEAVE_TYPES.find((t) => t.value === req.leaveType);
              const statusInfo = STATUS_STYLES[req.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bone/10 transition">
                  <div className="flex items-start gap-4">
                    {/* Leave type badge */}
                    <div className={`mt-0.5 px-2.5 py-1 rounded-md border text-[10.5px] font-bold uppercase shrink-0 ${typeInfo?.color}`}>
                      {typeInfo?.label}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-ink-900 text-[13.5px]">
                        {new Date(req.fromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        {req.fromDate !== req.toDate && (
                          <> → {new Date(req.toDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</>
                        )}
                        <span className="ml-2 text-[11px] text-ink-400 font-normal">({req.days} day{req.days > 1 ? "s" : ""})</span>
                      </p>
                      <p className="text-[12.5px] text-ink-600 italic">"{req.reason}"</p>
                      {req.locumCoverName && (
                        <p className="text-[11.5px] text-teal font-medium">Cover: {req.locumCoverName}</p>
                      )}
                      {req.decidedAt && (
                        <p className="text-[10.5px] text-ink-400 font-mono">
                          Decided: {new Date(req.decidedAt).toLocaleDateString("en-IN")}
                          {req.decidedBy && ` by ${req.decidedBy}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold shrink-0 ${statusInfo.cls}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusInfo.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Apply for Leave Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-plum/10 text-plum grid place-items-center shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-ink-950 text-[15px]">Apply for Leave</h3>
                <p className="text-[11.5px] text-ink-400 mt-0.5">{profile.staffName} · {profile.department}</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-700 transition p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Leave type chips */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Leave Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEAVE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setLeaveType(t.value)}
                      className={`h-9 rounded-lg border text-[11px] font-semibold transition ${
                        leaveType === t.value
                          ? "bg-plum text-white border-plum"
                          : "bg-white text-ink-600 border-stone-200 hover:border-plum/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); if (!toDate) setToDate(e.target.value); }}
                    className="w-full h-10 rounded-lg border border-stone-300 px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">To Date</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-stone-300 px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                  />
                </div>
              </div>

              {fromDate && toDate && (
                <div className="bg-plum/5 border border-plum/15 rounded-lg px-4 py-2.5 text-[12.5px] text-plum font-medium">
                  Total: <strong>{calcDays()} day{calcDays() !== 1 ? "s" : ""}</strong> of leave requested
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-ink-500">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly describe the reason for this leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 flex justify-between items-center bg-stone-50/60 shrink-0">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[12.5px] font-medium text-ink-600 hover:text-ink-900 transition px-3 py-2 rounded-lg hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-plum text-white text-[13px] font-semibold hover:bg-plum/85 transition shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
