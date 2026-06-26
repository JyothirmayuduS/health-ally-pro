import { Calendar, Check, Minus, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePatientSheetA11y } from "@/hooks/usePatientSheetA11y";
import { SHAREABLE_DOCTORS } from "@/lib/reports-utils";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  reportTitle: string;
  existingDoctorIds: string[];
  onClose: () => void;
  onGrant: (doctorIds: string[], expiresDays: number) => void;
};

export function ShareReportSheet({
  open,
  reportTitle,
  existingDoctorIds,
  onClose,
  onGrant,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [expiresDays, setExpiresDays] = useState(7);
  const panelRef = useRef<HTMLDivElement>(null);

  usePatientSheetA11y({
    open,
    onClose,
    panelRef,
    titleId: "share-report-title",
    initialFocusSelector: "input",
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected([]);
      setExpiresDays(7);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SHAREABLE_DOCTORS.filter((d) => {
      if (existingDoctorIds.includes(d.id)) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)
      );
    });
  }, [query, existingDoctorIds]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGrant = useCallback(() => {
    if (selected.length === 0) return;
    onGrant(selected, expiresDays);
    onClose();
  }, [selected, expiresDays, onGrant, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close share sheet"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-report-title"
        className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F9F7F2] shadow-2xl lg:max-h-[min(720px,90dvh)] lg:max-w-lg lg:rounded-[28px]"
      >
        <div className="flex shrink-0 justify-center pt-3 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-[#D8D4CE]" aria-hidden />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-2 lg:px-6 lg:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id="share-report-title" className="font-serif text-[26px] leading-tight text-ink">
              Share Report
            </h2>
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{reportTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ink/5"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-ink" />
          </button>
        </div>

        <div className="shrink-0 px-5 pb-4 lg:px-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or specialty…"
              className="w-full rounded-full border border-[#EDEAE6] bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-4 lg:px-6">
          {filtered.map((doc) => {
            const active = selected.includes(doc.id);
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-2xl border bg-white p-4 text-left transition-colors",
                    active ? "border-ink/30 ring-1 ring-ink/10" : "border-[#EDEAE6]",
                  )}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EDEAE6] font-medium text-ink">
                    {doc.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{doc.name}</p>
                    <p className="text-sm text-ink-muted">{doc.specialty}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      <span className="text-clay">★</span> {doc.rating} · {doc.hospital}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-[#C8C4BE] bg-white",
                    )}
                  >
                    {active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="py-10 text-center text-sm text-ink-muted">
              No doctors match your search.
            </li>
          ) : null}
        </ul>

        <div className="shrink-0 border-t border-[#EDEAE6] bg-[#F9F7F2] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-6">
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-[#EDEAE6] bg-white px-4 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Calendar className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                Access expires in
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                Revoke anytime from this screen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpiresDays((d) => Math.max(1, d - 1))}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#EDEAE6] bg-white"
                aria-label="Decrease days"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2.5rem] text-center font-semibold tabular-nums text-ink">
                {expiresDays}d
              </span>
              <button
                type="button"
                onClick={() => setExpiresDays((d) => Math.min(30, d + 1))}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#EDEAE6] bg-white"
                aria-label="Increase days"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={selected.length === 0}
            onClick={handleGrant}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-35"
          >
            <Check className="h-4 w-4" />
            Grant access to {selected.length} doctor{selected.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
