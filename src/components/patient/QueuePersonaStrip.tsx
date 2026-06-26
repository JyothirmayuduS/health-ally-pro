import { useMemo } from "react";
import { buildQueueTimeline } from "@/lib/patient-queue";
import { QueuePersonaIcon } from "@/components/patient/QueuePersonaIcon";
import { cn } from "@/lib/utils";

type StripProps = {
  position: number;
  total: number;
  className?: string;
};

export function QueuePersonaStrip({ position, total, className }: StripProps) {
  const nodes = useMemo(() => buildQueueTimeline(position, total), [position, total]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-end justify-between gap-1" role="list" aria-label="People in queue">
        {nodes.map((node) => (
          <div
            key={node.position}
            role="listitem"
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5"
          >
            <QueuePersonaIcon
                persona={node.persona}
                kind={node.kind}
                size="sm"
                surface="dark"
                plain={node.kind === "in-room" || node.kind === "completed"}
              />
            {node.kind === "you" ? (
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#D4957E]">
                You
              </span>
            ) : node.kind === "in-room" ? (
              <span className="text-[7px] font-semibold uppercase tracking-wide text-[#9BB89E]">
                Now
              </span>
            ) : (
              <span className="h-2.5" aria-hidden />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5" aria-hidden>
        {nodes.map((node) => (
          <div
            key={node.position}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              node.kind === "completed" && "bg-[#7A9B7E]/40",
              node.kind === "in-room" && "bg-[#7A9B7E]",
              node.kind === "you" && "h-1.5 bg-[#B8735D]",
              node.kind === "waiting" && "bg-white/10",
            )}
          />
        ))}
      </div>
    </div>
  );
}
