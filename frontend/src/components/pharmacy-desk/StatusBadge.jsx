import React from "react";
import { STATUS_META, TONE_CLASSES } from "@/lib/pharmacy-desk/store";
import { classNames } from "@/lib/pharmacy-desk/utils";

export function StatusBadge({ status, dataTestId }) {
  const meta = STATUS_META[status] || { label: status, tone: "stone", dot: "bg-stone-400" };
  return (
    <span
      data-testid={dataTestId || `status-${status}`}
      className={classNames("pharm-pill", TONE_CLASSES[meta.tone])}
    >
      <span className={classNames("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (priority !== "urgent") return null;
  return (
    <span
      data-testid="priority-urgent"
      className="pharm-pill bg-rose-50 text-rose-700 border-rose-200 animate-pulse-soft"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> STAT
    </span>
  );
}
