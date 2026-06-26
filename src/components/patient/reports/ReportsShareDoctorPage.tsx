import { Link } from "@tanstack/react-router";
import { Calendar, Check, Minus, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShareProgressOverlay } from "@/components/patient/reports/ShareProgressOverlay";
import {
  ReportsSubpageLayout,
  reportsListItemClass,
  reportsListWrapClass,
} from "@/components/patient/reports/ReportsSubpageLayout";
import { reports } from "@/lib/mock-data";
import {
  PATIENT_REPORTS_EVENT,
  activatePendingGrants,
  addShareGrants,
  grantsForReport,
} from "@/lib/patient-reports-store";
import { SHAREABLE_DOCTORS } from "@/lib/reports-utils";
import { cn } from "@/lib/utils";

export function ReportsShareDoctorPage({ reportId }: { reportId: string }) {
  const report = reports.find((r) => r.id === reportId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [expiresDays, setExpiresDays] = useState(7);
  const [progressOpen, setProgressOpen] = useState(false);
  const [pendingDoctorIds, setPendingDoctorIds] = useState<string[]>([]);
  const [grantVersion, setGrantVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setGrantVersion((v) => v + 1);
    window.addEventListener(PATIENT_REPORTS_EVENT, refresh);
    return () => window.removeEventListener(PATIENT_REPORTS_EVENT, refresh);
  }, []);

  const existingDoctorIds = useMemo(
    () => grantsForReport(reportId).map((g) => g.doctorId),
    [reportId, grantVersion],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SHAREABLE_DOCTORS.filter((d) => {
      if (existingDoctorIds.includes(d.id)) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)
      );
    });
  }, [query, existingDoctorIds]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGrant = () => {
    setPendingDoctorIds(selected);
    setProgressOpen(true);
  };

  const handleProgressComplete = useCallback(() => {
    addShareGrants(reportId, pendingDoctorIds, expiresDays);
    activatePendingGrants(reportId);
    setProgressOpen(false);
    setSelected([]);
    setGrantVersion((v) => v + 1);
  }, [reportId, pendingDoctorIds, expiresDays]);

  if (!report) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Report not found.</p>
        <Link to="/reports/share" className="mt-4 inline-block text-clay">
          Back
        </Link>
      </div>
    );
  }

  return (
    <>
      <ReportsSubpageLayout
        title="Share Report"
        subtitle={report.title}
        backTo="/reports/share"
        footer={
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={handleGrant}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-35"
          >
            <Check className="h-4 w-4" />
            Grant access to {selected.length} doctor{selected.length === 1 ? "" : "s"}
          </button>
        }
      >
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or specialty…"
            className="w-full rounded-2xl border border-[#EDEAE6] bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
          />
        </div>

        <ul className={cn(reportsListWrapClass(), "mb-6")}>
          {filtered.map((doc) => {
            const active = selected.includes(doc.id);
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className={reportsListItemClass(active)}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/10 font-medium text-ink">
                      {doc.initials}
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-ink">{doc.name}</p>
                      <p className="text-sm text-ink-muted">{doc.specialty}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        ★ {doc.rating} · {doc.hospital}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-[#D8D4CE] bg-white",
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="py-12 text-center text-sm text-ink-muted">
              No doctors match your search.
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <Calendar className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
              Access expires in
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">
              Revoke anytime from this screen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpiresDays((d) => Math.max(1, d - 1))}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#EDEAE6] bg-white"
              aria-label="Decrease days"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2.5rem] text-center font-semibold tabular-nums text-ink">
              {expiresDays}d
            </span>
            <button
              type="button"
              onClick={() => setExpiresDays((d) => Math.min(30, d + 1))}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#EDEAE6] bg-white"
              aria-label="Increase days"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </ReportsSubpageLayout>

      <ShareProgressOverlay open={progressOpen} onComplete={handleProgressComplete} />
    </>
  );
}
