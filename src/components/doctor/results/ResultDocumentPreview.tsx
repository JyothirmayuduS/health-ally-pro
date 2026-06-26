import { useState } from "react";
import { FileText, Maximize2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResultDocument } from "@/lib/doctor-results-imaging";
import { cn } from "@/lib/utils";

function PreviewMock({ doc, expanded }: { doc: ResultDocument; expanded?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E8E4DF] bg-gradient-to-b from-[#FAFAF8] to-white text-left",
        expanded ? "min-h-[70dvh] p-8" : "px-5 py-10",
      )}
    >
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#EDEAE6] pb-3">
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">{doc.source}</p>
          <p className="text-[10px] text-[#ADADAD]">{doc.fileFormat}</p>
        </div>
        <p className="font-serif text-lg font-semibold text-[#1B3B2E]">{doc.title}</p>
        <p className="text-sm text-[#8A8F8C]">{doc.description}</p>
        {doc.analytes && doc.analytes.length > 0 && (
          <div className="space-y-2 rounded-xl border border-[#EDEAE6] bg-white p-3">
            {doc.analytes.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <span className="text-[#1B3B2E]">{a.name}</span>
                <span className="font-semibold tabular-nums text-[#1B3B2E]">{a.value}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-[#ADADAD]">
          Page 1 of {doc.pageCount} · {doc.payloadSize}
        </p>
      </div>
    </div>
  );
}

export function ResultDocumentPreview({
  doc,
  compact,
  locked,
}: {
  doc: ResultDocument;
  compact?: boolean;
  locked?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (locked) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">SOURCE DOCUMENT</p>
          <span className="text-xs text-[#8A8F8C]">
            {doc.pageCount} page{doc.pageCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#E8E4DF] bg-[#FAFAF8] px-6 py-14 text-center">
          <FileText className="mx-auto h-10 w-10 text-[#C4C0BA]" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-[#8A8F8C]">Preview unavailable</p>
          <p className="mt-1 text-xs text-[#ADADAD]">Accept into chart to view this document</p>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#ADADAD]">
          <FileText className="h-3 w-3" strokeWidth={1.75} />
          {doc.fileFormat} · {doc.payloadSize}
        </p>
      </section>
    );
  }

  return (
    <>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-[0.12em] text-[#8A8F8C]">SOURCE DOCUMENT</p>
          <span className="text-xs text-[#8A8F8C]">
            {doc.pageCount} page{doc.pageCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="relative">
          <PreviewMock doc={doc} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAFAF8] to-transparent" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              "absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-[#1B3B2E] px-3 py-2 text-xs font-semibold text-white shadow-md",
              compact && "bottom-2 right-2",
            )}
            aria-label="Expand document preview"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Expand
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#ADADAD]">
          <FileText className="h-3 w-3" strokeWidth={1.75} />
          {doc.fileFormat} · {doc.payloadSize}
        </p>
      </section>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto border-[#EDEAE6] p-0">
          <DialogHeader className="sticky top-0 z-10 border-b border-[#EDEAE6] bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="font-serif text-lg text-[#1B3B2E]">{doc.title}</DialogTitle>
                <p className="mt-0.5 text-xs text-[#8A8F8C]">{doc.source}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#E8E4DF] text-[#8A8F8C]"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          <div className="p-5">
            <PreviewMock doc={doc} expanded />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
