import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Beaker,
  ChevronDown,
  FileText,
  ScanLine,
  Search,
  User,
} from "lucide-react";
import {
  type ResultDocument,
  type ResultFilterTab,
  type ResultSort,
  RESULT_SORT_LABELS,
  getResultPatientName,
  getResultSeverity,
  isPatientUploadGated,
  isResultOpened,
} from "@/lib/doctor-results-imaging";
import { cn } from "@/lib/utils";

const ICONS = {
  lab: Beaker,
  document: FileText,
  imaging: ScanLine,
  patient: User,
} as const;

const CHANNEL_LABEL: Record<string, { label: string; Icon: typeof Beaker }> = {
  Lab: { label: "Lab", Icon: Beaker },
  "Patient shared": { label: "Patient shared", Icon: User },
  Imaging: { label: "Imaging", Icon: ScanLine },
  Clinical: { label: "Clinical", Icon: FileText },
};

const SEVERITY_CHIP = {
  critical: "bg-[#FCE8E6] text-[#C45C4A]",
  high: "bg-[#F5E6B8] text-[#5C4A1E]",
  borderline: "bg-[#EDEAE6] text-[#6B6B6B]",
} as const;

function DocumentCard({
  doc,
  selected,
  onSelect,
  compact,
  showUnread,
}: {
  doc: ResultDocument;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
  showUnread?: boolean;
}) {
  const Icon = ICONS[doc.iconKind];
  const channel = CHANNEL_LABEL[doc.channel] ?? CHANNEL_LABEL.Clinical;
  const ChannelIcon = channel.Icon;
  const patient = getResultPatientName(doc.patientId);
  const severity = getResultSeverity(doc);
  const unread = showUnread && doc.needsReview && !isResultOpened(doc.id);

  const stripBg =
    doc.iconKind === "lab"
      ? "#F9EBE7"
      : doc.iconKind === "patient"
        ? "#E8F5E9"
        : doc.iconKind === "imaging"
          ? "#EDEAE6"
          : "#F5F2ED";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative flex w-full items-stretch overflow-hidden rounded-2xl border bg-white text-left transition-all",
        selected
          ? "border-[#B8735D]/45 shadow-[0_2px_16px_rgba(27,59,46,0.08)]"
          : "border-[#EBE7E2] shadow-[0_1px_8px_rgba(27,59,46,0.04)] active:scale-[0.995]",
        unread && !selected && "ring-1 ring-[#B8735D]/15",
      )}
    >
      <div
        className="flex w-[52px] shrink-0 self-stretch items-center justify-center sm:w-[56px]"
        style={{ backgroundColor: stripBg }}
      >
        <Icon className="h-5 w-5 text-[#1B3B2E]" strokeWidth={1.6} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={cn("relative", compact ? "px-3.5 py-3.5" : "px-4 py-4")}>
          <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
            {unread && (
              <span className="h-2 w-2 rounded-full bg-[#B8735D]" aria-label="Unread" />
            )}
            {doc.needsReview && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#F5E6B8]">
                <AlertCircle className="h-3 w-3 text-[#D4A017]" strokeWidth={2.25} />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pr-12">
            <p className="text-[15px] font-bold leading-snug tracking-[-0.01em] text-[#1B3B2E]">
              {doc.title}
            </p>
            {severity && !isPatientUploadGated(doc) && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                  SEVERITY_CHIP[severity],
                )}
              >
                {severity}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[14px] font-bold text-[#1B3B2E]">{patient}</p>
          <p className="mt-2 text-[13px] leading-[1.45] text-[#8A8F8C]">
            {isPatientUploadGated(doc)
              ? "Patient upload — accept to view contents"
              : doc.description}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-[#1B3B2E]"
              style={{ backgroundColor: stripBg }}
            >
              <ChannelIcon className="h-3 w-3" strokeWidth={1.75} />
              {channel.label}
            </span>
            <span className="text-[11px] text-[#B5B5B5]">{doc.relativeTime}</span>
          </div>
        </div>

        {doc.footerNote && (
          <div className="mt-auto border-t border-[#F0ECE8] px-4 py-2.5">
            <p className="text-[12px] leading-snug text-[#9A9A9A]">{doc.footerNote}</p>
          </div>
        )}
      </div>
    </button>
  );
}

function ReviewSection({
  documents,
  selectedId,
  onSelect,
  compact,
  openedVersion,
}: {
  documents: ResultDocument[];
  selectedId?: string;
  onSelect: (id: string) => void;
  compact?: boolean;
  openedVersion?: number;
}) {
  void openedVersion;
  if (documents.length === 0) return null;

  return (
    <section>
      <div className="mb-2.5">
        <p className="text-[11px] font-bold tracking-[0.12em] text-[#8A8F8C]">NEEDS REVIEW</p>
        <p className="text-xs text-[#ADADAD]">Abnormal, processing, or awaiting sign-off</p>
      </div>
      <div className="space-y-3.5">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            selected={selectedId === doc.id}
            onSelect={() => onSelect(doc.id)}
            compact={compact}
            showUnread
          />
        ))}
      </div>
    </section>
  );
}

export function ResultsImagingList({
  reviewDocuments,
  otherDocuments,
  selectedId,
  filterTab,
  onFilterTab,
  filterCounts,
  sort,
  sortLabel,
  onSort,
  onSortPick,
  search,
  onSearch,
  onSelect,
  compact,
  openedVersion,
  awaitingReview,
  totalReview,
}: {
  reviewDocuments: ResultDocument[];
  otherDocuments: ResultDocument[];
  selectedId?: string;
  filterTab: ResultFilterTab;
  onFilterTab: (tab: ResultFilterTab) => void;
  filterCounts: { all: number; review: number; patientShared: number; imaging: number };
  sort: ResultSort;
  sortLabel: string;
  onSort: () => void;
  onSortPick?: (sort: ResultSort) => void;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (id: string) => void;
  compact?: boolean;
  openedVersion?: number;
  awaitingReview?: number;
  totalReview?: number;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const tabs: { id: ResultFilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: filterCounts.all },
    { id: "review", label: "Review", count: filterCounts.review },
    { id: "patient-shared", label: "Patient shared", count: filterCounts.patientShared },
    { id: "imaging", label: "Imaging", count: filterCounts.imaging },
  ];

  const totalCount = reviewDocuments.length + otherDocuments.length;
  const reviewDone =
    totalReview != null && awaitingReview != null && totalReview > 0
      ? totalReview - awaitingReview
      : 0;
  const reviewProgress =
    totalReview != null && totalReview > 0 ? Math.round((reviewDone / totalReview) * 100) : 0;

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [sortOpen]);

  return (
    <div className={cn("flex min-h-0 flex-col", compact ? "h-full" : "")}>
      {!compact && awaitingReview != null && awaitingReview > 0 && totalReview != null && (
        <div className="mb-3 rounded-2xl border border-[#E8EFE6] bg-[#E8EFE6]/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-[#1B3B2E]">
              {reviewDone} of {totalReview} reviewed today
            </span>
            <span className="text-xs font-medium text-[#B8735D]">{awaitingReview} left</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#7A9B7E] transition-all"
              style={{ width: `${reviewProgress}%` }}
            />
          </div>
        </div>
      )}
      <div className="space-y-3">
        <div
          className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter results"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filterTab === tab.id}
              onClick={() => onFilterTab(tab.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                filterTab === tab.id
                  ? "bg-[#1B3B2E] text-white"
                  : "border border-[#E8E4DF] bg-white text-[#8A8F8C] hover:text-[#1B3B2E]",
              )}
            >
              {tab.count} {tab.label}
            </button>
          ))}
        </div>

        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8A8F8C]"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search title, patient, facility..."
            className="h-11 w-full rounded-2xl border border-[#E8E4DF] bg-white pl-10 pr-4 text-sm text-[#1B3B2E] placeholder:text-[#ADADAD] outline-none focus:border-[#B8735D]/40"
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#8A8F8C]">
            {totalCount} in inbox
          </p>
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => (onSortPick ? setSortOpen((v) => !v) : onSort())}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E4DF] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#8A8F8C]"
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
            >
              <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
              {sortLabel}
              {onSortPick && <ChevronDown className="h-3 w-3 opacity-60" />}
            </button>
            {sortOpen && onSortPick && (
              <ul
                className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-[#E8E4DF] bg-white py-1 shadow-lg"
                role="listbox"
              >
                {(Object.keys(RESULT_SORT_LABELS) as ResultSort[]).map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={sort === key}
                      onClick={() => {
                        onSortPick(key);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-left text-xs font-medium",
                        sort === key ? "bg-[#F5F2ED] text-[#1B3B2E]" : "text-[#8A8F8C]",
                      )}
                    >
                      {RESULT_SORT_LABELS[key]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className={cn("mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto", compact && "pr-1")}>
        <ReviewSection
          documents={reviewDocuments}
          selectedId={selectedId}
          onSelect={onSelect}
          compact={compact}
          openedVersion={openedVersion}
        />

        {otherDocuments.length > 0 && (
          <section>
            {filterTab !== "review" && reviewDocuments.length > 0 && (
              <p className="mb-2.5 text-[11px] font-bold tracking-[0.12em] text-[#8A8F8C]">
                FILED &amp; REVIEWED
              </p>
            )}
            <div className="space-y-3.5">
              {otherDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  selected={selectedId === doc.id}
                  onSelect={() => onSelect(doc.id)}
                  compact={compact}
                />
              ))}
            </div>
          </section>
        )}

        {totalCount === 0 && (
          <div className="rounded-2xl border border-dashed border-[#E8E4DF] bg-white/60 px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#1B3B2E]">Inbox clear</p>
            <p className="mt-1 text-xs text-[#8A8F8C]">No documents match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
