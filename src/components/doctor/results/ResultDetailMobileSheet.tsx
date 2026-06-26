import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { ResultDocument } from "@/lib/doctor-results-imaging";
import { getResultPatientName, isPatientUploadGated } from "@/lib/doctor-results-imaging";
import { useDoctorMobileOverlay } from "@/lib/doctor-mobile-chrome";
import { ResultDetailPanel } from "./ResultDetailPanel";
import { ResultStickyActionBar } from "./ResultStickyActionBar";
import { cn } from "@/lib/utils";

type SheetSnap = "peek" | "full";

const PEEK_VH = 54;
const DISMISS_DRAG_PX = 80;
const COLLAPSE_DRAG_PX = 48;
const EXPAND_SCROLL_PX = 20;
const COLLAPSE_SCROLL_AWAY_PX = 40;

export function ResultDetailMobileSheet({
  doc,
  onClose,
  onSignOff,
  isSigned,
  onPrev,
  onNext,
  position,
  total,
  remainingReview,
  onPatientUploadAccept,
  onPatientUploadDecline,
}: {
  doc: ResultDocument;
  onClose: () => void;
  onSignOff: () => void;
  isSigned: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  position?: number;
  total?: number;
  remainingReview?: number;
  onPatientUploadAccept?: () => void;
  onPatientUploadDecline?: () => void;
}) {
  const [snap, setSnap] = useState<SheetSnap>("peek");
  const [dragY, setDragY] = useState(0);
  const dragYRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const snapAtDragStart = useRef<SheetSnap>("peek");
  const lastScrollTop = useRef(0);
  const touchStartY = useRef(0);
  const hasScrolledAway = useRef(false);
  const patientName = getResultPatientName(doc.patientId);

  useDoctorMobileOverlay(true);

  const setDragOffset = (value: number) => {
    dragYRef.current = value;
    setDragY(value);
  };

  useEffect(() => {
    setSnap("peek");
    setDragOffset(0);
    hasScrolledAway.current = false;
    lastScrollTop.current = 0;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [doc.id]);

  const expandToFull = useCallback(() => {
    setSnap("full");
    setDragOffset(0);
    hasScrolledAway.current = false;
  }, []);

  const collapseToPeek = useCallback(() => {
    setSnap("peek");
    setDragOffset(0);
    hasScrolledAway.current = false;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isDragging) return;

    const top = el.scrollTop;
    const scrollingTowardStart = top < lastScrollTop.current;

    if (snap === "peek" && top > EXPAND_SCROLL_PX) {
      expandToFull();
    }

    if (snap === "full") {
      if (top > COLLAPSE_SCROLL_AWAY_PX) {
        hasScrolledAway.current = true;
      }
      if (hasScrolledAway.current && top <= 2 && scrollingTowardStart) {
        collapseToPeek();
      }
    }

    lastScrollTop.current = top;
  }, [snap, isDragging, expandToFull, collapseToPeek]);

  const handleDragStart = useCallback(
    (clientY: number) => {
      setIsDragging(true);
      dragStartY.current = clientY;
      snapAtDragStart.current = snap;
    },
    [snap],
  );

  const handleDragMove = useCallback(
    (clientY: number) => {
      const delta = clientY - dragStartY.current;

      if (delta > 0) {
        const atTop = (scrollRef.current?.scrollTop ?? 0) <= 0;
        if (snapAtDragStart.current === "full" && atTop) {
          setDragOffset(delta);
        } else if (snapAtDragStart.current === "peek") {
          setDragOffset(delta);
        }
        return;
      }

      if (snapAtDragStart.current === "peek" && delta < -32) {
        expandToFull();
        setIsDragging(false);
        setDragOffset(0);
      }
    },
    [expandToFull],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const offset = dragYRef.current;

    if (offset > DISMISS_DRAG_PX) {
      if (snap === "full") {
        collapseToPeek();
      } else {
        onClose();
      }
      return;
    }

    if (offset > COLLAPSE_DRAG_PX && snap === "full") {
      collapseToPeek();
      return;
    }

    if (offset > 20 && snap === "full" && (scrollRef.current?.scrollTop ?? 0) <= 0) {
      collapseToPeek();
      return;
    }

    setDragOffset(0);
  }, [isDragging, snap, onClose, collapseToPeek]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onUp = () => handleDragEnd();

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const onContentTouchStart = (clientY: number) => {
    touchStartY.current = clientY;
    if ((scrollRef.current?.scrollTop ?? 0) <= 0) {
      handleDragStart(clientY);
    }
  };

  const onContentTouchMove = (clientY: number) => {
    const top = scrollRef.current?.scrollTop ?? 0;
    const delta = clientY - touchStartY.current;

    if (snap === "peek" && delta < -8) {
      expandToFull();
      return;
    }

    if (top <= 0) {
      handleDragMove(clientY);
    }
  };

  const sheetHeight =
    snap === "full"
      ? `calc(100dvh - env(safe-area-inset-top, 0px) - ${dragY}px)`
      : `calc(${PEEK_VH}dvh - ${Math.max(0, dragY)}px)`;

  return (
    <>
      <button
        type="button"
        aria-label="Close detail"
        className="fixed inset-0 z-[60] bg-[#1B3B2E]/28 backdrop-blur-[2px]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] flex flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-8px_40px_rgba(27,59,46,0.18)]",
          !isDragging && "transition-[height,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        )}
        style={{
          height: sheetHeight,
          maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transform: dragY > 0 ? `translateY(${dragY * 0.15}px)` : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`${doc.title} for ${patientName}`}
      >
        <div className="shrink-0 border-b border-[#F0EDE9] bg-white px-4 pb-2 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate text-sm font-bold text-[#1B3B2E]">{doc.title}</p>
              <p className="truncate text-xs text-[#8A8F8C]">
                {patientName}
                {position && total ? ` · ${position} of ${total}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="relative z-10 grid h-9 w-9 shrink-0 touch-manipulation place-items-center rounded-lg border border-[#E8E4DF] bg-white text-[#8A8F8C] active:bg-[#F5F2ED]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className="mx-auto mt-2 h-1 w-9 rounded-full bg-[#D8D4CF] touch-none"
            onTouchStart={(e) => handleDragStart(e.touches[0]!.clientY)}
            onTouchMove={(e) => {
              e.preventDefault();
              handleDragMove(e.touches[0]!.clientY);
            }}
            onTouchEnd={handleDragEnd}
          />
        </div>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          onTouchStart={(e) => onContentTouchStart(e.touches[0]!.clientY)}
          onTouchMove={(e) => {
            const top = scrollRef.current?.scrollTop ?? 0;
            const delta = e.touches[0]!.clientY - touchStartY.current;

            if (snap === "peek" && delta < -6) {
              e.preventDefault();
              expandToFull();
              return;
            }

            if (top <= 0 && delta > 0) {
              e.preventDefault();
              if (snap === "full" && delta > 24) {
                collapseToPeek();
                return;
              }
              onContentTouchMove(e.touches[0]!.clientY);
            }
          }}
          onTouchEnd={handleDragEnd}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        >
          <ResultDetailPanel
            doc={doc}
            variant="sheet"
            onPrev={onPrev}
            onNext={onNext}
            position={position}
            total={total}
            remainingReview={remainingReview}
            onPatientUploadAccept={onPatientUploadAccept}
            onPatientUploadDecline={onPatientUploadDecline}
          />
        </div>

        {!isPatientUploadGated(doc) && doc.patientUploadIntake !== "declined" && (
        <ResultStickyActionBar
          doc={doc}
          isSigned={isSigned}
          onSignOff={onSignOff}
          onPrev={onPrev}
          onNext={onNext}
          remainingReview={remainingReview}
          variant="sheet"
        />
        )}
      </div>
    </>
  );
}
