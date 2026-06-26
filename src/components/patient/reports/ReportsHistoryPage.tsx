import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock4, FileText, Share2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Report } from "@/lib/mock-data";
import { reports as mockReports } from "@/lib/mock-data";
import {
  listReportShareGrants,
  PATIENT_REPORTS_EVENT,
  type ReportShareGrant,
} from "@/lib/patient-reports-store";
import { formatReportDate, reportTypeStyle } from "@/lib/reports-utils";
import { cn } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  kind: "upload" | "share" | "revoke" | "access";
  title: string;
  detail: string;
  at: string;
  reportId?: string;
};

type HistoryFilter = "all" | "uploads" | "sharing";

function buildHistory(reports: Report[], grants: ReportShareGrant[]): HistoryEntry[] {
  const entries: HistoryEntry[] = [];

  for (const report of reports) {
    entries.push({
      id: `upload-${report.id}`,
      kind: "upload",
      title: report.title,
      detail: `Uploaded · ${report.size}`,
      at: report.date,
      reportId: report.id,
    });
  }

  for (const grant of grants) {
    entries.push({
      id: grant.id,
      kind: grant.status === "pending" ? "access" : "share",
      title: grant.doctorName,
      detail:
        grant.status === "pending"
          ? `Access pending · ${grant.expiresDays}d expiry`
          : `Shared access · ${grant.expiresDays}d expiry`,
      at: grant.grantedAt,
      reportId: grant.reportId,
    });
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function historyIcon(kind: HistoryEntry["kind"]) {
  if (kind === "upload") return Upload;
  if (kind === "share" || kind === "access") return Share2;
  return Clock4;
}

function monthKey(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function matchesFilter(entry: HistoryEntry, filter: HistoryFilter): boolean {
  if (filter === "all") return true;
  if (filter === "uploads") return entry.kind === "upload";
  return entry.kind === "share" || entry.kind === "access" || entry.kind === "revoke";
}

export function ReportsHistoryPage({ reports = mockReports }: { reports?: Report[] }) {
  const [grants, setGrants] = useState<ReportShareGrant[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    setGrants(listReportShareGrants());
    const refresh = () => setGrants(listReportShareGrants());
    window.addEventListener(PATIENT_REPORTS_EVENT, refresh);
    return () => window.removeEventListener(PATIENT_REPORTS_EVENT, refresh);
  }, []);

  const history = useMemo(() => buildHistory(reports, grants), [reports, grants]);
  const filtered = useMemo(
    () => history.filter((e) => matchesFilter(e, filter)),
    [history, filter],
  );

  const uploadCount = history.filter((e) => e.kind === "upload").length;
  const shareCount = history.filter(
    (e) => e.kind === "share" || e.kind === "access",
  ).length;

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of filtered) {
      const key = monthKey(entry.at);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <Link
        to="/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-ink lg:hidden"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>Your reports</span>
      </Link>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start xl:gap-10">
        <div className="min-w-0">
          <header className="mb-6 border-b border-[#EDEAE6] pb-6 lg:mb-8">
            <div className="flex items-start gap-3">
              <Link
                to="/reports"
                className="mt-1 hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#EDEAE6] bg-white transition-colors hover:border-clay/30 lg:grid"
                aria-label="Back to reports"
              >
                <ChevronLeft className="h-5 w-5 text-ink" strokeWidth={2.25} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
                  Clinical archive
                </p>
                <h1 className="mt-1 font-serif text-[28px] leading-tight text-ink sm:text-[32px] lg:text-[38px]">
                  Archive history
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Uploads, shares, and access changes across your medical records.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  { id: "all" as const, label: "All activity" },
                  { id: "uploads" as const, label: `Uploads (${uploadCount})` },
                  { id: "sharing" as const, label: `Sharing (${shareCount})` },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(chip.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    filter === chip.id
                      ? "border-ink bg-ink text-white"
                      : "border-[#EDEAE6] bg-white text-ink-muted hover:border-clay/30",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </header>

          {filtered.length === 0 ? (
            <div className="rounded-[24px] border border-[#EDEAE6] bg-white px-6 py-16 text-center">
              <FileText className="mx-auto h-8 w-8 text-ink-muted" />
              <p className="mt-3 font-medium text-ink">No activity in this view</p>
              <p className="mt-1 text-sm text-ink-muted">
                {filter === "all"
                  ? "Upload a report or share with a doctor to see history here."
                  : "Try another filter to see more events."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(([month, entries]) => (
                <section key={month}>
                  <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    {monthLabel(month)}
                  </h2>

                  {/* Desktop table header */}
                  <div className="mb-1 hidden grid-cols-[auto_minmax(0,1fr)_100px_120px_32px] items-center gap-4 rounded-t-xl border border-b-0 border-[#EDEAE6] bg-[#F9F7F2]/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted lg:grid">
                    <span className="w-10" />
                    <span>Record</span>
                    <span>Type</span>
                    <span>Date</span>
                    <span />
                  </div>

                  <ul
                    className={cn(
                      "flex flex-col gap-2.5 lg:gap-0",
                      "lg:overflow-hidden lg:rounded-b-xl lg:border lg:border-[#EDEAE6] lg:bg-white",
                    )}
                  >
                    {entries.map((entry, idx) => (
                      <li key={entry.id}>
                        <HistoryRow
                          entry={entry}
                          report={reports.find((r) => r.id === entry.reportId)}
                          isLast={idx === entries.length - 1}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Desktop summary sidebar */}
        <aside className="mt-8 hidden xl:block">
          <div className="sticky top-8 space-y-4">
            <div className="rounded-2xl border border-[#EDEAE6] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                Summary
              </p>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-ink-muted">Total events</dt>
                  <dd className="font-semibold tabular-nums text-ink">{history.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-ink-muted">Uploads</dt>
                  <dd className="font-semibold tabular-nums text-ink">{uploadCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-ink-muted">Share events</dt>
                  <dd className="font-semibold tabular-nums text-ink">{shareCount}</dd>
                </div>
              </dl>
            </div>

            <Link
              to="/reports"
              className="flex items-center justify-between gap-3 rounded-2xl border border-clay/25 bg-clay/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-clay/15"
            >
              <span>Browse all reports</span>
              <ChevronRight className="h-4 w-4 text-clay" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HistoryRow({
  entry,
  report,
  isLast,
}: {
  entry: HistoryEntry;
  report?: Report;
  isLast: boolean;
}) {
  const Icon = historyIcon(entry.kind);
  const style = report ? reportTypeStyle(report.type) : null;

  const content = (
    <>
      {/* Mobile / card layout */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#EDEAE6] bg-white p-4 transition-colors hover:border-clay/25 sm:gap-4 lg:hidden">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F9F7F2]">
          <Icon className="h-[18px] w-[18px] text-clay" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{entry.title}</p>
            {style ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  style.badge,
                )}
              >
                {style.label}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">{entry.detail}</p>
          <p className="mt-0.5 text-xs text-ink-muted/80">{formatReportDate(entry.at)}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
      </div>

      {/* Desktop table row */}
      <div
        className={cn(
          "hidden grid-cols-[auto_minmax(0,1fr)_100px_120px_32px] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[#F9F7F2]/60 lg:grid",
          !isLast && "border-b border-[#EDEAE6]",
        )}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F9F7F2]">
          <Icon className="h-[18px] w-[18px] text-clay" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{entry.title}</p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{entry.detail}</p>
        </div>
        <div>
          {style ? (
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                style.badge,
              )}
            >
              {style.label}
            </span>
          ) : (
            <span className="text-xs text-ink-muted">Share</span>
          )}
        </div>
        <p className="text-sm tabular-nums text-ink-muted">{formatReportDate(entry.at)}</p>
        <ChevronRight className="h-4 w-4 justify-self-end text-ink-muted" />
      </div>
    </>
  );

  if (entry.reportId) {
    return (
      <Link
        to="/reports/$reportId"
        params={{ reportId: entry.reportId }}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
