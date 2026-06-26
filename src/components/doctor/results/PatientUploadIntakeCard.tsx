import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PatientUploadIntakeCard({
  onAccept,
  onDecline,
  compact,
}: {
  onAccept: () => void;
  onDecline: () => void;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#F5E6B8] bg-[#FFFBF0] p-4",
        compact && "p-3.5",
      )}
    >
      <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">
        PATIENT UPLOAD — SIGN-OFF REQUIRED
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#1B3B2E]">
        Review the source document and accept into the legal chart record before viewing
        clinical details, impressions, or signing off.
      </p>
      <div className={cn("mt-4 flex flex-col gap-2", !compact && "sm:flex-row")}>
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B3B2E] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(27,59,46,0.18)]"
        >
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          Accept into chart
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E8B4B4] bg-white px-4 py-3.5 text-sm font-semibold text-[#C45C4A]"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
          Decline
        </button>
      </div>
    </section>
  );
}

export function PatientUploadDeclinedCard() {
  return (
    <section className="rounded-2xl border border-[#FCE8E6] bg-[#FEF6F5] p-4">
      <p className="text-[10px] font-bold tracking-[0.12em] text-[#C45C4A]">DECLINED</p>
      <p className="mt-2 text-sm leading-relaxed text-[#1B3B2E]">
        This patient upload was declined and was not filed in the chart. The patient can be
        notified to resubmit or share via another channel.
      </p>
    </section>
  );
}
