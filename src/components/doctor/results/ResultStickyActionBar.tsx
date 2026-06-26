import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Stethoscope, User } from "lucide-react";
import type { ResultDocument } from "@/lib/doctor-results-imaging";
import { cn } from "@/lib/utils";

export function ResultStickyActionBar({
  doc,
  isSigned,
  onSignOff,
  onPrev,
  onNext,
  remainingReview,
  variant = "page",
  intakeGated,
  intakeDeclined,
}: {
  doc: ResultDocument;
  isSigned: boolean;
  onSignOff: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  remainingReview?: number;
  variant?: "page" | "sheet";
  intakeGated?: boolean;
  intakeDeclined?: boolean;
}) {
  if (intakeGated || intakeDeclined) {
    return null;
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t border-[#EDEAE6] bg-white/95 backdrop-blur-md",
        variant === "sheet"
          ? "px-4 pb-3 pt-3"
          : "rounded-b-[24px] px-5 py-4",
      )}
    >
      {(onPrev || onNext) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!onPrev}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E8E4DF] px-3 py-2 text-xs font-semibold text-[#1B3B2E] disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          {remainingReview != null && remainingReview > 0 && (
            <p className="text-center text-[11px] font-medium text-[#8A8F8C]">
              {remainingReview} more to review
            </p>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E8E4DF] px-3 py-2 text-xs font-semibold text-[#1B3B2E] disabled:opacity-35"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={cn("flex gap-2", variant === "sheet" ? "flex-col" : "flex-row")}>
        {!isSigned ? (
          <button
            type="button"
            onClick={onSignOff}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl bg-[#1B3B2E] text-sm font-semibold text-white shadow-[0_4px_16px_rgba(27,59,46,0.2)]",
              variant === "sheet" ? "w-full py-3.5" : "flex-1 py-3.5",
            )}
          >
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            Sign off &amp; file in chart
          </button>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border border-[#E8EFE6] bg-[#E8EFE6]/40 text-sm font-semibold text-[#1B3B2E]",
              variant === "sheet" ? "w-full py-3.5" : "flex-1 py-3.5",
            )}
          >
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            Signed off &amp; filed
          </div>
        )}
        <Link
          to="/doctor/patients/$patientId"
          params={{ patientId: doc.patientId }}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8E4DF] bg-white text-sm font-semibold text-[#1B3B2E]",
            variant === "sheet" ? "w-full py-3" : "px-5 py-3.5",
          )}
        >
          {variant === "sheet" ? (
            <>
              <User className="h-4 w-4" strokeWidth={1.75} />
              Open patient chart
            </>
          ) : (
            <>
              <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
              Chart
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
