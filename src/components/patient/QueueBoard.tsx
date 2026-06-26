import { useMemo } from "react";
import type { DoctorGender } from "@/lib/doctor-gender";
import {
  buildQueueTimeline,
  getPersonaDisplayLabel,
  getQueueBoardSummary,
  getYouRowSubtitle,
} from "@/lib/patient-queue";
import { QueueConsultationPair } from "@/components/patient/QueueConsultationPair";
import { QueuePersonaIcon } from "@/components/patient/QueuePersonaIcon";
import { cn } from "@/lib/utils";

type Props = {
  position: number;
  total: number;
  doctorName: string;
  doctorGender: DoctorGender;
  estimatedWait?: number;
};

const STATUS: Record<
  ReturnType<typeof buildQueueTimeline>[number]["kind"],
  { label: string; className: string }
> = {
  completed: { label: "Done", className: "bg-[#F0EDE8] text-ink-muted" },
  "in-room": { label: "In room", className: "bg-emerald-100 text-emerald-800" },
  you: { label: "Your spot", className: "bg-[#B8735D]/15 text-[#8B4F3A]" },
  waiting: { label: "Waiting", className: "bg-[#F0EDE8] text-ink-muted" },
};

export function QueueBoard({
  position,
  total,
  doctorName,
  doctorGender,
  estimatedWait,
}: Props) {
  const nodes = useMemo(() => buildQueueTimeline(position, total), [position, total]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-[#EDEAE6] px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Queue board</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{getQueueBoardSummary(position, total)}</p>
        </div>
        {estimatedWait != null ? (
          <span className="shrink-0 rounded-full bg-[#F9F7F2] px-2.5 py-1 text-xs font-medium tabular-nums text-ink">
            ~{estimatedWait} min
          </span>
        ) : null}
      </header>

      <ol className="divide-y divide-[#EDEAE6]">
        {nodes.map((node) => (
          <TimelineRow
            key={node.position}
            node={node}
            doctorName={doctorName}
            doctorGender={doctorGender}
            youSubtitle={node.kind === "you" ? getYouRowSubtitle(position) : undefined}
          />
        ))}
      </ol>
    </section>
  );
}

function TimelineRow({
  node,
  doctorName,
  doctorGender,
  youSubtitle,
}: {
  node: ReturnType<typeof buildQueueTimeline>[number];
  doctorName: string;
  doctorGender: DoctorGender;
  youSubtitle?: string;
}) {
  const { kind, position, persona } = node;
  const isYou = kind === "you";
  const inRoom = kind === "in-room";
  const done = kind === "completed";
  const badge = STATUS[kind];

  const title = isYou ? "You" : getPersonaDisplayLabel(persona);
  const subtitle = isYou
    ? youSubtitle
    : inRoom
      ? doctorName
      : done
        ? "Already seen today"
        : "Waiting in line";

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-3 sm:px-4",
        isYou && "bg-[#FBF6F3]",
        inRoom && "bg-emerald-50/70",
        done && "bg-[#FAFAF8]",
      )}
    >
      {inRoom ? (
        <QueueConsultationPair patient={persona} doctorGender={doctorGender} />
      ) : (
        <QueuePersonaIcon
          persona={persona}
          kind={kind}
          size="sm"
          surface="light"
          plain={done}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={cn(
              "text-sm font-semibold leading-tight",
              isYou ? "text-[#8B4F3A]" : done ? "text-ink-muted line-through decoration-ink-muted/40" : "text-ink",
            )}
          >
            {title}
          </p>
          <span className="text-[11px] font-medium tabular-nums text-ink-muted">
            #{String(position).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-ink-muted">
          {inRoom ? (
            <>
              <span className="font-medium text-emerald-800">In consultation</span>
              <span className="text-ink-muted"> · {subtitle}</span>
            </>
          ) : (
            subtitle
          )}
        </p>
      </div>
    </li>
  );
}
