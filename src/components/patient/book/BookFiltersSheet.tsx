import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_BOOK_FILTERS,
  type BookFilters,
  type BookMaxFee,
  type BookMinRating,
  type BookSort,
} from "@/lib/book-utils";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  filters: BookFilters;
  resultCount: number;
  onClose: () => void;
  onChange: (filters: BookFilters) => void;
  onApply: () => void;
};

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </p>
      {children}
    </section>
  );
}

function PillRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function FilterPill({
  children,
  active,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "tan";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
        active && variant === "default" && "border-ink bg-ink text-white",
        active && variant === "tan" && "border-clay/30 bg-clay/15 text-ink",
        !active && "border-[#EDEAE6] bg-white text-ink-muted",
      )}
    >
      {children}
    </button>
  );
}

function AvailableTodayToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = "book-filter-available-today";

  return (
    <div className="rounded-2xl border border-[#EDEAE6] bg-white p-4">
      <div className="flex items-center gap-4">
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer select-none">
          <span className="block text-[15px] font-medium text-ink">Available today</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
            Only doctors with same-day openings
          </span>
        </label>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className={cn(
            "h-8 w-[52px] shrink-0 border-0 shadow-none transition-colors duration-200",
            "data-[state=unchecked]:bg-[#D4CFC8]",
            "data-[state=checked]:bg-ink",
            "[&>span]:h-7 [&>span]:w-7 [&>span]:bg-white [&>span]:shadow-[0_1px_4px_rgba(27,43,38,0.18)]",
            "[&>span]:transition-transform [&>span]:duration-200 [&>span]:ease-out",
            "[&>span]:data-[state=unchecked]:translate-x-0.5",
            "[&>span]:data-[state=checked]:translate-x-[22px]",
          )}
        />
      </div>
    </div>
  );
}

export function BookFiltersSheet({
  open,
  filters,
  resultCount,
  onClose,
  onChange,
  onApply,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const setFilter = (key: keyof BookFilters, value: BookFilters[keyof BookFilters]) => {
    onChange({ ...filters, [key]: value });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-filters-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close filters"
      />
      <div className="relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F9F7F2] shadow-2xl lg:max-h-[min(720px,90dvh)] lg:max-w-md lg:rounded-[28px]">
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 lg:px-6 lg:pb-6 lg:pt-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="book-filters-title" className="font-serif text-2xl text-ink">
              Filters
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-ink" />
            </button>
          </div>

          <FilterSection label="Sort by">
            <PillRow>
              {(
                [
                  ["top_rated", "Top rated"],
                  ["lowest_fee", "Lowest fee"],
                  ["experience", "Experience"],
                ] as const
              ).map(([id, label]) => (
                <FilterPill
                  key={id}
                  active={filters.sort === id}
                  onClick={() => setFilter("sort", id as BookSort)}
                >
                  {label}
                </FilterPill>
              ))}
            </PillRow>
          </FilterSection>

          <FilterSection label={`Minimum rating: ${filters.minRating || "0.0"}+`}>
            <PillRow>
              {([0, 4, 4.5, 4.8] as const).map((r) => (
                <FilterPill
                  key={r}
                  active={filters.minRating === r}
                  onClick={() => setFilter("minRating", r as BookMinRating)}
                  variant={r === 0 ? "tan" : "default"}
                >
                  {r === 0 ? "Any" : `${r}+`}
                </FilterPill>
              ))}
            </PillRow>
          </FilterSection>

          <FilterSection label="Max consultation fee">
            <PillRow>
              {([150, 250, 350, 500] as const).map((fee) => (
                <FilterPill
                  key={fee}
                  active={filters.maxFee === fee}
                  onClick={() => setFilter("maxFee", fee as BookMaxFee)}
                  variant={fee === 500 ? "tan" : "default"}
                >
                  ${fee}
                </FilterPill>
              ))}
            </PillRow>
          </FilterSection>

          <FilterSection label="Availability">
            <AvailableTodayToggle
              checked={filters.availableToday}
              onChange={(v) => setFilter("availableToday", v)}
            />
          </FilterSection>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_BOOK_FILTERS)}
              className="flex-1 rounded-2xl border border-[#EDEAE6] bg-white py-3.5 text-[15px] font-semibold text-ink"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-[2] rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-white"
            >
              Show {resultCount} doctor{resultCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
