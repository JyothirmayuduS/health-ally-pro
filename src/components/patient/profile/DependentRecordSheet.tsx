import { X } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { usePatientSheetA11y } from "@/hooks/usePatientSheetA11y";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
  onClose: () => void;
};

export function DependentRecordSheet({
  open,
  title,
  subtitle,
  rows,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  usePatientSheetA11y({
    open,
    onClose,
    panelRef,
    titleId: "dependent-record-title",
  });

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
        aria-label="Close"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dependent-record-title"
        className="relative z-10 flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F9F7F2] shadow-2xl lg:max-h-[min(560px,90dvh)] lg:max-w-md lg:rounded-[28px]"
      >
        <div className="flex shrink-0 justify-center pt-3 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-[#D8D4CE]" aria-hidden />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4 pt-2 lg:px-6 lg:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id="dependent-record-title" className="font-serif text-[22px] leading-tight text-ink">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
            ) : null}
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-6 lg:pb-6">
          <div className="overflow-hidden rounded-2xl border border-[#EDEAE6] bg-white">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={i > 0 ? "border-t border-[#EDEAE6] px-4 py-3.5 sm:px-5" : "px-4 py-3.5 sm:px-5"}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                  {row.label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-ink">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
