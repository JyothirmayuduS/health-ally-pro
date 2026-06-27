import { useState, useMemo } from "react";
import {
  loadSharedLeaves,
  saveSharedLeaves,
  PERFORMANCE_DATA,
  type StaffLeaveRequest,
  type StaffCategory,
  type PerformanceRecord,
} from "@/lib/shared/staff-leaves";
import {
  TrendingUp,
  Users,
  CalendarOff,
  Star,
  Check,
  X,
  Download,
  Award,
  Frown,
  Meh,
  Smile,
  Sparkles,
  User,
  Activity,
  Heart,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const HIKE_CONFIG = {
  excellent:     { label: "Excellent — Hike Recommended",   pct: "15–20%", cls: "bg-emerald-50 text-emerald-700 border-emerald-200",   dot: "bg-emerald-500", icon: Sparkles },
  good:          { label: "Good — Moderate Hike",            pct: "8–12%",  cls: "bg-teal/10 text-teal border-teal/20",                  dot: "bg-teal",        icon: Smile },
  average:       { label: "Average — Nominal Hike",          pct: "3–5%",   cls: "bg-amber-50 text-amber-700 border-amber-200",           dot: "bg-amber-500",   icon: Meh },
  "below-average": { label: "Below Average — No Hike",      pct: "0%",     cls: "bg-red-50 text-red-700 border-red-200",                 dot: "bg-red-500",     icon: Frown },
};

const CATEGORY_LABELS: Record<StaffCategory, string> = {
  doctor: "Doctors",
  nurse: "Nurses",
  staff: "Staff",
};

export default function AdminHRPerformance() {
  const [leaves, setLeaves] = useState<StaffLeaveRequest[]>(() => loadSharedLeaves());
  const [activeTab, setActiveTab] = useState<"leaves" | "performance">("leaves");
  const [categoryFilter, setCategoryFilter] = useState<StaffCategory | "all">("all");
  const [selectedStaff, setSelectedStaff] = useState<PerformanceRecord | null>(null);

  // ── Leave management actions ───────────────────────────────
  const pending = leaves.filter((l) => l.status === "pending");

  const approveLeave = (id: string) => {
    const next = leaves.map((l) =>
      l.id === id ? { ...l, status: "approved" as const, decidedAt: new Date().toISOString(), decidedBy: "Admin User" } : l
    );
    setLeaves(next);
    saveSharedLeaves(next);
    toast.success("Leave approved");
  };

  const rejectLeave = (id: string) => {
    const next = leaves.map((l) =>
      l.id === id ? { ...l, status: "rejected" as const, decidedAt: new Date().toISOString(), decidedBy: "Admin User" } : l
    );
    setLeaves(next);
    saveSharedLeaves(next);
    toast.info("Leave rejected");
  };

  // ── Performance analytics ──────────────────────────────────
  const filteredPerf = useMemo(() =>
    categoryFilter === "all"
      ? PERFORMANCE_DATA
      : PERFORMANCE_DATA.filter((p) => p.category === categoryFilter),
    [categoryFilter]
  );

  const sortedByLeaves = [...filteredPerf].sort((a, b) => b.totalLeaveDays - a.totalLeaveDays);

  // ── Summary stats ──────────────────────────────────────────
  const totalPending = pending.length;
  const excellentCount = PERFORMANCE_DATA.filter((p) => p.hikeRecommendation === "excellent").length;
  const avgAttendance = Math.round(
    PERFORMANCE_DATA.reduce((s, p) => s + p.attendancePct, 0) / PERFORMANCE_DATA.length
  );

  // ── CSV export ─────────────────────────────────────────────
  const exportCSV = () => {
    const header = "Name,Role,Department,Category,Leave Days,Attendance%,Review Score,Hike Recommendation";
    const rows = filteredPerf.map((p) =>
      `"${p.staffName}","${p.role}","${p.department}","${p.category}",${p.totalLeaveDays},${p.attendancePct}%,${p.reviewScore},${p.hikeRecommendation}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hr_performance_report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Performance report exported");
  };

  return (
    <div className="space-y-6" data-testid="admin-hr-performance">

      {/* KPI summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface px-5 py-4 border-l-4 border-l-amber-400 shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">Pending Leave Requests</p>
          <p className="text-3xl font-heading font-bold text-amber-600 mt-1.5 tabular-nums">{totalPending}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">Across all departments</p>
        </div>
        <div className="surface px-5 py-4 border-l-4 border-l-teal shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">Avg Attendance</p>
          <p className="text-3xl font-heading font-bold text-teal mt-1.5 tabular-nums">{avgAttendance}%</p>
          <p className="text-[11px] text-ink-400 mt-0.5">Overall workforce</p>
        </div>
        <div className="surface px-5 py-4 border-l-4 border-l-plum shadow-soft">
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-mono">Excellent Performers</p>
          <p className="text-3xl font-heading font-bold text-plum mt-1.5 tabular-nums">{excellentCount}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">Hike recommended</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-ink-100 bg-bone/60 p-1">
        {[
          { key: "leaves", label: `Leave Requests (${leaves.length})` },
          { key: "performance", label: "Performance & Hike Report" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 rounded-md px-3 py-2 text-[12.5px] font-medium transition ${
              activeTab === tab.key ? "bg-white shadow-sm text-ink-900 border border-ink-100" : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LEAVE REQUESTS TAB ────────────────────────────────── */}
      {activeTab === "leaves" && (
        <div className="surface overflow-hidden shadow-soft">
          <div className="border-b border-ink-100 px-5 py-3.5 bg-bone/25 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              All Staff Leave Requests
            </span>
            <div className="flex items-center gap-1">
              {(["all", "doctor", "nurse", "staff"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition ${
                    categoryFilter === c ? "bg-plum text-white" : "bg-white border border-stone-200 text-ink-500 hover:bg-stone-50"
                  }`}
                >
                  {c === "all" ? "All" : CATEGORY_LABELS[c as StaffCategory]}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {leaves
              .filter((l) => categoryFilter === "all" || l.category === categoryFilter)
              .sort((a, b) => (a.status === "pending" ? -1 : 1))
              .map((req) => {
                const leaveTypeColors: Record<string, string> = {
                  sick: "bg-red-100 text-red-700 border-red-200",
                  casual: "bg-blue-100 text-blue-700 border-blue-200",
                  conference: "bg-purple-100 text-purple-700 border-purple-200",
                  emergency: "bg-amber-100 text-amber-700 border-amber-200",
                  maternity: "bg-pink-100 text-pink-700 border-pink-200",
                  paternity: "bg-cyan-100 text-cyan-700 border-cyan-200",
                };

                return (
                  <div key={req.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bone/10 transition">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Category dot */}
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                        req.category === "doctor" ? "bg-plum" : req.category === "nurse" ? "bg-teal" : "bg-mustard"
                      }`} />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-900 text-[13.5px]">{req.staffName}</span>
                          <span className="text-[11.5px] text-ink-400">{req.role} · {req.department}</span>
                          <span className={`px-2 py-0.5 rounded border text-[9.5px] font-bold uppercase ${leaveTypeColors[req.leaveType]}`}>
                            {req.leaveType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${
                            req.category === "doctor" ? "bg-plum/10 text-plum border-plum/20" :
                            req.category === "nurse" ? "bg-teal/10 text-teal border-teal/20" :
                            "bg-mustard/10 text-mustard border-mustard/20"
                          }`}>
                            {req.category}
                          </span>
                        </div>
                        <p className="text-[12.5px] text-ink-600 italic truncate">"{req.reason}"</p>
                        <p className="text-[11.5px] text-ink-400 font-mono">
                          {req.fromDate} → {req.toDate} · {req.days} day{req.days > 1 ? "s" : ""}
                        </p>
                        {req.locumCoverName && (
                          <p className="text-[11px] text-teal font-medium">Cover: {req.locumCoverName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => approveLeave(req.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal text-white text-[12px] font-semibold hover:bg-teal/80 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectLeave(req.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-[12px] font-semibold hover:bg-red-50 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold ${
                          req.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {req.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── PERFORMANCE TAB ───────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {(["all", "doctor", "nurse", "staff"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition ${
                    categoryFilter === c
                      ? "bg-plum text-white"
                      : "bg-white border border-stone-200 text-ink-500 hover:bg-stone-50"
                  }`}
                >
                  {c === "all" ? "All Staff" : CATEGORY_LABELS[c as StaffCategory]}
                </button>
              ))}
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 bg-white text-[12.5px] font-medium text-ink-700 hover:bg-stone-50 transition"
            >
              <Download className="h-4 w-4" />
              Export Report CSV
            </button>
          </div>

          {/* Hike summary chips */}
          <div className="grid gap-3 sm:grid-cols-4">
            {(Object.entries(HIKE_CONFIG) as [string, typeof HIKE_CONFIG["excellent"]][]).map(([key, cfg]) => {
              const count = filteredPerf.filter((p) => p.hikeRecommendation === key).length;
              const Icon = cfg.icon;
              return (
                <div key={key} className={`surface px-4 py-3 flex items-center gap-3 border shadow-soft`}>
                  <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-ink-400">{cfg.pct} hike</p>
                    <p className="text-[15px] font-heading font-bold text-ink-900">{count} {count === 1 ? "person" : "people"}</p>
                  </div>
                  <Icon className="h-5 w-5 text-ink-300 shrink-0" />
                </div>
              );
            })}
          </div>

          {/* Performance table */}
          <div className="surface overflow-hidden shadow-soft">
            <div className="border-b border-ink-100 px-5 py-3.5 bg-bone/25">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                Staff Performance & Hike Recommendations (Click row to view report)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] whitespace-nowrap">
                <thead className="border-b border-ink-100 bg-bone/40 font-mono">
                  <tr>
                    {["Staff Member", "Department", "Total Leaves", "Sick / Casual / Emergency", "Attendance", "Review Score", "Patients Handled", "Hike Rec."].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedByLeaves.map((p) => {
                    const hikeCfg = HIKE_CONFIG[p.hikeRecommendation];
                    return (
                      <tr 
                        key={p.staffId} 
                        onClick={() => setSelectedStaff(p)}
                        className="hover:bg-bone/15 transition cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-ink-900">{p.staffName}</div>
                          <div className="text-[11px] text-ink-400 flex items-center gap-1.5 mt-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              p.category === "doctor" ? "bg-plum" : p.category === "nurse" ? "bg-teal" : "bg-mustard"
                            }`} />
                            {p.role}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ink-600">{p.department}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[13px] ${
                            p.totalLeaveDays >= 10 ? "text-red-600" :
                            p.totalLeaveDays >= 5 ? "text-amber-600" : "text-teal"
                          }`}>
                            {p.totalLeaveDays}d
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-ink-600 text-[12px]">
                          {p.sickLeaves}s / {p.casualLeaves}c / {p.emergencyLeaves}e
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-stone-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.attendancePct >= 95 ? "bg-teal" : p.attendancePct >= 85 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${p.attendancePct}%` }}
                              />
                            </div>
                            <span className="font-mono font-semibold text-ink-800">{p.attendancePct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold tabular-nums">{p.reviewScore.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-ink-600">
                          {p.patientsHandled != null ? `${p.patientsHandled} pts` : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold ${hikeCfg.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${hikeCfg.dot}`} />
                            {p.hikeRecommendation === "below-average" ? "No Hike" : `${hikeCfg.pct}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom insight callout */}
          <div className="surface p-5 border border-plum/15 bg-plum/5 flex gap-4">
            <Award className="h-8 w-8 text-plum shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink-900 text-[14px]">Top Performers This Cycle</p>
              <p className="text-[12.5px] text-ink-600 mt-1 leading-relaxed">
                {filteredPerf
                  .filter((p) => p.hikeRecommendation === "excellent")
                  .map((p) => p.staffName)
                  .join(", ") || "None in this filter"} have demonstrated outstanding attendance, patient handling, and low unplanned leaves.
                Consider a <strong>15–20% incremental hike</strong> for these staff.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Performance Report Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-bone/20">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${
                  selectedStaff.category === "doctor" ? "bg-plum-soft text-plum" :
                  selectedStaff.category === "nurse" ? "bg-teal-soft text-teal" :
                  "bg-mustard-soft text-mustard"
                }`}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-ink-950 text-[15px]">HR Performance Dossier</h3>
                  <p className="text-[11.5px] text-ink-400 font-mono mt-0.5">{selectedStaff.staffId} · {selectedStaff.department}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStaff(null)} 
                className="text-ink-400 hover:text-ink-700 transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Profile Block */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-heading font-bold text-xl text-ink-950">{selectedStaff.staffName}</h4>
                  <p className="text-[13px] text-ink-500 font-medium mt-0.5">{selectedStaff.role}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${HIKE_CONFIG[selectedStaff.hikeRecommendation].cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${HIKE_CONFIG[selectedStaff.hikeRecommendation].dot}`} />
                  Hike: {HIKE_CONFIG[selectedStaff.hikeRecommendation].pct}
                </div>
              </div>

              {/* Core Parameters Row */}
              <div className="grid grid-cols-3 gap-4 border-t border-b border-stone-100 py-4 font-mono text-center">
                <div>
                  <span className="text-[9.5px] text-ink-400 uppercase font-sans tracking-wider block">Attendance</span>
                  <span className="text-lg font-bold text-ink-900 block mt-1">{selectedStaff.attendancePct}%</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-ink-400 uppercase font-sans tracking-wider block">Review Score</span>
                  <span className="text-lg font-bold text-amber-500 mt-1 flex items-center justify-center gap-0.5">
                    <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                    {selectedStaff.reviewScore.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] text-ink-400 uppercase font-sans tracking-wider block">Leaves Taken</span>
                  <span className="text-lg font-bold text-ink-900 block mt-1">{selectedStaff.totalLeaveDays} days</span>
                </div>
              </div>

              {/* Leave Type Breakdown list */}
              <div className="space-y-2.5">
                <h5 className="text-[11px] uppercase font-bold tracking-wider text-ink-400">Leave Breakdown</h5>
                <div className="grid grid-cols-3 gap-2 text-center text-[12px] font-mono">
                  <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <span className="text-red-700 block font-bold text-[15px]">{selectedStaff.sickLeaves}</span>
                    <span className="text-[10px] text-red-500 uppercase font-sans">Sick</span>
                  </div>
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <span className="text-blue-700 block font-bold text-[15px]">{selectedStaff.casualLeaves}</span>
                    <span className="text-[10px] text-blue-500 uppercase font-sans">Casual</span>
                  </div>
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                    <span className="text-amber-700 block font-bold text-[15px]">{selectedStaff.emergencyLeaves}</span>
                    <span className="text-[10px] text-amber-500 uppercase font-sans">Emergency</span>
                  </div>
                </div>
              </div>

              {/* Productivity Stats */}
              <div className="space-y-2">
                <h5 className="text-[11px] uppercase font-bold tracking-wider text-ink-400">Productivity & Notes</h5>
                <div className="p-4 bg-stone-50 border rounded-lg space-y-2 text-[13px] text-ink-700">
                  {selectedStaff.category === "doctor" && (
                    <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
                      <span>Total consultations handled:</span>
                      <strong className="font-mono text-ink-900">{selectedStaff.patientsHandled} patients</strong>
                    </div>
                  )}
                  <div className="flex items-start gap-2 pt-1 text-[12.5px] leading-relaxed">
                    <AlertCircle className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
                    <span>
                      {selectedStaff.attendancePct >= 95 
                        ? "Exceptional consistency observed in shift adherence. Low unplanned leave frequency helps keep ward disruptions to a minimum."
                        : selectedStaff.attendancePct >= 85 
                        ? "Regular contributor with normal leave utilization patterns. Performance aligns with department workload projections."
                        : "Higher than average leave pattern observed. Recommend setting up a review meeting to discuss schedule adjustments."}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 flex justify-end bg-stone-50/60">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-[12.5px] font-semibold text-ink-700 bg-white hover:bg-stone-100 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
