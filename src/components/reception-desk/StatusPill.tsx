const MAP: Record<
  string,
  { label: string; cls: string }
> = {
  scheduled: {
    label: "Scheduled",
    cls: "bg-white text-ink-600 border-ink-200",
  },
  "checked-in": {
    label: "Checked-in",
    cls: "bg-status-waitBg text-status-waitText border-status-waitBorder",
  },
  "in-progress": {
    label: "In consult",
    cls: "bg-status-consultBg text-status-consultText border-status-consultBorder",
  },
  completed: {
    label: "Completed",
    cls: "bg-status-doneBg text-status-doneText border-status-doneBorder",
  },
  "no-show": {
    label: "No-show",
    cls: "bg-status-noshowBg text-status-noshowText border-status-noshowBorder",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-ink-200/50 text-ink-600 border-ink-200",
  },
};

export function StatusPill({
  status,
  "data-testid": testId,
}: {
  status: string;
  "data-testid"?: string;
}) {
  const meta = MAP[status] || MAP.scheduled;
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${meta.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

export default StatusPill;
