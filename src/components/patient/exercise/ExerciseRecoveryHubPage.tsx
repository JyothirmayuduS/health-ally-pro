import { Link } from "@tanstack/react-router";
import {
  Activity,
  Dumbbell,
  Heart,
  Lock,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PatientHubLayout } from "@/components/patient/PatientHubLayout";
import { DIET_LANGUAGE_LABELS } from "@/lib/diet-ai-types";
import type { DietLanguage } from "@/lib/diet-ai-types";
import { DietLanguagePicker } from "@/components/patient/diet/DietLanguagePicker";
import {
  DIET_LANGUAGE_EVENT,
  getDietVideoLanguage,
  setDietVideoLanguage,
} from "@/lib/diet-language-store";
import { ExerciseAdherenceCard } from "@/components/patient/exercise/ExerciseAdherenceCard";
import {
  ExerciseRecoveryPicks,
  EXERCISE_SLOT_LABELS,
} from "@/components/patient/exercise/ExerciseRecoveryPicks";
import { CATEGORY_META, ExerciseRoutineCard } from "@/components/patient/exercise/ExerciseRoutineCard";
import { getPatientExerciseContext } from "@/lib/exercise-ai-client";
import {
  exerciseRoutines,
  type ExerciseCategory,
} from "@/lib/exercise-mock-data";
import {
  getCurrentTimeSlot,
  getTopExercisePicksForSlot,
  type ExerciseTimeSlot,
} from "@/lib/exercise-recovery-picks";
import {
  EXERCISE_SESSION_EVENT,
  getExerciseStreak,
  getTodayAdherence,
} from "@/lib/exercise-session-store";
import { patientMedications } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type CategoryFilter = ExerciseCategory | "all";

const CATEGORY_FILTERS: { id: CategoryFilter; label: string; icon: typeof Activity }[] = [
  { id: "all", label: "All", icon: Dumbbell },
  { id: "mobility", label: "Mobility", icon: Activity },
  { id: "cardio", label: "Cardio", icon: Heart },
  { id: "breathing", label: "Breathing", icon: Wind },
  { id: "recovery", label: "Recovery", icon: ShieldCheck },
];

export function ExerciseRecoveryHubPage() {
  const [slot, setSlot] = useState<ExerciseTimeSlot>(() => {
    const current = getCurrentTimeSlot();
    return current === "anytime" ? "evening" : current;
  });
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [videoLanguage, setVideoLanguage] = useState<DietLanguage>(() => getDietVideoLanguage());
  const [tick, setTick] = useState(0);
  const ctx = useMemo(() => getPatientExerciseContext(), []);

  const prescribedPicks = useMemo(
    () => getTopExercisePicksForSlot(exerciseRoutines, ctx, slot, 3),
    [ctx, slot],
  );

  const adherence = useMemo(() => {
    void tick;
    return getTodayAdherence(prescribedPicks.length);
  }, [prescribedPicks.length, tick]);

  const streak = useMemo(() => {
    void tick;
    return getExerciseStreak();
  }, [tick]);

  useEffect(() => {
    const onLang = () => setVideoLanguage(getDietVideoLanguage());
    const onSession = () => setTick((t) => t + 1);
    window.addEventListener(DIET_LANGUAGE_EVENT, onLang);
    window.addEventListener(EXERCISE_SESSION_EVENT, onSession);
    return () => {
      window.removeEventListener(DIET_LANGUAGE_EVENT, onLang);
      window.removeEventListener(EXERCISE_SESSION_EVENT, onSession);
    };
  }, []);

  const takesThyroidMeds = patientMedications.some((m) =>
    m.name.toLowerCase().includes("levothyroxine"),
  );

  const filteredRoutines = useMemo(
    () =>
      exerciseRoutines.filter((r) => {
        const slotMatch = r.bestTime === slot || r.bestTime === "anytime";
        const categoryMatch = category === "all" || r.category === category;
        return slotMatch && categoryMatch;
      }),
    [slot, category],
  );

  const totalMinutes = filteredRoutines.reduce((s, r) => s + r.durationMinutes, 0);

  const categorySections = useMemo(() => {
    const cats =
      category === "all"
        ? (Object.keys(CATEGORY_META) as ExerciseCategory[])
        : [category];
    return cats
      .map((cat) => ({
        category: cat,
        routines: filteredRoutines.filter((r) => r.category === cat),
      }))
      .filter((g) => g.routines.length > 0);
  }, [category, filteredRoutines]);

  return (
    <PatientHubLayout widthClass="max-w-3xl lg:max-w-5xl">
      <header className="mb-5 sm:mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
          Recovery movement
        </p>
        <h1 className="mt-1 font-serif text-[32px] leading-tight text-ink sm:text-[38px]">Move</h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Thyroid-safe routines synced to your meds — guided sessions with video tutorials.
        </p>
      </header>

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3 text-[13px] text-ink-muted sm:mb-6">
        <Lock className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} />
        <span>Med-synced · Absorption guard · Personalized recovery</span>
      </div>

      <ExerciseAdherenceCard
        completed={adherence.completed}
        prescribed={adherence.prescribed}
        pct={adherence.pct}
        minutesDone={adherence.minutesDone}
        streak={streak}
        className="mb-5 sm:mb-6"
      />

      <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
        {[
          { label: "Routines", value: String(filteredRoutines.length).padStart(2, "0") },
          { label: "Min / slot", value: String(totalMinutes || "—") },
          {
            label: "Slot",
            value: EXERCISE_SLOT_LABELS[slot].label.slice(0, 3).toUpperCase(),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[18px] border border-[#EDEAE6] bg-white px-2 py-3.5 text-center"
          >
            <p className="font-serif text-xl tabular-nums text-ink sm:text-2xl">{value}</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-ink-muted sm:text-[10px]">
              {label}
            </p>
          </div>
        ))}
      </section>

      <div className="mb-5 flex rounded-[20px] border border-[#EDEAE6] bg-white p-1 sm:mb-6">
        {(["morning", "midday", "evening"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlot(s)}
            className={cn(
              "flex flex-1 flex-col rounded-2xl py-2.5 transition-colors",
              slot === s ? "bg-ink text-white" : "text-ink-muted",
            )}
          >
            <span className="text-[12px] font-semibold">{EXERCISE_SLOT_LABELS[s].label}</span>
            <span className="text-[9px] opacity-75">{EXERCISE_SLOT_LABELS[s].subtitle}</span>
          </button>
        ))}
      </div>

      <ExerciseRecoveryPicks
        routines={exerciseRoutines}
        activeSlot={slot}
        showAllSlots={false}
      />

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:mb-6 lg:flex-wrap lg:overflow-visible">
        {CATEGORY_FILTERS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-[13px] font-medium transition-colors",
              category === id ? "border-clay text-ink" : "border-[#EDEAE6] text-ink-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      <section className="mb-5 rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:mb-6 sm:p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Video tutorial language
        </p>
        <p className="mb-3 text-[13px] text-ink-muted">
          Short tutorials load in {DIET_LANGUAGE_LABELS[videoLanguage]} — applies to all routines.
        </p>
        <DietLanguagePicker
          value={videoLanguage}
          onChange={(lang) => {
            setVideoLanguage(lang);
            setDietVideoLanguage(lang);
          }}
        />
      </section>

      {takesThyroidMeds ? (
        <section className="mb-6 rounded-[24px] border border-clay/20 bg-white p-5 sm:p-[22px]">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/15">
              <ShieldCheck className="h-[22px] w-[22px] text-clay" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-ink">Movement safety protocol</p>
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                  Active
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-muted/90">
                Routines respect levothyroxine timing — no high-intensity work on an empty stomach.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13px] text-ink-muted">
                {ctx.restrictions.slice(0, 3).map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="text-clay">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-6">
        {categorySections.map(({ category: cat, routines }) => {
          const Icon = CATEGORY_META[cat].icon;
          return (
            <section key={cat}>
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  {CATEGORY_META[cat].label}
                </p>
                <span className="rounded-md bg-[#F9F7F2] px-1.5 py-0.5 text-[8px] font-bold uppercase text-ink-muted">
                  {EXERCISE_SLOT_LABELS[slot].label}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {routines.map((routine) => (
                  <li key={routine.id}>
                    <ExerciseRoutineCard routine={routine} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {!categorySections.length ? (
          <p className="rounded-[20px] border border-[#EDEAE6] bg-white px-4 py-8 text-center text-sm text-ink-muted">
            No routines match this filter. Try another time slot or category.
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-[13px]">
        <Link to="/medications" className="inline-flex items-center gap-1.5 font-semibold text-clay">
          View medications
        </Link>
        <span className="text-ink-muted/40">·</span>
        <Link to="/diet" className="inline-flex items-center gap-1.5 font-semibold text-clay">
          Clinical diet
        </Link>
      </div>
    </PatientHubLayout>
  );
}
