import { useEffect, useState } from "react";
import { ChevronRight, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDoctorMobileOverlay } from "@/lib/doctor-mobile-chrome";
import {
  getChartMedication,
  getHistoryDocument,
  getHistoryVital,
  getHistoryVisit,
  getOpenItem,
  getPatientProblems,
  getPatientTherapy,
  type ChartMedication,
  type ChartTherapy,
  type HistoryDocumentEntry,
  type HistoryVitalEntry,
  type HistoryVisitEntry,
} from "@/lib/doctor-patients-apk-data";
import { cn } from "@/lib/utils";

export type ChartSheetDetail =
  | { type: "medication"; id: string }
  | { type: "visit"; id: string }
  | { type: "document"; id: string }
  | { type: "vital"; id: string }
  | { type: "therapy" }
  | { type: "problems" }
  | { type: "open-item"; id: string };

type ChartDetailSheetProps = {
  detail: ChartSheetDetail | null;
  patientId: string;
  patientName: string;
  onClose: () => void;
  onOpenMedication?: (id: string) => void;
  onOpenDocument?: (id: string) => void;
};

function parseMetaFields(meta: string) {
  return meta.split("·").map((part) => part.trim()).filter(Boolean);
}

function DetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-[#8A8F8C]">{title}</p>
      <div className="flex gap-3 rounded-[14px] border border-[#EDEAE6] bg-white p-4">
        <div className="w-1 shrink-0 rounded-full bg-[#B8735D]" />
        <p className="text-sm leading-relaxed text-[#1B3B2E]">{body}</p>
      </div>
    </div>
  );
}

function SpecRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[10px] font-semibold tracking-[0.08em] text-[#8A8F8C]">{label}</span>
      <span className={cn("text-sm font-medium", accent ? "text-[#B8735D]" : "text-[#1B3B2E]")}>{value}</span>
    </div>
  );
}

function MedicationSheet({
  med,
  patientName,
}: {
  med: ChartMedication;
  patientName: string;
}) {
  const blocks = [
    { title: "CONDITION TREATED", body: `${med.condition} · ${med.icd}` },
    { title: "WHY THIS WAS PRESCRIBED", body: med.whyPrescribed },
    ...(med.clinicalNotes ? [{ title: "CLINICAL NOTES", body: med.clinicalNotes }] : []),
    ...(med.patientInstructions ? [{ title: "PATIENT INSTRUCTIONS", body: med.patientInstructions }] : []),
    ...(med.monitoring ? [{ title: "MONITORING", body: med.monitoring }] : []),
    ...(med.interactions ? [{ title: "DRUG INTERACTIONS", body: med.interactions }] : []),
  ];

  const specs = [
    ["STRENGTH", med.strength, true],
    ["FREQUENCY", med.frequency, false],
    ["ROUTE", med.route, false],
    ["DURATION", med.duration, false],
    ...(med.prescribedBy ? [["PRESCRIBED BY", `${med.prescribedBy}${med.prescribedOn ? ` · ${med.prescribedOn}` : ""}`, false]] : []),
    ...(med.pharmacy ? [["PHARMACY", med.pharmacy, false]] : []),
    ...(med.lastFilled ? [["LAST FILLED", med.lastFilled, false]] : []),
    ...(med.refillsRemaining ? [["REFILLS", med.refillsRemaining, false]] : []),
  ] as const;

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        <div className="h-1 bg-[#B8735D]" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#B8735D]">ACTIVE MEDICATION</p>
            <span className="rounded-full bg-[#E8EFE6] px-2 py-0.5 text-[10px] font-semibold text-[#1B3B2E]">
              {med.status}
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[#1B3B2E]">{med.name}</p>
          <p className="text-sm text-[#8A8F8C]">{med.strength}</p>
          <p className="mt-3 text-xs text-[#8A8F8C]">{patientName}</p>
        </div>
      </article>

      <article className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        {specs.map(([label, value, accent]) => (
          <SpecRow key={label} label={label} value={value} accent={accent} />
        ))}
      </article>

      {blocks.map((block) => (
        <DetailBlock key={block.title} title={block.title} body={block.body} />
      ))}
    </div>
  );
}

function VisitSheet({ visit, patientName }: { visit: HistoryVisitEntry; patientName: string }) {
  const visitDate = `${visit.day} ${visit.monthShort} 2026`;
  const metaFields = parseMetaFields(visit.meta);

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        <div className="h-1 bg-[#1B3B2E]" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#1B3B2E]">VISIT SUMMARY</p>
            <span className="rounded-full bg-[#E8EFE6] px-2 py-0.5 text-[10px] font-semibold text-[#1B3B2E]">
              COMPLETED
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[#1B3B2E]">{visit.title}</p>
          <p className="text-sm text-[#8A8F8C]">{visit.meta}</p>
          <p className="mt-3 text-xs text-[#8A8F8C]">{patientName}</p>
          <p className="mt-1 text-xs font-medium text-[#8A8F8C]">{visitDate}</p>
        </div>
      </article>

      <article className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        {metaFields.map((field, index) => (
          <SpecRow
            key={field}
            label={index === 0 ? "MODE" : index === 1 ? "PROVIDER" : "DURATION"}
            value={field}
            accent={index === 0}
          />
        ))}
        {visit.note && <SpecRow label="KEY FINDING" value={visit.note} accent />}
      </article>

      {visit.detailSections?.map((section) => (
        <DetailBlock key={section.title} title={section.title} body={section.body} />
      ))}
    </div>
  );
}

const REPORT_ACCENT: Record<
  HistoryDocumentEntry["report"]["accent"],
  { bar: string; label: string }
> = {
  terracotta: { bar: "bg-[#B8735D]", label: "text-[#B8735D]" },
  forest: { bar: "bg-[#1B3B2E]", label: "text-[#1B3B2E]" },
  amber: { bar: "bg-[#E9A820]", label: "text-[#B8735D]" },
};

function DocumentSheet({
  doc,
  patientName,
}: {
  doc: HistoryDocumentEntry;
  patientName: string;
}) {
  const { report } = doc;
  const accent = REPORT_ACCENT[report.accent];
  const reportDate = `${doc.day} ${doc.monthShort} 2026`;

  const handleDownload = () => {
    toast.success(`Downloading ${doc.title}`, { description: "PDF saved to device (demo)" });
  };

  const handleShare = () => {
    toast.success(`Shared ${doc.title}`, { description: `Sent to care team for ${patientName}` });
  };

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        <div className={cn("h-1", accent.bar)} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-[10px] font-semibold tracking-[0.1em]", accent.label)}>
              {report.headerLabel}
            </p>
            <span className="rounded-full bg-[#E8EFE6] px-2 py-0.5 text-[10px] font-semibold text-[#1B3B2E]">
              {report.status}
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[#1B3B2E]">{doc.title}</p>
          <p className="text-sm text-[#8A8F8C]">{doc.meta}</p>
          <p className="mt-3 text-xs text-[#8A8F8C]">{patientName}</p>
          <p className="mt-1 text-xs font-medium text-[#8A8F8C]">{reportDate}</p>
        </div>
      </article>

      <article className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        {report.reportFields.map((field) => (
          <SpecRow
            key={field.label}
            label={field.label}
            value={field.value}
            accent={field.accent}
          />
        ))}
      </article>

      {report.findings && report.findings.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-[#8A8F8C]">KEY FINDINGS</p>
          <article className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
            {report.findings.map((finding) => (
              <SpecRow
                key={finding.label}
                label={finding.label}
                value={finding.value}
                accent={finding.accent}
              />
            ))}
          </article>
        </div>
      )}

      {report.sections.map((section) => (
        <DetailBlock key={section.title} title={section.title} body={section.body} />
      ))}

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] bg-white py-3 text-sm font-semibold text-[#1B3B2E]"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
          Download
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3B2E] py-3 text-sm font-semibold text-white"
        >
          <Share2 className="h-4 w-4" strokeWidth={1.75} />
          Share
        </button>
      </div>
    </div>
  );
}

function VitalSheet({ vital, patientName }: { vital: HistoryVitalEntry; patientName: string }) {
  const vitalDate = `${vital.day} ${vital.monthShort} 2026`;

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        <div className="h-1 bg-[#1B3B2E]" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#1B3B2E]">VITALS RECORD</p>
            <span className="rounded-full bg-[#E8EFE6] px-2 py-0.5 text-[10px] font-semibold text-[#1B3B2E]">
              RECORDED
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold text-[#1B3B2E]">{vital.title}</p>
          <p className="text-sm text-[#8A8F8C]">{vital.meta}</p>
          <p className="mt-3 text-xs text-[#8A8F8C]">{patientName}</p>
          <p className="mt-1 text-xs font-medium text-[#8A8F8C]">{vitalDate}</p>
        </div>
      </article>

      <article className="divide-y divide-[#F0EDE8] overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        {vital.readings.map((reading, index) => (
          <SpecRow
            key={reading.label}
            label={reading.label}
            value={reading.value}
            accent={index === 0}
          />
        ))}
      </article>

      {vital.detailSections?.map((section) => (
        <DetailBlock key={section.title} title={section.title} body={section.body} />
      ))}
    </div>
  );
}

function TherapySheet({
  therapy,
  onOpenMedication,
}: {
  therapy: ChartTherapy;
  onOpenMedication?: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white p-4">
        <div className="h-1 w-full rounded-full bg-[#B8735D]" />
        <p className="mt-3 text-[10px] font-semibold tracking-[0.1em] text-[#B8735D]">CURRENT THERAPY</p>
        {therapy.lines.map((line) => (
          <p key={line} className="mt-2 text-sm font-medium text-[#1B3B2E]">
            {line}
          </p>
        ))}
        <p className="mt-4 text-sm leading-relaxed text-[#8A8F8C]">{therapy.detail}</p>
      </article>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-[#8A8F8C]">ON CHART</p>
        {therapy.medicationIds.map((id) => {
          const med = getChartMedication(id);
          if (!med) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpenMedication?.(id)}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#EDEAE6] bg-white p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1B3B2E]">{med.name}</p>
                <p className="text-xs text-[#8A8F8C]">
                  {med.strength} · {med.frequency}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#D4D0CB]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProblemsSheet({ patientId }: { patientId: string }) {
  const problems = getPatientProblems(patientId);
  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white p-4">
        <div className="h-1 w-full rounded-full bg-[#1B3B2E]" />
        <p className="mt-3 text-[10px] font-semibold tracking-[0.1em] text-[#1B3B2E]">PROBLEM LIST</p>
        <p className="mt-2 text-sm text-[#8A8F8C]">Active diagnoses on chart for this patient.</p>
      </article>
      {problems.map((problem) => (
        <article key={problem.id} className="rounded-[14px] border border-[#EDEAE6] bg-white p-4">
          <p className="text-sm font-semibold text-[#1B3B2E]">
            {problem.label} · {problem.icd}
          </p>
          <p className="mt-1 text-xs font-medium text-[#B8735D]">{problem.status}</p>
          <p className="mt-2 text-xs text-[#8A8F8C]">Since {problem.since}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#1B3B2E]">{problem.notes}</p>
        </article>
      ))}
    </div>
  );
}

function OpenItemSheet({
  id,
  onOpenDocument,
}: {
  id: string;
  onOpenDocument?: (documentId: string) => void;
}) {
  const item = getOpenItem(id);
  if (!item) return null;
  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[18px] border border-[#EDEAE6] bg-white">
        <div className="h-1 bg-[#B8735D]" />
        <div className="p-4">
          <p className="text-[10px] font-semibold tracking-[0.08em] text-[#B8735D]">{item.kind}</p>
          <p className="mt-2 text-lg font-semibold text-[#1B3B2E]">{item.detailTitle}</p>
          {item.detailMeta && <p className="mt-1 text-xs text-[#8A8F8C]">{item.detailMeta}</p>}
        </div>
      </article>
      <DetailBlock title="DETAILS" body={item.detailBody} />
      {item.documentId && onOpenDocument && (
        <button
          type="button"
          onClick={() => onOpenDocument(item.documentId!)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3B2E] py-3 text-sm font-semibold text-white"
        >
          View full report
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export function ChartDetailSheet({
  detail,
  patientId,
  patientName,
  onClose,
  onOpenMedication,
  onOpenDocument,
}: ChartDetailSheetProps) {
  const [expanded, setExpanded] = useState(false);

  useDoctorMobileOverlay(!!detail);

  useEffect(() => {
    setExpanded(false);
  }, [detail]);

  const content = (() => {
    if (!detail) return null;
    switch (detail.type) {
      case "medication": {
        const med = getChartMedication(detail.id);
        return med ? <MedicationSheet med={med} patientName={patientName} /> : null;
      }
      case "visit": {
        const visit = getHistoryVisit(detail.id);
        return visit ? <VisitSheet visit={visit} patientName={patientName} /> : null;
      }
      case "document": {
        const doc = getHistoryDocument(detail.id);
        return doc ? <DocumentSheet doc={doc} patientName={patientName} /> : null;
      }
      case "vital": {
        const vital = getHistoryVital(detail.id);
        return vital ? <VitalSheet vital={vital} patientName={patientName} /> : null;
      }
      case "therapy": {
        const therapy = getPatientTherapy(patientId);
        return therapy ? <TherapySheet therapy={therapy} onOpenMedication={onOpenMedication} /> : null;
      }
      case "problems":
        return <ProblemsSheet patientId={patientId} />;
      case "open-item":
        return <OpenItemSheet id={detail.id} onOpenDocument={onOpenDocument} />;
      default:
        return null;
    }
  })();

  return (
    <Sheet open={!!detail} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className={cn(
          "z-[70] flex flex-col gap-0 rounded-t-[28px] border-[#E8E4DF] bg-[#F7F5F2] px-0 pb-0 pt-[max(0.75rem,env(safe-area-inset-top))] transition-[height] duration-300 ease-out [&>button]:hidden",
          expanded ? "h-[92dvh]" : "h-[58dvh]",
        )}
      >
        <button
          type="button"
          aria-label="Expand detail sheet"
          onClick={() => setExpanded((value) => !value)}
          className="mx-auto mb-3 flex w-full flex-col items-center gap-1 py-1"
        >
          <span className="h-1 w-10 rounded-full bg-[#E8E4DF]" />
          <span className="text-[10px] font-medium text-[#8A8F8C]">
            {expanded ? "Swipe down or tap to collapse" : "Scroll or tap for more details"}
          </span>
        </button>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]"
          onScroll={(event) => {
            if (event.currentTarget.scrollTop > 8) setExpanded(true);
          }}
        >
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
