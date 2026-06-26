import { Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ReportsSubpageLayout,
  reportsListItemClass,
  reportsListWrapClass,
} from "@/components/patient/reports/ReportsSubpageLayout";
import type { Report } from "@/lib/mock-data";
import { reports as mockReports } from "@/lib/mock-data";
import { fetchReportsForPatient } from "@/lib/supabase/queries";
import { formatReportDate, reportTypeStyle } from "@/lib/reports-utils";
import { cn } from "@/lib/utils";

export function ReportsSharePickerPage() {
  const [reports, setReports] = useState<Report[]>(mockReports);

  useEffect(() => {
    fetchReportsForPatient().then((r) => {
      if (r.length) setReports(r);
    });
  }, []);

  return (
    <ReportsSubpageLayout
      title="Share with a specialist"
      subtitle="Choose a report to share"
      backTo="/reports"
    >
      <ul className={reportsListWrapClass()}>
        {reports.map((report) => {
          const style = reportTypeStyle(report.type);
          return (
            <li key={report.id}>
              <Link
                to="/reports/share/$reportId"
                params={{ reportId: report.id }}
                className={reportsListItemClass()}
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                      style.iconBg,
                    )}
                  >
                    <FileText className={cn("h-5 w-5", style.icon)} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-2 flex-1 font-semibold text-ink lg:line-clamp-1">
                        {report.title}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          style.badge,
                        )}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {report.doctor} · {formatReportDate(report.date)} · {report.size}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </ReportsSubpageLayout>
  );
}
