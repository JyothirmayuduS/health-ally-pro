import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  FileText,
  History,
  Lock,
  Plus,
  Search,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Report } from "@/lib/mock-data";
import { reports as mockReports } from "@/lib/mock-data";
import { fetchReportsForPatient } from "@/lib/supabase/queries";
import {
  REPORT_FILTERS,
  type ReportFilter,
  countSharedReports,
  filterReports,
  formatReportDate,
  reportTypeStyle,
  sharedDoctorNames,
  SHAREABLE_DOCTORS,
} from "@/lib/reports-utils";
import { cn } from "@/lib/utils";

export function ReportsHubPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ReportFilter>("All");
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReportsForPatient().then(setReports);
  }, []);

  const allReports = reports.length ? reports : mockReports;

  const filtered = useMemo(
    () => filterReports(allReports, query, type),
    [allReports, query, type],
  );

  const sharedCount = countSharedReports(allReports);

  return (
    <div className="mx-auto w-full max-w-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:pb-12">
      <header className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
            Clinical archive
          </p>
          <h1 className="mt-1 font-serif text-[32px] leading-tight tracking-tight text-ink sm:text-[38px]">
            Your reports
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/reports/history"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#EDEAE6] bg-white text-ink transition-colors hover:border-clay/30"
            aria-label="Archive history"
          >
            <History className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Upload
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                toast.success("Upload started", {
                  description: `${file.name} is being encrypted and added to your archive.`,
                });
              }
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3 text-[13px] text-ink-muted sm:mb-6 sm:text-sm">
        <Lock className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} />
        <span>Encrypted at rest · Shareable on your terms · Revoke access anytime</span>
      </div>

      <section className="mb-5 grid grid-cols-3 gap-2.5 sm:mb-6 sm:gap-3">
        {[
          { label: "Total", value: String(allReports.length).padStart(2, "0") },
          { label: "Shared", value: String(sharedCount).padStart(2, "0") },
          { label: "Storage", value: "34.9 MB" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-[#EDEAE6] bg-white px-3 py-3.5 text-center sm:px-4 sm:py-4"
          >
            <p className="font-serif text-2xl tabular-nums text-ink sm:text-3xl">{value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted sm:text-[11px]">
              {label}
            </p>
          </div>
        ))}
      </section>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reports…"
          className="w-full rounded-2xl border border-[#EDEAE6] bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
        />
      </div>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {REPORT_FILTERS.map((chip) => {
          const active = type === chip;
          const dot =
            chip === "Lab"
              ? "bg-[#4A8F6A]"
              : chip === "Imaging"
                ? "bg-[#5B8DB8]"
                : chip === "Prescription"
                  ? "bg-[#B8735D]"
                  : null;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setType(chip)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "border-ink bg-ink text-white"
                  : "border-[#EDEAE6] bg-white text-ink-muted",
              )}
            >
              {dot ? (
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-white" : dot)} />
              ) : null}
              {chip}
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-ink-muted">
        {filtered.length} report{filtered.length === 1 ? "" : "s"}
      </p>

      <ul className="mb-5 flex flex-col gap-3 sm:gap-3.5 lg:grid lg:grid-cols-2 lg:gap-4">
        {filtered.map((report) => (
          <ReportListCard key={report.id} report={report} />
        ))}
        {filtered.length === 0 ? (
          <li className="col-span-full py-16 text-center text-sm text-ink-muted">
            No reports match your search.
          </li>
        ) : null}
      </ul>

      <Link
        to="/reports/share"
        className="flex items-center gap-4 rounded-[24px] bg-clay/15 p-4 transition-colors hover:bg-clay/20 sm:p-5 lg:col-span-2"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white">
          <Share2 className="h-5 w-5 text-clay" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 self-center">
          <p className="font-serif text-lg text-ink sm:text-xl">Share with a specialist</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            Set expiry, add watermark, or revoke access anytime.
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-ink-muted" />
      </Link>
    </div>
  );
}

function ReportListCard({ report }: { report: Report }) {
  const style = reportTypeStyle(report.type);
  const shared = sharedDoctorNames(report, SHAREABLE_DOCTORS);

  return (
    <li>
      <Link
        to="/reports/$reportId"
        params={{ reportId: report.id }}
        className="flex items-center gap-3.5 rounded-[20px] border border-[#EDEAE6] bg-white p-4 transition-colors hover:border-clay/25 sm:gap-4 sm:p-[18px]"
      >
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
            style.iconBg,
          )}
        >
          <FileText className={cn("h-5 w-5", style.icon)} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 self-center">
          <div className="flex items-center gap-2">
            <p className="line-clamp-1 flex-1 font-semibold text-ink">{report.title}</p>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                style.badge,
              )}
            >
              {style.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted sm:text-[13px]">
            {report.doctor} · {formatReportDate(report.date)} · {report.size}
          </p>
          {shared ? (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-ink-muted">
              <Share2 className="h-3 w-3 text-clay" strokeWidth={1.75} />
              Shared with {shared}
            </p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 self-center text-ink-muted" />
      </Link>
    </li>
  );
}
