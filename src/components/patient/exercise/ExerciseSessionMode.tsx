import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExerciseYoutubeEmbed } from "@/components/patient/exercise/ExerciseYoutubeEmbed";
import type { ExerciseRoutine, ExerciseYoutubeVideo } from "@/lib/exercise-mock-data";
import {
  buildExerciseSteps,
  formatStepTimer,
  type ExerciseStepDetail,
} from "@/lib/exercise-step-utils";
import { setExerciseSessionActive } from "@/lib/exercise-session-store";
import { cn } from "@/lib/utils";

type Props = {
  routine: ExerciseRoutine;
  videos: ExerciseYoutubeVideo[];
  onExit: () => void;
  onFinish: (durationSeconds: number) => void;
};

export function ExerciseSessionMode({ routine, videos, onExit, onFinish }: Props) {
  const steps = buildExerciseSteps(routine);
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(steps[0]?.durationSeconds ?? 30);
  const [paused, setPaused] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
  const [showVideo, setShowVideo] = useState(false);
  const startedAt = useRef(Date.now());
  const step = steps[stepIndex];
  const progress = ((stepIndex + (step ? 1 - secondsLeft / step.durationSeconds : 0)) / steps.length) * 100;

  useEffect(() => {
    setExerciseSessionActive(true);
    return () => setExerciseSessionActive(false);
  }, []);

  useEffect(() => {
    if (!step || paused) return;
    if (secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, paused, secondsLeft]);

  const goToStep = useCallback(
    (index: number) => {
      const next = steps[index];
      if (!next) return;
      setStepIndex(index);
      setSecondsLeft(next.durationSeconds);
      setPaused(false);
    },
    [steps],
  );

  const markStepDone = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add(stepIndex));
    if (stepIndex < steps.length - 1) {
      goToStep(stepIndex + 1);
    }
  }, [stepIndex, steps.length, goToStep]);

  const handleFinish = () => {
    const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    onFinish(durationSeconds);
  };

  const isLastStep = stepIndex === steps.length - 1;
  const primaryVideo = videos[0];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white exercise-presentation-mode"
      data-presentation-mode="true"
    >
      {/* Session header */}
      <header className="shrink-0 border-b border-white/20 bg-black px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-white bg-black text-white"
            aria-label="Exit session"
          >
            <X className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[clamp(1.25rem,4vw,3rem)] font-bold leading-tight text-white">
              {routine.name}
            </p>
            <p className="text-[clamp(1rem,2.5vw,1.5rem)] font-medium text-white/80">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-black"
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? (
              <Play className="h-7 w-7" strokeWidth={2.5} />
            ) : (
              <Pause className="h-7 w-7" strokeWidth={2.5} />
            )}
          </button>
        </div>
        <div className="mx-auto mt-4 h-2 max-w-lg overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </header>

      {/* Main step content */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-y-auto px-4 py-6">
        {step ? (
          <>
            <div className="text-center">
              <p
                className={cn(
                  "font-serif tabular-nums text-white transition-all",
                  "text-[clamp(3rem,12vw,5rem)]",
                  secondsLeft <= 5 && !paused && "text-[#FFD166]",
                )}
                aria-live="polite"
              >
                {formatStepTimer(Math.max(0, secondsLeft))}
              </p>
              {step.reps ? (
                <p className="mt-3 text-[clamp(1.5rem,4vw,3rem)] font-bold text-[#FFD166]">
                  {step.reps} reps
                </p>
              ) : null}
              {step.holdSeconds ? (
                <p className="mt-2 text-[clamp(1.25rem,3vw,2rem)] font-medium text-white/80">
                  Hold {step.holdSeconds}s
                </p>
              ) : null}
            </div>

            <div className="mt-8 rounded-[24px] border-2 border-white/30 bg-white/10 p-8">
              <p className="text-[clamp(1.5rem,4.5vw,3rem)] font-bold leading-snug text-white">
                {step.instruction}
              </p>
            </div>

            {primaryVideo ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowVideo((v) => !v)}
                  className="text-sm font-semibold text-clay"
                >
                  {showVideo ? "Hide demo video" : "Show demo video"}
                </button>
                {showVideo ? (
                  <div className="mt-3">
                    <ExerciseYoutubeEmbed video={primaryVideo} compact />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Step checklist */}
            <ul className="mt-6 space-y-3">
              {steps.map((s, i) => (
                <li key={s.instruction}>
                  <button
                    type="button"
                    onClick={() => goToStep(i)}
                    className={cn(
                      "flex min-h-[64px] w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-colors",
                      i === stepIndex
                        ? "border-white bg-white/15"
                        : completedSteps.has(i)
                          ? "border-white/20 bg-white/5 opacity-70"
                          : "border-white/25 bg-white/5",
                    )}
                    aria-label={`Step ${i + 1}: ${s.instruction}`}
                  >
                    <span
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold",
                        completedSteps.has(i)
                          ? "bg-white text-black"
                          : i === stepIndex
                            ? "bg-[#FFD166] text-black"
                            : "bg-white/20 text-white",
                      )}
                    >
                      {completedSteps.has(i) ? <Check className="h-6 w-6" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "text-[clamp(1.25rem,3.5vw,2rem)] font-semibold leading-snug text-white",
                        completedSteps.has(i) && "line-through opacity-60",
                      )}
                    >
                      {s.instruction}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {/* Session controls */}
      <footer className="shrink-0 border-t border-white/20 bg-black px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto flex max-w-lg gap-3">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => goToStep(stepIndex - 1)}
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-white disabled:opacity-40"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              className="flex min-h-[64px] flex-1 items-center justify-center gap-3 rounded-2xl bg-white py-4 text-[clamp(1.25rem,3vw,2rem)] font-bold text-black"
            >
              <Check className="h-7 w-7" />
              Complete session
            </button>
          ) : (
            <button
              type="button"
              onClick={markStepDone}
              className="flex min-h-[64px] flex-1 items-center justify-center gap-3 rounded-2xl bg-white py-4 text-[clamp(1.25rem,3vw,2rem)] font-bold text-black"
            >
              Next step
              <ChevronRight className="h-7 w-7" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
