import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  alertTierBorderClass,
  alertTierDotClass,
  type AlertTier,
} from "@/lib/doctor-alert-tiers";
import {
  buildAuthoritativeWorkQueue,
  type WorkQueueItem,
} from "@/lib/doctor-authoritative-work-queue";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";
import { CLINICAL_EVENT_LOG_EVENT, subscribeClinicalEvents } from "@/lib/shared/clinical-event-log";
import { PATIENT_MEDS_EVENT } from "@/lib/patient-meds-store";
import { cn } from "@/lib/utils";

function WorkQueueRow({ item, compact }: { item: WorkQueueItem; compact?: boolean }) {
  const content = (
    <>
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", alertTierDotClass(item.tier))} />
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold text-[#1B3B2E]", compact ? "text-sm" : "text-sm")}>{item.title}</p>
        {item.subtitle && (
          <p className="mt-0.5 truncate text-xs text-[#8A8F8C]">{item.subtitle}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#C5D9C0]" strokeWidth={1.75} />
    </>
  );

  const className = cn(
    "flex min-h-[52px] items-start gap-3 px-4 py-3 transition-colors hover:bg-[#FAF9F7]",
    alertTierBorderClass(item.tier),
    compact ? "rounded-xl border" : "border-b border-[#F0EDE8] last:border-b-0",
  );

  if (item.params) {
    return (
      <Link to={item.to as "/doctor/patients/$patientId"} params={item.params} search={item.search} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <Link to={item.to} search={item.search} className={className}>
      {content}
    </Link>
  );
}

const TIER_LABEL: Record<AlertTier, string> = {
  critical: "Critical",
  urgent: "Urgent",
  warn: "Attention",
  info: "For review",
};

export function DoctorAuthoritativeWorkQueue({
  limit = 3,
  showHeader = true,
  className,
}: {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}) {
  const queueState = useLiveQueue();
  const [clinicalTick, setClinicalTick] = useState(0);

  useEffect(() => {
    const refresh = () => setClinicalTick((t) => t + 1);
    const unsub = subscribeClinicalEvents(refresh);
    window.addEventListener(PATIENT_MEDS_EVENT, refresh);
    window.addEventListener(CLINICAL_EVENT_LOG_EVENT, refresh);
    return () => {
      unsub();
      window.removeEventListener(PATIENT_MEDS_EVENT, refresh);
      window.removeEventListener(CLINICAL_EVENT_LOG_EVENT, refresh);
    };
  }, []);

  const items = useMemo(
    () => buildAuthoritativeWorkQueue(queueState),
    [queueState.entries, queueState.bookingRequests, queueState.accepting, queueState.room, clinicalTick],
  );

  const visible = items.slice(0, limit);
  const topTier = visible[0]?.tier;

  if (items.length === 0) {
    return (
      <section className={cn("rounded-2xl border border-[#E8E4DF] bg-white p-5 shadow-sm", className)}>
        {showHeader && (
          <h2 className="text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">WORK QUEUE</h2>
        )}
        <p className={cn("text-sm text-[#8A8F8C]", showHeader && "mt-2")}>All caught up — no pending clinical actions.</p>
      </section>
    );
  }

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white shadow-sm", className)}>
      {showHeader && (
        <div className="flex items-center justify-between border-b border-[#F0EDE8] px-4 py-3">
          <div>
            <h2 className="text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">WORK QUEUE</h2>
            {topTier && (topTier === "critical" || topTier === "urgent") && (
              <p className="mt-0.5 text-xs font-medium text-[#C45C4A]">{TIER_LABEL[topTier]} items need action</p>
            )}
          </div>
          {items.length > limit && (
            <Link to="/doctor/reports" className="text-xs font-semibold text-[#B8735D]">
              View all ({items.length})
            </Link>
          )}
        </div>
      )}
      <div className={limit <= 3 ? "divide-y divide-[#F0EDE8]" : "space-y-2 p-3"}>
        {visible.map((item) => (
          <WorkQueueRow key={item.id} item={item} compact={limit > 3} />
        ))}
      </div>
    </section>
  );
}
