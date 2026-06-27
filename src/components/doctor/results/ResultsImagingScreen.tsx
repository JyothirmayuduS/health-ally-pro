import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ResultsImagingList } from "./ResultsImagingList";
import { ResultDetailEmpty, ResultDetailPanel } from "./ResultDetailPanel";
import { ResultDetailMobileSheet } from "./ResultDetailMobileSheet";
import { ResultStickyActionBar } from "./ResultStickyActionBar";
import {
  RESULTS_IMAGING_EVENT,
  RESULT_SORT_LABELS,
  acceptPatientUpload,
  awaitingSignOffCount,
  declinePatientUpload,
  filterResultDocuments,
  getResultDocument,
  getResultQueueNeighbors,
  isPatientUploadGated,
  listResultDocuments,
  markResultOpened,
  resultFilterCounts,
  signOffResult,
  sortResultDocuments,
  type ResultFilterTab,
  type ResultSort,
} from "@/lib/doctor-results-imaging";
import { computeClinicOverview } from "@/lib/doctor-clinic-overview";
import { useLiveQueue } from "@/lib/doctor-live-queue-store";

const SORT_CYCLE: ResultSort[] = ["priority", "newest", "patient", "title"];

export function ResultsImagingScreen({ selectedId }: { selectedId?: string }) {
  const navigate = useNavigate({ from: "/doctor/reports" });
  const { entries, bookingRequests, accepting, room } = useLiveQueue();
  const overview = computeClinicOverview({ accepting, room, entries, bookingRequests });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState(() => listResultDocuments());
  const [filterTab, setFilterTab] = useState<ResultFilterTab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ResultSort>("priority");
  const [openedVersion, setOpenedVersion] = useState(0);
  const userDismissedRef = useRef(false);
  const [confirmKind, setConfirmKind] = useState<"sign-off-critical" | "decline-upload" | null>(null);

  useEffect(() => {
    const refresh = () => setDocs(listResultDocuments());
    // Primary: doctor-results state changes (sign-off, intake)
    window.addEventListener(RESULTS_IMAGING_EVENT, refresh);
    // Secondary: lab supervisor validated and published a result to the inbox
    window.addEventListener("medora-lab-results-updated", refresh);
    return () => {
      window.removeEventListener(RESULTS_IMAGING_EVENT, refresh);
      window.removeEventListener("medora-lab-results-updated", refresh);
    };
  }, []);

  useEffect(() => {
    if (selectedId) {
      markResultOpened(selectedId);
      setOpenedVersion((v) => v + 1);
    }
  }, [selectedId]);

  const filtered = useMemo(
    () => sortResultDocuments(filterResultDocuments(docs, filterTab, search), sort),
    [docs, filterTab, search, sort],
  );

  const reviewDocs = useMemo(() => filtered.filter((d) => d.needsReview), [filtered]);
  const otherDocs = useMemo(
    () => (filterTab === "review" ? [] : filtered.filter((d) => !d.needsReview)),
    [filtered, filterTab],
  );

  const counts = resultFilterCounts(docs);
  const awaiting = awaitingSignOffCount(docs);
  const selected = selectedId ? getResultDocument(selectedId) : undefined;

  const neighbors = useMemo(() => {
    if (!selectedId) return null;
    return getResultQueueNeighbors(docs, selectedId, filterTab, search, sort);
  }, [docs, selectedId, filterTab, search, sort]);

  const selectDoc = useCallback(
    (id: string) => {
      userDismissedRef.current = false;
      navigate({ search: { id } });
    },
    [navigate],
  );

  const clearSelection = useCallback(() => {
    userDismissedRef.current = true;
    navigate({ search: { id: undefined } });
  }, [navigate]);

  const goNext = useCallback(() => {
    if (neighbors?.next) selectDoc(neighbors.next.id);
  }, [neighbors, selectDoc]);

  const goPrev = useCallback(() => {
    if (neighbors?.prev) selectDoc(neighbors.prev.id);
  }, [neighbors, selectDoc]);

  const performSignOff = useCallback(() => {
    if (!selected || selected.status === "Signed off" || isPatientUploadGated(selected)) return;

    const nextAfter = neighbors?.next?.needsReview ? neighbors.next : undefined;
    signOffResult(selected.id);
    const remaining = Math.max(0, (neighbors?.remainingReview ?? 1) - 1);
    toast.success(`${selected.title} signed off & filed in chart`, {
      description: remaining > 0 ? `${remaining} more awaiting review` : "Inbox clear",
    });
    setDocs(listResultDocuments());

    if (nextAfter) {
      selectDoc(nextAfter.id);
    }
  }, [selected, neighbors, selectDoc]);

  const handleSignOff = useCallback(() => {
    if (!selected || selected.status === "Signed off" || isPatientUploadGated(selected)) return;

    const severity = selected.analytes?.some((a) => a.flag === "Critical");
    if (severity) {
      setConfirmKind("sign-off-critical");
      return;
    }
    performSignOff();
  }, [selected, performSignOff]);

  const handleAcceptUpload = useCallback(() => {
    if (!selected) return;
    acceptPatientUpload(selected.id);
    toast.success("Patient upload accepted", {
      description: "You can now review and sign off this document",
    });
    setDocs(listResultDocuments());
  }, [selected]);

  const performDeclineUpload = useCallback(() => {
    if (!selected) return;
    declinePatientUpload(selected.id);
    toast.success("Patient upload declined");
    setDocs(listResultDocuments());
    clearSelection();
  }, [selected, clearSelection]);

  const handleDeclineUpload = useCallback(() => {
    if (!selected) return;
    setConfirmKind("decline-upload");
  }, [selected]);

  const cycleSort = () => {
    const idx = SORT_CYCLE.indexOf(sort);
    setSort(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]!);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success("Document uploaded", {
        description: `${file.name} queued for indexing`,
      });
    }
    e.target.value = "";
  };

  const listProps = {
    reviewDocuments: reviewDocs,
    otherDocuments: otherDocs,
    selectedId,
    filterTab,
    onFilterTab: setFilterTab,
    filterCounts: counts,
    sort,
    sortLabel: RESULT_SORT_LABELS[sort],
    onSort: cycleSort,
    onSortPick: setSort,
    search,
    onSearch: setSearch,
    onSelect: selectDoc,
    openedVersion,
    awaitingReview: awaiting,
    totalReview: counts.review,
  };

  const detailNav = {
    onPrev: neighbors?.prev ? goPrev : undefined,
    onNext: neighbors?.next ? goNext : undefined,
    position: neighbors?.position,
    total: neighbors?.total,
    remainingReview: neighbors?.remainingReview,
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "j" || key === "arrowdown") {
        e.preventDefault();
        goNext();
      } else if (key === "k" || key === "arrowup") {
        e.preventDefault();
        goPrev();
      } else if (key === "s" && selected?.needsReview) {
        e.preventDefault();
        handleSignOff();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, handleSignOff, selected]);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.dcm"
        className="sr-only"
        onChange={onFilePicked}
      />

      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">INBOX</p>
          <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">
            Results to review
          </h1>
          <p className="mt-0.5 text-sm text-[#8A8F8C]">
            Labs · Imaging · Patient uploads
            {awaiting > 0 ? ` · ${awaiting} awaiting sign-off` : " · All reviewed"}
          </p>
          <p className="mt-1 hidden text-[11px] text-[#ADADAD] lg:block">
            Shortcuts: <kbd className="rounded border border-[#E8E4DF] px-1">J</kbd> /{" "}
            <kbd className="rounded border border-[#E8E4DF] px-1">K</kbd> navigate ·{" "}
            <kbd className="rounded border border-[#E8E4DF] px-1">S</kbd> sign off
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleUpload}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1B3B2E] px-3.5 py-2.5 text-sm font-semibold text-white"
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </header>

      <div className="relative lg:hidden">
        <ResultsImagingList {...listProps} />

        {selected && (
          <ResultDetailMobileSheet
            doc={selected}
            onClose={clearSelection}
            onSignOff={handleSignOff}
            isSigned={selected.status === "Signed off"}
            onPatientUploadAccept={handleAcceptUpload}
            onPatientUploadDecline={handleDeclineUpload}
            {...detailNav}
          />
        )}
      </div>

      <div className="hidden h-[calc(100dvh-12rem)] min-h-[600px] gap-6 lg:grid lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#EDEAE6] bg-[#FAFAF8]/50 p-4">
          <ResultsImagingList {...listProps} compact />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden">
          {selected ? (
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#EDEAE6] bg-white shadow-[0_4px_24px_rgba(27,59,46,0.06)]">
              <ResultDetailPanel
                doc={selected}
                variant="page"
                onPatientUploadAccept={handleAcceptUpload}
                onPatientUploadDecline={handleDeclineUpload}
                {...detailNav}
              />
              <ResultStickyActionBar
                doc={selected}
                isSigned={selected.status === "Signed off"}
                onSignOff={handleSignOff}
                onPrev={detailNav.onPrev}
                onNext={detailNav.onNext}
                remainingReview={detailNav.remainingReview}
                intakeGated={isPatientUploadGated(selected)}
                intakeDeclined={selected.patientUploadIntake === "declined"}
              />
            </div>
          ) : (
            <ResultDetailEmpty />
          )}
        </div>
      </div>

      {overview.openTasksCount > 0 && (
        <p className="sr-only">{overview.openTasksCount} open tasks in messaging</p>
      )}

      <AlertDialog open={confirmKind !== null} onOpenChange={(open) => !open && setConfirmKind(null)}>
        <AlertDialogContent className="border-[#EDEAE6] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[#1B3B2E]">
              {confirmKind === "sign-off-critical" ? "Sign off critical result?" : "Decline patient upload?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#8A8F8C]">
              {confirmKind === "sign-off-critical"
                ? "This result has critical values. Confirm sign-off and filing in the legal chart record."
                : "This upload will not be filed in the chart and will be removed from your review queue."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-[#E8E4DF]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-[#1B3B2E] text-white hover:bg-[#1B3B2E]/90"
              onClick={() => {
                if (confirmKind === "sign-off-critical") performSignOff();
                if (confirmKind === "decline-upload") performDeclineUpload();
                setConfirmKind(null);
              }}
            >
              {confirmKind === "sign-off-critical" ? "Sign off & file" : "Decline upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
