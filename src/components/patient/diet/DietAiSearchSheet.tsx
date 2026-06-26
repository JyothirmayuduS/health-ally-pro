import { Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Loader2, Pill, Play, Search, Sparkles, X, Youtube } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { usePatientSheetA11y } from "@/hooks/usePatientSheetA11y";
import {
  getMedicationAwareSuggestions,
  getPatientDietContext,
  getSuggestedVideos,
  personalizeLibraryMeal,
  runDietAiSearch,
  suggestLibraryMeals,
} from "@/lib/diet-ai-client";
import type { DietAiSearchInput, DietBudget, DietCuisineFilter, DietLanguage } from "@/lib/diet-ai-types";
import { BUDGET_LABELS, DIET_LANGUAGE_LABELS } from "@/lib/diet-ai-types";
import type { DietMeal } from "@/lib/diet-mock-data";
import { saveAiDietMeal } from "@/lib/diet-store";
import { formatMacroSummary, getMealNutrition } from "@/lib/diet-nutrition";
import { DietMealNutritionStrip } from "@/components/patient/diet/DietMealNutritionStrip";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  initialBudget?: DietBudget;
  initialCuisine?: DietCuisineFilter;
};

export function DietAiSearchSheet({
  open,
  onClose,
  initialBudget = "balanced",
  initialCuisine = "all",
}: Props) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { titleId } = usePatientSheetA11y({
    open,
    onClose,
    panelRef,
    initialFocusSelector: "input",
  });

  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState<DietBudget>(initialBudget);
  const [cuisine, setCuisine] = useState<DietCuisineFilter>(initialCuisine);
  const [language, setLanguage] = useState<DietLanguage>("en");
  const [loading, setLoading] = useState(false);
  const [lastMealId, setLastMealId] = useState<string | null>(null);

  const ctx = useMemo(() => getPatientDietContext(), []);
  const suggestions = useMemo(() => getMedicationAwareSuggestions(ctx), [ctx]);

  const searchInput: DietAiSearchInput = useMemo(
    () => ({ query, budget, cuisine, language }),
    [query, budget, cuisine, language],
  );

  const librarySuggestions = useMemo(
    () => suggestLibraryMeals(searchInput, ctx, 5),
    [searchInput, ctx],
  );

  const videoSuggestions = useMemo(
    () => getSuggestedVideos(searchInput, ctx),
    [searchInput, ctx],
  );

  useEffect(() => {
    if (open) {
      setBudget(initialBudget);
      setCuisine(initialCuisine);
      setLastMealId(null);
    }
  }, [open, initialBudget, initialCuisine]);

  const openRecipe = (mealId: string) => {
    onClose();
    navigate({ to: "/diet/$mealId", params: { mealId } });
  };

  const applyMeal = (meal: DietMeal, modelSource?: string, goToRecipe = false) => {
    saveAiDietMeal(meal);
    setLastMealId(meal.id);
    const n = getMealNutrition(meal);
    const videoCount = meal.youtubeVideos?.length ?? 0;
    toast.success("Recipe ready", {
      description: `${meal.name} · ${n.calories} kcal · ${formatMacroSummary(n)}${videoCount ? ` · ${videoCount} video${videoCount > 1 ? "s" : ""}` : ""}`,
      action: goToRecipe
        ? undefined
        : {
            label: "View",
            onClick: () => openRecipe(meal.id),
          },
    });
    if (goToRecipe) openRecipe(meal.id);
  };

  const handleGenerate = async (overrideQuery?: string, goToRecipe = false) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) {
      toast.message("Describe what you'd like to eat, or tap a suggestion below");
      return;
    }

    if (overrideQuery) setQuery(overrideQuery);

    setLoading(true);
    try {
      const result = await runDietAiSearch({ ...searchInput, query: q });
      applyMeal(result.meal, result.modelSource, goToRecipe);
    } finally {
      setLoading(false);
    }
  };

  const handleUseLibraryMeal = (meal: DietMeal) => {
    const personalized = personalizeLibraryMeal(meal, searchInput, ctx);
    applyMeal(personalized, "Synced to your care plan", true);
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F9F7F2] shadow-2xl lg:max-w-lg lg:rounded-[28px]"
      >
        <div className="flex shrink-0 justify-center pt-3 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-[#D8D4CE]" aria-hidden />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[#EDEAE6] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-serif text-xl text-ink">
              AI Recipe Chef
            </h2>
            <p className="text-xs text-ink-muted">
              Personalized to your medications & diet filters
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-2xl border border-clay/20 bg-clay/10 px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <Pill className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">Your medication profile</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {ctx.medNames.join(" · ")}
                </p>
                {ctx.restrictions[0] ? (
                  <p className="mt-1.5 text-[10px] text-clay">{ctx.restrictions[0]}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. thyroid-safe lunch, indian vegan…"
              className="w-full rounded-2xl border border-[#EDEAE6] bg-white py-3 pl-10 pr-4 text-sm focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
              onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
            />
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Suggested for you
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => handleGenerate(s, true)}
                className="rounded-full border border-[#EDEAE6] bg-white px-3 py-1.5 text-left text-[11px] font-medium text-ink transition-colors hover:border-clay/40 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {librarySuggestions.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Best matches from your plan
              </p>
              <ul className="flex flex-col gap-2">
                {librarySuggestions.map((meal) => (
                  <li key={meal.id}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleUseLibraryMeal(meal)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-3 text-left transition-colors hover:border-clay/30 disabled:opacity-50"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clay/15">
                        <Play className="h-4 w-4 text-clay" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">{meal.name}</span>
                        <span className="mt-1 block">
                          <DietMealNutritionStrip meal={meal} showServing={false} />
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-muted capitalize">
                          {meal.budget} · {meal.mealType}
                          {meal.lactoseFree ? " · lactose-free" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white">
                        Use now
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {videoSuggestions.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                <Youtube className="h-3.5 w-3.5 text-red-600" />
                Recommended videos ({DIET_LANGUAGE_LABELS[language]})
              </p>
              <ul className="flex flex-col gap-2">
                {videoSuggestions.map((video) => (
                  <li key={video.videoId}>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-[#EDEAE6] bg-white p-3 transition-colors hover:border-red-200"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10">
                        <Play className="h-4 w-4 text-red-600" fill="currentColor" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-2 text-sm font-medium text-ink">
                          {video.title}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {video.channel}
                          {video.viewCount ? ` · ${video.viewCount} views` : ""}
                        </span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Budget tier
          </p>
          <div className="mb-4 flex gap-2">
            {(["essential", "balanced", "elite"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudget(b)}
                className={cn(
                  "flex-1 rounded-xl border px-2 py-2.5 text-center transition-colors",
                  budget === b
                    ? "border-ink bg-ink text-white"
                    : "border-[#EDEAE6] bg-white text-ink-muted",
                )}
              >
                <span className="block text-[11px] font-semibold">{BUDGET_LABELS[b].label}</span>
                <span className="block text-[9px] opacity-80">{BUDGET_LABELS[b].subtitle}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Food type
          </p>
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            {(
              [
                ["all", "All"],
                ["indian", "Indian"],
                ["vegan", "Vegan"],
                ["non-veg", "Non-Veg"],
                ["lactose-free", "Lactose-Free"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCuisine(id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium",
                  cuisine === id
                    ? "border-clay bg-clay/10 text-ink"
                    : "border-[#EDEAE6] bg-white text-ink-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            Recipe language (YouTube)
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(DIET_LANGUAGE_LABELS) as DietLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  language === lang
                    ? "border-ink bg-ink text-white"
                    : "border-[#EDEAE6] bg-white text-ink-muted",
                )}
              >
                {DIET_LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>

          {lastMealId ? (
            <Link
              to="/diet/$mealId"
              params={{ mealId: lastMealId }}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"
            >
              <Youtube className="h-5 w-5 text-emerald-700" />
              <span className="text-sm font-semibold text-emerald-800">
                View recipe with video tutorials →
              </span>
            </Link>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[#EDEAE6] p-5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate(undefined, true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Building your recipe…" : "Generate & open recipe"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
