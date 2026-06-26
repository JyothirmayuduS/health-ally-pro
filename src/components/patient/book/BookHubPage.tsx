import { Search, SlidersHorizontal } from "lucide-react";
import { Suspense, lazy, useMemo, useState } from "react";
import { DoctorListCard } from "@/components/patient/book/DoctorListCard";
import {
  BOOK_SPECIALTIES,
  DEFAULT_BOOK_FILTERS,
  activeFilterLabels,
  filterDoctors,
  filtersAreActive,
  type BookFilters,
} from "@/lib/book-utils";
import { doctors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const BookFiltersSheet = lazy(() =>
  import("@/components/patient/book/BookFiltersSheet").then((m) => ({
    default: m.BookFiltersSheet,
  })),
);

export function BookHubPage() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<string>("All");
  const [filters, setFilters] = useState<BookFilters>(DEFAULT_BOOK_FILTERS);
  const [draftFilters, setDraftFilters] = useState<BookFilters>(DEFAULT_BOOK_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(
    () => filterDoctors(doctors, query, specialty, filters),
    [query, specialty, filters],
  );

  const draftCount = useMemo(
    () => filterDoctors(doctors, query, specialty, draftFilters).length,
    [query, specialty, draftFilters],
  );

  const appliedFilterLabels = activeFilterLabels(filters);
  const hasActiveFilters = filtersAreActive(filters);

  return (
    <div className="w-full pb-8 lg:pb-0">
      <header className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
          Specialists
        </p>
        <h1 className="mt-1.5 font-serif text-[38px] leading-tight tracking-tight text-ink">
          Find a <span className="italic text-clay">doctor</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Book with 80+ board-certified physicians near you.
        </p>
      </header>

      <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3">
        <Search className="h-[18px] w-[18px] shrink-0 text-ink-muted" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, specialty or hospital…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setDraftFilters(filters);
            setFiltersOpen(true);
          }}
          className={cn(
            "relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-ink text-white",
            hasActiveFilters && "ring-2 ring-clay ring-offset-2 ring-offset-white",
          )}
          aria-label="Open filters"
        >
          <SlidersHorizontal className="h-[15px] w-[15px]" strokeWidth={1.75} />
          {hasActiveFilters ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[9px] font-bold text-white">
              {appliedFilterLabels.length}
            </span>
          ) : null}
        </button>
      </div>

      {appliedFilterLabels.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {appliedFilterLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-clay/25 bg-clay/10 px-3 py-1 text-[12px] font-medium text-ink"
            >
              {label}
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setFilters(DEFAULT_BOOK_FILTERS);
              setDraftFilters(DEFAULT_BOOK_FILTERS);
            }}
            className="text-[12px] font-semibold text-clay"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none lg:flex-wrap lg:overflow-visible">
        {BOOK_SPECIALTIES.map((sp) => (
          <button
            key={sp}
            type="button"
            onClick={() => setSpecialty(sp)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
              specialty === sp
                ? "border-ink bg-ink text-white"
                : "border-[#EDEAE6] bg-white text-ink-muted",
            )}
          >
            {sp}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-ink-muted">
        {filtered.length} doctor{filtered.length === 1 ? "" : "s"} available
      </p>

      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-2 lg:gap-5 xl:grid-cols-3">
        {filtered.map((d) => (
          <DoctorListCard key={d.id} doctor={d} />
        ))}
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-muted lg:col-span-full">
            No doctors match your search.
          </p>
        ) : null}
      </div>

      {filtersOpen ? (
        <Suspense fallback={null}>
          <BookFiltersSheet
            open={filtersOpen}
            filters={draftFilters}
            resultCount={draftCount}
            onClose={() => setFiltersOpen(false)}
            onChange={setDraftFilters}
            onApply={() => {
              setFilters(draftFilters);
              setFiltersOpen(false);
            }}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
