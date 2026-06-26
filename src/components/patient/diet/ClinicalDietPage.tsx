import { Link } from "@tanstack/react-router";
import {
  Award,
  Beef,
  ChefHat,
  ChevronRight,
  Droplets,
  Leaf,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PatientHubLayout } from "@/components/patient/PatientHubLayout";
import { BUDGET_LABELS, DIET_LANGUAGE_LABELS } from "@/lib/diet-ai-types";
import type { DietCuisineFilter, DietLanguage } from "@/lib/diet-ai-types";
import { DietLanguagePicker } from "@/components/patient/diet/DietLanguagePicker";
import {
  DIET_LANGUAGE_EVENT,
  getDietVideoLanguage,
  setDietVideoLanguage,
} from "@/lib/diet-language-store";
import { dietMeals, type DietMeal } from "@/lib/diet-mock-data";
import { DIET_STORE_EVENT, dedupeDietMealsByName, listAiDietMeals } from "@/lib/diet-store";
import { useClinicalDietProfile } from "@/hooks/useClinicalDietProfile";
import { getMealNutrition } from "@/lib/diet-nutrition";
import { DietNutritionPanel } from "@/components/patient/diet/DietNutritionPanel";
import { DietRecoveryPicks } from "@/components/patient/diet/DietRecoveryPicks";
import { cn } from "@/lib/utils";

type Budget = DietMeal["budget"];
type DietFilter = DietCuisineFilter;

const SLOTS = [
  { type: "breakfast" as const, label: "Breakfast", icon: Zap },
  { type: "lunch" as const, label: "Lunch", icon: Award },
  { type: "dinner" as const, label: "Dinner", icon: ChefHat },
  { type: "snack" as const, label: "Snacks", icon: Sparkles },
];

export function ClinicalDietPage() {
  const [budget, setBudget] = useState<Budget>("balanced");
  const [dietType, setDietType] = useState<DietFilter>("all");
  const [lactoseFree, setLactoseFree] = useState(true);
  const [storeTick, setStoreTick] = useState(0);
  const [videoLanguage, setVideoLanguage] = useState<DietLanguage>(() => getDietVideoLanguage());

  useEffect(() => {
    const onStore = () => setStoreTick((t) => t + 1);
    window.addEventListener(DIET_STORE_EVENT, onStore);
    return () => window.removeEventListener(DIET_STORE_EVENT, onStore);
  }, []);

  useEffect(() => {
    const onLang = () => setVideoLanguage(getDietVideoLanguage());
    window.addEventListener(DIET_LANGUAGE_EVENT, onLang);
    return () => window.removeEventListener(DIET_LANGUAGE_EVENT, onLang);
  }, []);

  const { profile: clinicalProfile } = useClinicalDietProfile();

  const takesThyroidMeds = clinicalProfile.takesThyroidMeds;

  const allMeals = useMemo(() => {
    const ai = listAiDietMeals();
    const ids = new Set(ai.map((m) => m.id));
    return dedupeDietMealsByName([
      ...ai,
      ...dietMeals.filter((m) => !ids.has(m.id)),
    ]);
  }, [storeTick]);

  const filteredMeals = useMemo(
    () =>
      allMeals.filter((m) => {
        const budgetMatch = m.budget === budget;
        const typeMatch =
          dietType === "all" ||
          dietType === "lactose-free" ||
          m.type === dietType ||
          (dietType === "indian" && (m.cuisine === "indian" || m.id.startsWith("in")));
        const lactoseMatch =
          dietType === "lactose-free" ? m.lactoseFree : !lactoseFree || m.lactoseFree;
        return budgetMatch && typeMatch && lactoseMatch;
      }),
    [allMeals, budget, dietType, lactoseFree],
  );

  const totalCal = filteredMeals.reduce((s, m) => s + m.calories, 0);
  const macroTotals = useMemo(() => {
    return filteredMeals.reduce(
      (acc, m) => {
        const n = getMealNutrition(m);
        acc.protein += n.proteinG;
        acc.carbs += n.carbsG;
        acc.fat += n.fatG;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 },
    );
  }, [filteredMeals]);
  const aiCount = listAiDietMeals().length;

  return (
    <PatientHubLayout widthClass="max-w-3xl lg:max-w-5xl">
      <header className="mb-5 sm:mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-clay">
          Clinical nutrition
        </p>
        <h1 className="mt-1 font-serif text-[32px] leading-tight text-ink sm:text-[38px]">
          Diet
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Thyroid-safe meals across every budget — AI-powered recipes with video tutorials.
        </p>
      </header>

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#EDEAE6] bg-white px-3.5 py-3 text-[13px] text-ink-muted sm:mb-6">
        <Lock className="h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} />
        <span>Med-synced · Absorption guard · Personalized macros</span>
      </div>

      <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
        {[
          { label: "Meals", value: String(filteredMeals.length).padStart(2, "0") },
          { label: "Kcal / day", value: String(totalCal || "—") },
          { label: "Protein", value: macroTotals.protein ? `${macroTotals.protein}g` : "—" },
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
        {(["essential", "balanced", "elite"] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBudget(b)}
            className={cn(
              "flex flex-1 flex-col rounded-2xl py-2.5 transition-colors",
              budget === b ? "bg-ink text-white" : "text-ink-muted",
            )}
          >
            <span className="text-[12px] font-semibold">{BUDGET_LABELS[b].label}</span>
            <span className="text-[9px] opacity-75">{BUDGET_LABELS[b].subtitle}</span>
          </button>
        ))}
      </div>

      <DietRecoveryPicks
        meals={allMeals}
        activeBudget={budget}
        lactoseFreeOnly={lactoseFree || dietType === "lactose-free"}
      />

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:mb-6 lg:flex-wrap lg:overflow-visible">
        {(
          [
            { id: "all" as const, label: "All Food", icon: ChefHat },
            { id: "indian" as const, label: "Indian", icon: Sparkles },
            { id: "vegan" as const, label: "Vegan", icon: Leaf },
            { id: "non-veg" as const, label: "Non-Veg", icon: Beef },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDietType(id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-[13px] font-medium transition-colors",
              dietType === id
                ? "border-clay text-ink"
                : "border-[#EDEAE6] text-ink-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDietType(dietType === "lactose-free" ? "all" : "lactose-free")}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-[13px] font-medium transition-colors",
            dietType === "lactose-free"
              ? "border-emerald-500 text-ink"
              : "border-[#EDEAE6] text-ink-muted",
          )}
        >
          <Droplets className="h-3.5 w-3.5" strokeWidth={1.75} />
          Lactose-Free
        </button>
      </div>

      <section className="mb-5 rounded-[20px] border border-[#EDEAE6] bg-white p-4 sm:mb-6 sm:p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Video tutorial language
        </p>
        <p className="mb-3 text-[13px] text-ink-muted">
          YouTube recipes load in {DIET_LANGUAGE_LABELS[videoLanguage]} — applies to Chef Medora and meal pages.
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
        <Link
          to="/diet/clinical-rules"
          className="mb-6 flex gap-4 rounded-[24px] border border-clay/20 bg-white p-5 transition-shadow hover:shadow-md sm:p-[22px]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/15">
            <ShieldCheck className="h-[22px] w-[22px] text-clay" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-ink">Absorption Guard Protocol</p>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                Active
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-muted/90">
              Avoiding competitive nutrients to maximize levothyroxine absorption.
            </p>
            <span className="mt-2.5 inline-flex text-[13px] font-semibold text-clay">
              View Clinical Rules →
            </span>
          </div>
        </Link>
      ) : null}

      <div className="flex flex-col gap-6">
        {SLOTS.map(({ type, label, icon: Icon }) => {
          const meals = filteredMeals.filter((m) => m.mealType === type);
          if (!meals.length) return null;
          return (
            <section key={type}>
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
                  {label}
                </p>
              </div>
              <ul className="flex flex-col gap-3">
                {meals.map((meal) => (
                  <li key={meal.id}>
                    <MealCard meal={meal} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <Link
        to="/diet/chef"
        className={cn(
          "fixed z-50 grid h-14 w-14 place-items-center rounded-full bg-ink text-white",
          "shadow-[0_8px_28px_rgba(27,59,46,0.28)] transition-transform active:scale-95",
          "right-5 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-8 lg:right-8",
        )}
        aria-label="Open Chef Medora"
      >
        <ChefHat className="h-6 w-6" strokeWidth={1.75} />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[#F9F7F2] bg-clay text-[10px] font-bold text-white">
          AI
        </span>
      </Link>
    </PatientHubLayout>
  );
}

function MealCard({ meal }: { meal: DietMeal }) {
  const nutrition = getMealNutrition(meal);

  return (
    <Link
      to="/diet/$mealId"
      params={{ mealId: meal.id }}
      className="group flex flex-col gap-3 rounded-[20px] border border-[#EDEAE6] bg-white p-4 transition-all hover:border-clay/25 hover:shadow-[0_8px_24px_rgba(27,59,46,0.06)] active:bg-[#F9F7F2] sm:rounded-[24px] sm:p-5"
    >
      <div className="flex items-start gap-4">
        {meal.imageUrl ? (
          <img
            src={meal.imageUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
            loading="lazy"
          />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-clay/15">
            <ChefHat className="h-5 w-5 text-clay" strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{meal.name}</p>
            {meal.aiIntelligence ? (
              <span className="rounded-md bg-clay/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-clay">
                AI
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">
            {meal.ingredients.slice(0, 3).join(" · ")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[9px] font-bold uppercase text-ink-muted">
              {meal.mealType}
            </span>
            {meal.protocol ? (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                {meal.protocol.medGap} med gap
              </span>
            ) : null}
            {meal.prepTimeMinutes ? (
              <span className="rounded-md bg-[#F9F7F2] px-2 py-0.5 text-[9px] font-bold uppercase text-ink-muted">
                {meal.prepTimeMinutes} min
              </span>
            ) : null}
            {meal.youtubeVideos?.length ? (
              <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-red-600">
                {meal.youtubeVideos.length} video{meal.youtubeVideos.length > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
      </div>

      <DietNutritionPanel meal={meal} variant="card" />

      <p className="text-[10px] text-ink-muted">
        {nutrition.fiberG}g fiber · {nutrition.sodiumMg}mg sodium
        {meal.lactoseFree ? " · Lactose-free" : ""}
      </p>
    </Link>
  );
}
