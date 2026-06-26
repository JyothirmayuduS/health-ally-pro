import { useState } from "react";
import { ChevronRight, FileText, FlaskConical, ScanLine, Upload } from "lucide-react";
import {
  filterPatientDocuments,
  getDocumentFilterCounts,
  type DocumentFilterTab,
  type HistoryDocumentEntry,
  type HistoryTimelineEntry,
} from "@/lib/doctor-patients-apk-data";
import { cn } from "@/lib/utils";

export type HistoryPanelTab = "visits" | "rx" | "documents" | "vitals";

export function HistoryMonthDivider({ month }: { month: string }) {
  return (
    <p className="text-center text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">{month}</p>
  );
}

export function HistoryTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: T; label: string; count: number }[];
  activeTab: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[#F5F2ED] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-colors",
              isActive
                ? "bg-white font-semibold text-[#1B3B2E] shadow-[0_1px_4px_rgba(27,59,46,0.06)]"
                : "font-medium text-[#8A8F8C]",
            )}
          >
            {isActive ? (
              <>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#F0EDE8] px-1 text-[10px] font-semibold leading-none text-[#8A8F8C]">
                    {tab.count}
                  </span>
                )}
              </>
            ) : (
              <span>
                {tab.label}
                {tab.count > 0 ? ` ${tab.count}` : ""}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function HistoryTimelineCard({
  entry,
  onClick,
}: {
  entry: HistoryTimelineEntry;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="w-11 shrink-0 text-center">
        <p className="text-[1.35rem] font-bold leading-none text-[#1B3B2E]">{entry.day}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#8A8F8C]">{entry.monthShort}</p>
      </div>
      <div className="h-11 w-px shrink-0 bg-[#E8E4DF]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[#1B3B2E]">{entry.title}</p>
        <p className="mt-0.5 text-xs text-[#8A8F8C]">{entry.meta}</p>
        {entry.note && <p className="mt-1 text-xs font-medium text-[#8A8F8C]">{entry.note}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#D4D0CB]" strokeWidth={1.75} />
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3.5 text-left";

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function renderHistoryEntries<T extends HistoryTimelineEntry>(
  entries: T[],
  onEntryClick: (entry: T) => void,
) {
  return entries.map((entry, index) => {
    const showMonth = index === 0 || entries[index - 1]!.month !== entry.month;
    return (
      <div key={entry.id} className="space-y-3">
        {showMonth && <HistoryMonthDivider month={entry.month} />}
        <HistoryTimelineCard entry={entry} onClick={() => onEntryClick(entry)} />
      </div>
    );
  });
}

const DOCUMENT_ICON_STYLES: Record<
  HistoryDocumentEntry["icon"],
  { bg: string; Icon: typeof FileText }
> = {
  document: { bg: "bg-[#E8EFE6]", Icon: FileText },
  imaging: { bg: "bg-[#F5E6B8]", Icon: ScanLine },
  lab: { bg: "bg-[#F0DDD6]", Icon: FlaskConical },
};

function DocumentFilterBar({
  counts,
  activeFilter,
  onChange,
}: {
  counts: ReturnType<typeof getDocumentFilterCounts>;
  activeFilter: DocumentFilterTab;
  onChange: (filter: DocumentFilterTab) => void;
}) {
  const chips: { id: DocumentFilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "lab", label: "Lab", count: counts.lab },
    { id: "imaging", label: "Imaging", count: counts.imaging },
    { id: "shared", label: "Shared", count: counts.shared },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isActive = activeFilter === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "bg-[#E8EFE6] font-semibold text-[#1B3B2E]" : "text-[#8A8F8C]",
            )}
          >
            {chip.label}
            {chip.count > 0 ? ` ${chip.count}` : ""}
          </button>
        );
      })}
    </div>
  );
}

function HistoryDocumentCard({
  doc,
  patientName,
  onClick,
}: {
  doc: HistoryDocumentEntry;
  patientName: string;
  onClick: () => void;
}) {
  const { bg, Icon } = DOCUMENT_ICON_STYLES[doc.icon];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3.5 text-left"
    >
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", bg)}>
        <Icon className="h-[18px] w-[18px] text-[#1B3B2E]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[#1B3B2E]">{doc.title}</p>
        <p className="mt-0.5 text-xs text-[#8A8F8C]">{patientName}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#D4D0CB]" strokeWidth={1.75} />
    </button>
  );
}

export function HistoryDocumentsPanel({
  patientId,
  patientName,
  onOpenDocument,
  onUpload,
  searchQuery = "",
}: {
  patientId: string;
  patientName: string;
  onOpenDocument: (id: string) => void;
  onUpload?: () => void;
  searchQuery?: string;
}) {
  const [documentFilter, setDocumentFilter] = useState<DocumentFilterTab>("all");
  const counts = getDocumentFilterCounts(patientId);
  const query = searchQuery.trim().toLowerCase();
  const documents = filterPatientDocuments(patientId, documentFilter).filter(
    (doc) =>
      !query ||
      [doc.title, doc.meta, patientName].join(" ").toLowerCase().includes(query),
  );

  return (
    <div className="space-y-3">
      <DocumentFilterBar counts={counts} activeFilter={documentFilter} onChange={setDocumentFilter} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8735D]"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Upload document
        </button>
      </div>

      <div className="space-y-2.5">
        {documents.map((doc, index) => {
          const showMonth = index === 0 || documents[index - 1]!.month !== doc.month;
          return (
            <div key={doc.id} className="space-y-2.5">
              {showMonth && (
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">{doc.month}</p>
              )}
              <HistoryDocumentCard
                doc={doc}
                patientName={patientName}
                onClick={() => onOpenDocument(doc.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
