import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  Clock4,
  Download,
  FileText,
  Lock,
  Pencil,
  Share2,
  Shield,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShareProgressOverlay } from "@/components/patient/reports/ShareProgressOverlay";
import { ShareReportSheet } from "@/components/patient/reports/ShareReportSheet";
import { reports } from "@/lib/mock-data";
import {
  PATIENT_REPORTS_EVENT,
  activatePendingGrants,
  addShareGrants,
  grantsForReport,
  revokeShareGrant,
  type ReportShareGrant,
} from "@/lib/patient-reports-store";
import { fetchLabItemsForReportFromSupabase } from "@/lib/patient-clinical-supabase";
import {
  formatReportDateLong,
  getLabResultsForReport,
  labStatusStyle,
  reportTypeStyle,
  type LabResultRow,
} from "@/lib/reports-utils";
import { cn } from "@/lib/utils";

export function ReportDetailPage({ reportId }: { reportId: string }) {
  const report = reports.find((r) => r.id === reportId);
  const [grants, setGrants] = useState<ReportShareGrant[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  const refresh = useCallback(() => {
    setGrants(grantsForReport(reportId));
  }, [reportId]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(PATIENT_REPORTS_EVENT, onUpdate);
    return () => window.removeEventListener(PATIENT_REPORTS_EVENT, onUpdate);
  }, [refresh]);

  const existingDoctorIds = useMemo(
    () => grants.map((g) => g.doctorId),
    [grants],
  );

  const handleGrant = useCallback((doctorIds: string[], expiresDays: number) => {
    addShareGrants(reportId, doctorIds, expiresDays);
    setProgressOpen(true);
  }, [reportId]);

  const [labResults, setLabResults] = useState<LabResultRow[]>(() =>
    getLabResultsForReport(reportId),
  );

  useEffect(() => {
    void fetchLabItemsForReportFromSupabase(reportId).then((rows) => {
      if (rows?.length) setLabResults(rows);
    });
  }, [reportId]);

  const handleProgressComplete = useCallback(() => {
    activatePendingGrants(reportId);
    setProgressOpen(false);
    refresh();
  }, [reportId, refresh]);

  if (!report) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Report not found.</p>
        <Link to="/reports" className="mt-4 inline-block text-clay">
          Back to archive
        </Link>
      </div>
    );
  }

  const style = reportTypeStyle(report.type);
  const pendingGrants = grants.filter((g) => g.status === "pending");
  const activeGrants = grants.filter((g) => g.status === "active");
  const uploadDate = new Date(report.date).toLocaleDateString("en-GB");

  return (
    <div className="mx-auto w-full max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-4xl lg:pb-12">
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 text-sm font-medium leading-none text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          Archive
        </Link>
        <span className="inline-flex h-7 shrink-0 items-center gap-2 rounded-full bg-[#E8F3EE] px-3 text-xs font-semibold leading-none text-[#2D6B4F]">
          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
          {report.type} Report
        </span>
      </div>

      <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h1 className="font-serif text-[28px] leading-tight text-ink sm:text-[32px] lg:text-[36px]">
              {report.title}
            </h1>
            <button
              type="button"
              className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#EDEAE6] bg-white"
              aria-label="Edit report"
            >
              <Pencil className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
            </button>
          </div>
          <p className="mt-2 text-sm text-ink-muted sm:text-[15px]">
            {report.doctor} · {formatReportDateLong(report.date)} · {report.size}
          </p>
        </div>
        <div className="flex gap-2.5 sm:gap-3">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3 text-sm font-semibold text-ink sm:flex-none sm:px-5"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Download
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white sm:flex-none sm:px-5"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            Share
          </button>
        </div>
      </header>

      {grants.length > 0 ? (
        <section className="mb-5 sm:mb-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-clay" strokeWidth={1.75} />
            <h2 className="font-serif text-lg text-ink">Share Status</h2>
          </div>
          <div className="flex flex-col gap-3">
            {grants.map((grant) => (
              <div
                key={grant.id}
                className="flex items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-4"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/10 font-medium text-ink">
                  {grant.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{grant.doctorName}</p>
                  <p className="text-xs text-ink-muted">{grant.specialty}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    grant.status === "pending"
                      ? "bg-[#FFF8E1] text-[#B8860B]"
                      : "bg-[#E8F3EE] text-[#2D6B4F]",
                  )}
                >
                  {grant.status === "pending" ? (
                    <Clock4 className="h-3 w-3" />
                  ) : null}
                  {grant.status === "pending" ? "Pending" : "Active"}
                </span>
              </div>
            ))}
          </div>
          {pendingGrants.length > 0 ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" />
              {pendingGrants.length} Pending
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mb-5 overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white sm:mb-6">
        <div className="flex items-center justify-between border-b border-[#EDEAE6] px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
            Your document
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
            Private
          </span>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center sm:py-14">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F3EE]">
            <FileText className="h-6 w-6 text-[#4A8F6A]" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-semibold text-ink">Clinical document</p>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            {report.title} · Upload a scan to preview it here
          </p>
        </div>
      </section>

      {labResults.length > 0 ? (
        <section className="mb-5 overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white sm:mb-6">
          <div className="flex items-center justify-between border-b border-[#EDEAE6] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
              Lab results
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
              AES-256
            </span>
          </div>
          <ul className="divide-y divide-[#EDEAE6]">
            {labResults.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
              >
                <span className="text-sm text-ink-muted">{row.name}</span>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {row.value}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      labStatusStyle(row.status),
                    )}
                  >
                    {row.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white">
        <div className="border-b border-[#EDEAE6] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-clay" strokeWidth={1.75} />
            <div>
              <h2 className="font-semibold text-ink">Access Control</h2>
              <p className="text-xs text-ink-muted">
                Shared with {activeGrants.length + pendingGrants.length} doctor
                {activeGrants.length + pendingGrants.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {grants.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {grants.map((grant) => (
                <li
                  key={grant.id}
                  className="flex items-center gap-3 rounded-2xl bg-[#F9F7F2] p-3.5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-medium text-ink">
                    {grant.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {grant.doctorName}
                    </p>
                    <p className="text-xs text-ink-muted">{grant.specialty}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeShareGrant(grant.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-white hover:text-ink"
                    aria-label={`Revoke access for ${grant.doctorName}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              This report is private. Share with specific doctors to grant view access.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EDEAE6] bg-[#F9F7F2] py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-[#F0EDE8]"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            Share with a doctor
          </button>

          <div className="rounded-2xl bg-[#F9F7F2] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Audit trail
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
              <li>· Uploaded {uploadDate}</li>
              <li>· Encrypted with AES-256</li>
              <li>
                · {grants.length} active access grant{grants.length === 1 ? "" : "s"}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <ShareReportSheet
        open={shareOpen}
        reportTitle={report.title}
        existingDoctorIds={existingDoctorIds}
        onClose={() => setShareOpen(false)}
        onGrant={handleGrant}
      />

      <ShareProgressOverlay open={progressOpen} onComplete={handleProgressComplete} />
    </div>
  );
}
