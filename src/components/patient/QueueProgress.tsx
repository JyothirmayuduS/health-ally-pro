import { useMemo } from "react";
import { buildQueueTimelineSegments, getQueueProgressCaption } from "@/lib/patient-queue";
import { QueuePersonaStrip } from "@/components/patient/QueuePersonaStrip";
import { cn } from "@/lib/utils";

type Props = {
  position: number;
  total: number;
  doctorName: string;
  className?: string;
};

export function QueueProgress({ position, total, doctorName, className }: Props) {
  const caption = useMemo(
    () => getQueueProgressCaption(position, doctorName),
    [position, doctorName],
  );

  const segments = useMemo(
    () => buildQueueTimelineSegments(position, total),
    [position, total],
  );

  return (
    <div
      className={cn("space-y-2", className)}
      role="progressbar"
      aria-valuenow={position}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Queue position ${position} of ${total}`}
    >
      <QueuePersonaStrip position={position} total={total} />
      <p className="text-[11px] leading-snug text-white/55">{caption}</p>
      {segments.completed.length > 0 ? (
        <p className="text-[10px] text-white/40">
          {segments.completed.length} patient{segments.completed.length === 1 ? "" : "s"} already
          seen
        </p>
      ) : null}
    </div>
  );
}
