import { Link } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Pill,
  Play,
  ShieldCheck,
  Sparkles,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DIET_LANGUAGE_LABELS } from "@/lib/diet-ai-types";
import type { DietLanguage } from "@/lib/diet-ai-types";
import { DietLanguagePicker } from "@/components/patient/diet/DietLanguagePicker";
import {
  DIET_LANGUAGE_EVENT,
  getDietVideoLanguage,
  setDietVideoLanguage,
} from "@/lib/diet-language-store";
import { ExerciseMedSafetyGate } from "@/components/patient/exercise/ExerciseMedSafetyGate";
import { ExercisePainCapture } from "@/components/patient/exercise/ExercisePainCapture";
import { ExerciseRoutineThumbnail } from "@/components/patient/exercise/ExerciseRoutineThumbnail";
import { ExerciseSessionMode } from "@/components/patient/exercise/ExerciseSessionMode";
import { ExerciseYoutubeEmbed } from "@/components/patient/exercise/ExerciseYoutubeEmbed";
import { getPatientExerciseContext } from "@/lib/exercise-ai-client";
import { checkMedSafetyGate } from "@/lib/exercise-med-gate";
import {
  exerciseRoutines,
  getExerciseRoutine,
  type ExerciseYoutubeVideo,
} from "@/lib/exercise-mock-data";
import {
  getCurrentTimeSlot,
  getTopExercisePicks,
  type ExerciseTimeSlot,
} from "@/lib/exercise-recovery-picks";
import {
  EXERCISE_SESSION_EVENT,
  isRoutineCompletedToday,
  recordExerciseCompletion,
} from "@/lib/exercise-session-store";
import { fetchExerciseVideos } from "@/lib/exercise-youtube-client";
import { cn } from "@/lib/utils";

const HERO_HEIGHT = 220;

export function ExerciseDetailPage({ routineId }: { routineId: string }) {
  const routine = getExerciseRoutine(routineId);
  const ctx = getPatientExerciseContext();
  const heroRef = useRef<HTMLDivElement>(null);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [videoLanguage, setVideoLanguage] = useState<DietLanguage>(() => getDietVideoLanguage());
  const [videos, setVideos] = useState<ExerciseYoutubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [showMedGate, setShowMedGate] = useState(false);
  const [showPainCapture, setShowPainCapture] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [completedToday, setCompletedToday] = useState(() => isRoutineCompletedToday(routineId));
  const [whyOpen, setWhyOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);

  const medStatus = useMemo(
    () => (routine ? checkMedSafetyGate(routine) : { blocked: false }),
    [routine],
  );

  const slot: ExerciseTimeSlot = useMemo(() => {
    const current = getCurrentTimeSlot();
    return current === "anytime" ? "evening" : current;
  }, []);

  const nextRoutine = useMemo(() => {
    const picks = getTopExercisePicks(exerciseRoutines, ctx, exerciseRoutines.length);
    const idx = picks.findIndex((p) => p.routine.id === routineId);
    if (idx >= 0 && idx < picks.length - 1) return picks[idx + 1].routine;
    return picks.find((p) => p.routine.id !== routineId)?.routine;
  }, [ctx, routineId]);

  useEffect(() => {
    const refresh = () => setCompletedToday(isRoutineCompletedToday(routineId));
    window.addEventListener(EXERCISE_SESSION_EVENT, refresh);
    return () => window.removeEventListener(EXERCISE_SESSION_EVENT, refresh);
  }, [routineId]);

  useEffect(() => {
    const onLang = () => setVideoLanguage(getDietVideoLanguage());
    window.addEventListener(DIET_LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(DIET_LANGUAGE_EVENT, onLang);
  }, []);

  useEffect(() => {
    if (!routine) return;
    let cancelled = false;
    setLoadingVideos(true);
    fetchExerciseVideos({
      routineId: routine.id,
      routineName: routine.name,
      language: videoLanguage,
      keywords: routine.keywords,
    }).then((v) => {
      if (!cancelled) {
        setVideos(v);
        setLoadingVideos(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [routine, videoLanguage]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth >= 1024) {
        setHeaderOpacity(0);
        return;
      }
      if (!heroRef.current) {
        setHeaderOpacity(0);
        return;
      }
      const y = window.scrollY;
      const opacity = Math.min(1, Math.max(0, (y - (HERO_HEIGHT - 100)) / 60));
      setHeaderOpacity(opacity);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleStartClick = () => {
    if (medStatus.blocked) {
      setShowMedGate(true);
      return;
    }
    setSessionActive(true);
  };

  const handleSessionFinish = (durationSeconds: number) => {
    setSessionDuration(durationSeconds);
    setSessionActive(false);
    setShowPainCapture(true);
  };

  const saveCompletion = (painLevel: number, difficulty: "easy" | "ok" | "hard") => {
    if (!routine) return;
    recordExerciseCompletion({
      routineId: routine.id,
      routineName: routine.name,
      slot,
      painLevel,
      difficulty,
      durationSeconds: sessionDuration,
    });
    setCompletedToday(true);
    setShowPainCapture(false);
    toast.success("Routine logged for your care team");
  };

  if (!routine) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-muted">Routine not found.</p>
        <Link to="/exercise" className="mt-4 inline-block font-semibold text-clay">
          ← Back to Move
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#F9F7F2]">
      {sessionActive ? (
        <ExerciseSessionMode
          routine={routine}
          videos={videos}
          onExit={() => setSessionActive(false)}
          onFinish={handleSessionFinish}
        />
      ) : null}

      {showMedGate ? (
        <ExerciseMedSafetyGate
          status={medStatus}
          onProceedAnyway={() => {
            setShowMedGate(false);
            setSessionActive(true);
          }}
          onCancel={() => setShowMedGate(false)}
        />
      ) : null}

      {showPainCapture ? (
        <ExercisePainCapture
          routineName={routine.name}
          onComplete={saveCompletion}
          onSkip={() => saveCompletion(0, "ok")}
        />
      ) : null}

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-[#EDEAE6]/70 bg-[#F9F7F2]/90 backdrop-blur-md transition-[border-color] duration-200 lg:hidden",
          headerOpacity > 0.05 ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={{ opacity: headerOpacity }}
        aria-hidden={headerOpacity < 0.05}
      >
        <div className="flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link
            to="/exercise"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#EDEAE6] bg-white"
            aria-label="Back to Move"
          >
            <ChevronLeft className="h-5 w-5 text-ink" strokeWidth={2.5} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-ink">
            {routine.name}
          </h1>
          <span className="w-11 shrink-0" aria-hidden />
        </div>
      </header>

      <div
        ref={heroRef}
        className="relative h-[220px] w-full overflow-hidden sm:h-[260px] lg:h-[300px]"
      >
        <ExerciseRoutineThumbnail routine={routine} size="hero" overlay className="h-full min-h-0 rounded-none" />
        <Link
          to="/exercise"
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm lg:left-8"
          aria-label="Back to Move"
        >
          <ChevronLeft className="h-5 w-5 text-white" strokeWidth={2.5} />
        </Link>
        {completedToday ? (
          <span className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-status-doneText lg:right-8">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Done today
          </span>
        ) : (
          <span className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm lg:right-8">
            {routine.category}
          </span>
        )}
        <div className="absolute bottom-5 left-4 right-4 lg:bottom-6 lg:left-8 lg:right-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/90">
            {routine.durationMinutes} min · {routine.intensity}
          </p>
          <h2 className="mt-1 font-serif text-[28px] leading-tight text-white sm:text-[34px]">
            {routine.name}
          </h2>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 lg:px-8 lg:pb-16 lg:pt-8">
        {/* Primary CTA + quick meta */}
        <section className="rounded-[24px] border border-[#EDEAE6] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap gap-2">
            <MetaChip icon={Clock} label={`${routine.durationMinutes} min`} />
            <MetaChip icon={Activity} label={routine.bestTime} accent />
            <MetaChip icon={Pill} label={`${routine.syncedMeds.length} meds synced`} />
          </div>

          <button
            type="button"
            onClick={handleStartClick}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-ink py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Play className="h-5 w-5 fill-current" />
            {completedToday ? "Repeat session" : "Start routine"}
          </button>

          {routine.medGapNote ? (
            <p className="mt-3 rounded-xl border border-clay/20 bg-clay/5 px-3 py-2.5 text-sm text-ink">
              <span className="font-semibold text-clay">Med timing:</span> {routine.medGapNote}
            </p>
          ) : null}
        </section>

        {/* Video — above the fold */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Youtube className="h-4 w-4 text-clay" strokeWidth={1.75} />
            <h3 className="font-serif text-lg text-ink">Video guide</h3>
          </div>
          {loadingVideos ? (
            <p className="text-sm text-ink-muted">Loading tutorial…</p>
          ) : videos.length ? (
            <ExerciseYoutubeEmbed video={videos[0]} />
          ) : (
            <p className="rounded-[20px] border border-[#EDEAE6] bg-white px-4 py-6 text-center text-sm text-ink-muted">
              No video available — follow the step-by-step guide in session mode.
            </p>
          )}
        </section>

        {/* Steps preview */}
        <section className="mt-6">
          <h3 className="mb-3 font-serif text-lg text-ink">Steps</h3>
          <ol className="space-y-2">
            {routine.steps.map((step, i) => (
              <li
                key={step}
                className="flex gap-3 rounded-[18px] border border-[#EDEAE6] bg-white px-4 py-3.5 text-sm text-ink"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-clay/15 text-xs font-bold text-clay">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Safety */}
        {routine.cautions.length ? (
          <section className="mt-6 rounded-[20px] border border-[#EDEAE6] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-clay" strokeWidth={1.75} />
              <h3 className="font-serif text-lg text-ink">Safety notes</h3>
            </div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {routine.cautions.map((c) => (
                <li key={c} className="flex gap-2 rounded-xl bg-[#F9F7F2] px-3 py-2">
                  <span className="text-clay">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Collapsible clinical detail */}
        <section className="mt-4">
          <button
            type="button"
            onClick={() => setWhyOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-[20px] border border-[#EDEAE6] bg-white px-4 py-4 text-left"
          >
            <span className="flex items-center gap-2 font-serif text-lg text-ink">
              <Info className="h-4 w-4 text-clay" strokeWidth={1.75} />
              Why this for you?
            </span>
            <ChevronDown className={cn("h-5 w-5 text-ink-muted transition-transform", whyOpen && "rotate-180")} />
          </button>
          {whyOpen ? (
            <div className="mt-2 rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
              <p className="text-[15px] leading-relaxed text-ink-muted">{routine.clinicalRationale}</p>
            </div>
          ) : null}
        </section>

        <section className="mt-2">
          <button
            type="button"
            onClick={() => setEffectsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-[20px] border border-[#EDEAE6] bg-white px-4 py-4 text-left"
          >
            <span className="font-serif text-lg text-ink">What happens when you do this</span>
            <ChevronDown className={cn("h-5 w-5 text-ink-muted transition-transform", effectsOpen && "rotate-180")} />
          </button>
          {effectsOpen ? (
            <div className="mt-2 rounded-[20px] border border-[#EDEAE6] bg-white p-4">
              <div className="relative ml-2.5 border-l-2 border-[#EDEAE6] pl-6">
                {routine.bodyEffects.map((effect) => (
                  <div key={effect.time + effect.effect} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[31px] top-0 h-2 w-2 rounded-full bg-clay" />
                    <p className="text-sm">
                      <span className="font-bold text-clay">{effect.time}</span>{" "}
                      <span className="font-bold text-ink">{effect.effect}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{effect.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Tutorial language
          </p>
          <DietLanguagePicker
            value={videoLanguage}
            onChange={(lang) => {
              setVideoLanguage(lang);
              setDietVideoLanguage(lang);
            }}
          />
          <p className="mt-2 text-xs text-ink-muted">
            Videos load in {DIET_LANGUAGE_LABELS[videoLanguage]}.
          </p>
        </section>

        <section className="mt-4 rounded-[20px] border border-[#EDEAE6] bg-[#F9F7F2] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Synced to</p>
          <p className="mt-1 text-sm text-ink">{routine.syncedMeds.join(" · ")}</p>
        </section>

        {nextRoutine ? (
          <Link
            to="/exercise/$routineId"
            params={{ routineId: nextRoutine.id }}
            className="mt-6 flex items-center justify-between gap-3 rounded-[24px] border border-[#EDEAE6] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-colors hover:border-clay/30"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Up next</p>
              <p className="mt-1 font-semibold text-ink">{nextRoutine.name}</p>
              <p className="text-sm text-ink-muted">
                {nextRoutine.durationMinutes} min · {nextRoutine.intensity}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-clay">
              <Sparkles className="h-4 w-4" />
              Continue
              <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  accent,
}: {
  icon: typeof Clock;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold capitalize",
        accent ? "border-clay/30 bg-clay/10 text-clay" : "border-[#EDEAE6] bg-[#F9F7F2] text-ink-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </span>
  );
}
