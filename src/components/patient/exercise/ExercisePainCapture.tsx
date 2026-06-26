import { useState } from "react";
import type { ExerciseDifficulty } from "@/lib/exercise-session-store";
import { cn } from "@/lib/utils";

type Props = {
  routineName: string;
  onComplete: (painLevel: number, difficulty: ExerciseDifficulty) => void;
  onSkip: () => void;
};

const DIFFICULTY_OPTIONS: { id: ExerciseDifficulty; label: string }[] = [
  { id: "easy", label: "Felt good" },
  { id: "ok", label: "Moderate" },
  { id: "hard", label: "Too hard" },
];

export function ExercisePainCapture({ routineName, onComplete, onSkip }: Props) {
  const [pain, setPain] = useState(2);
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>("ok");

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-[24px] border border-[#EDEAE6] bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-labelledby="pain-capture-title"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-clay">Session complete</p>
        <h2 id="pain-capture-title" className="mt-1 font-serif text-2xl text-ink">
          How did it feel?
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{routineName}</p>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label htmlFor="pain-slider" className="text-sm font-semibold text-ink">
              Pain level
            </label>
            <span className="font-serif text-2xl tabular-nums text-clay">{pain}</span>
          </div>
          <input
            id="pain-slider"
            type="range"
            min={0}
            max={10}
            value={pain}
            onChange={(e) => setPain(parseInt(e.target.value, 10))}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#EDEAE6] accent-clay"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-muted">
            <span>None</span>
            <span>Severe</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">Difficulty</p>
          <div className="mt-2.5 flex gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDifficulty(opt.id)}
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors",
                  difficulty === opt.id
                    ? "border-clay bg-clay/10 text-ink"
                    : "border-[#EDEAE6] bg-white text-ink-muted hover:border-clay/25",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {pain >= 7 ? (
          <p className="mt-4 rounded-xl border border-status-noshowBorder bg-status-noshowBg px-3 py-2 text-xs text-status-noshowText">
            High pain reported — consider messaging your care team if this persists.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onComplete(pain, difficulty)}
            className="w-full rounded-2xl bg-ink py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Save & finish
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="py-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            Skip feedback
          </button>
        </div>
      </div>
    </div>
  );
}
