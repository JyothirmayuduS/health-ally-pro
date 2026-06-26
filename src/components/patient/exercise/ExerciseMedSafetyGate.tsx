import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { MedSafetyStatus } from "@/lib/exercise-med-gate";
import { cn } from "@/lib/utils";

type Props = {
  status: MedSafetyStatus;
  onProceedAnyway?: () => void;
  onCancel: () => void;
};

export function ExerciseMedSafetyGate({ status, onProceedAnyway, onCancel }: Props) {
  const [remaining, setRemaining] = useState(status.waitMinutes ?? 0);

  useEffect(() => {
    if (!status.blocked || !status.waitMinutes) return;
    setRemaining(status.waitMinutes);
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [status.blocked, status.waitMinutes]);

  if (!status.blocked) return null;

  const canStart = remaining <= 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-[24px] border border-[#EDEAE6] bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-labelledby="med-gate-title"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mustard-soft">
            <ShieldCheck className="h-5 w-5 text-mustard" strokeWidth={1.75} />
          </span>
          <div>
            <p id="med-gate-title" className="font-serif text-xl text-ink">
              Med-timing safety check
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{status.reason}</p>
          </div>
        </div>

        {!canStart ? (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-[#F9F7F2] px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-clay" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-ink">Estimated wait</p>
              <p className="text-2xl font-serif tabular-nums text-clay">{remaining} min</p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-status-doneBorder bg-status-doneBg px-4 py-3 text-sm text-status-doneText">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Safe to start — thyroid dose window has passed.
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {canStart ? (
            <button
              type="button"
              onClick={onProceedAnyway}
              className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start routine
            </button>
          ) : null}

          {status.safeAlternativeId ? (
            <Link
              to="/exercise/$routineId"
              params={{ routineId: status.safeAlternativeId }}
              onClick={onCancel}
              className="w-full rounded-2xl border border-[#EDEAE6] bg-white py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-clay/30"
            >
              Try safe alternative (breathing reset)
            </Link>
          ) : null}

          <button
            type="button"
            onClick={canStart ? onProceedAnyway : onCancel}
            className={cn(
              "w-full rounded-2xl py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink",
              !canStart && onProceedAnyway ? "" : "",
            )}
          >
            {canStart ? "Continue to session" : "Go back"}
          </button>

          {!canStart && onProceedAnyway ? (
            <button
              type="button"
              onClick={onProceedAnyway}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted underline-offset-2 hover:text-clay hover:underline"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              I understand the risk — start anyway
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
