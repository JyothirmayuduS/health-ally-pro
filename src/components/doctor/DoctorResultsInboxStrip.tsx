import { Link } from "@tanstack/react-router";
import { ChevronRight, FlaskConical } from "lucide-react";
import { getResultsInboxSummary } from "@/lib/doctor-home-data";
import { cn } from "@/lib/utils";

export function DoctorResultsInboxStrip({ className }: { className?: string }) {
  const inbox = getResultsInboxSummary();

  return (
    <Link
      to="/doctor/reports"
      search={inbox.firstReview ? { id: inbox.firstReview.id } : undefined}
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
        className,
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#E8EFE6]">
        <FlaskConical className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-wide text-[#B8735D]">RESULTS INBOX</p>
        <p className="text-base font-semibold text-[#1B3B2E]">{inbox.headline}</p>
        <p className="truncate text-sm text-[#8A8F8C]">{inbox.subline}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#B8735D]" />
    </Link>
  );
}
