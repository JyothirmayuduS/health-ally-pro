import { getDietVideoLanguage } from "@/lib/diet-language-store";
import { attachYoutubeVideosForMeal } from "@/lib/diet-meal-videos";
import type { DietMeal } from "@/lib/diet-mock-data";
import { dietMeals, getDietMeal as getMockMeal } from "@/lib/diet-mock-data";
import { enrichMealNutrition } from "@/lib/diet-nutrition";
import {
  mealNeedsImageRepair,
  mealNeedsVideoRepair,
  repairMealYoutubeVideos,
} from "@/lib/diet-youtube-curated";

const STORAGE_KEY = "medora-diet-ai-meals-v2";
export const DIET_STORE_EVENT = "medora-diet-store-changed";

function loadAiMeals(): DietMeal[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DietMeal[];
  } catch {
    return [];
  }
}

function saveAiMeals(meals: DietMeal[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DIET_STORE_EVENT));
  }
}

const hydratingIds = new Set<string>();

function patchAiDietMeal(meal: DietMeal) {
  const meals = loadAiMeals();
  if (!meals.some((m) => m.id === meal.id)) return;
  saveAiMeals(meals.map((m) => (m.id === meal.id ? meal : m)));
}

function queueMealMediaHydration(meals: DietMeal[]) {
  if (typeof window === "undefined") return;
  const lang = getDietVideoLanguage();

  for (const meal of meals) {
    if (hydratingIds.has(meal.id)) continue;
    if (!mealNeedsVideoRepair(meal) && !mealNeedsImageRepair(meal)) continue;
    hydratingIds.add(meal.id);

    void attachYoutubeVideosForMeal(meal, lang)
      .then((enriched) => {
        const videosSame =
          (enriched.youtubeVideos?.length ?? 0) === (meal.youtubeVideos?.length ?? 0) &&
          (enriched.youtubeVideos ?? []).every(
            (v, i) => v.videoId === meal.youtubeVideos?.[i]?.videoId,
          );
        if (enriched.imageUrl === meal.imageUrl && videosSame) return;
        patchAiDietMeal(enrichMealNutrition(enriched));
      })
      .finally(() => {
        hydratingIds.delete(meal.id);
      });
  }
}

export function listAiDietMeals(): DietMeal[] {
  const meals = loadAiMeals();
  let changed = false;
  const repaired = meals.map((meal) => {
    if (!mealNeedsVideoRepair(meal) && !mealNeedsImageRepair(meal)) return meal;
    changed = true;
    return repairMealYoutubeVideos(meal);
  });
  if (changed) saveAiMeals(repaired);
  queueMealMediaHydration(repaired);
  return repaired;
}

export function saveAiDietMeal(meal: DietMeal) {
  const repaired = enrichMealNutrition(repairMealYoutubeVideos(meal));
  const existing = loadAiMeals().filter((m) => m.id !== repaired.id);
  saveAiMeals([repaired, ...existing].slice(0, 40));
  queueMealMediaHydration([repaired]);
}

export function getDietMeal(id: string): DietMeal | undefined {
  const mock = getMockMeal(id);
  if (mock) return enrichMealNutrition(repairMealYoutubeVideos(mock));

  const meals = loadAiMeals();
  const meal = meals.find((m) => m.id === id);
  if (!meal) return undefined;

  const needsRepair = mealNeedsVideoRepair(meal) || mealNeedsImageRepair(meal);
  const needsNutrition = !meal.nutritionPerServing;
  if (!needsRepair && !needsNutrition) return meal;

  const repaired = enrichMealNutrition(
    needsRepair ? repairMealYoutubeVideos(meal) : meal,
  );
  if (needsRepair || needsNutrition) {
    const updated = meals.map((m) => (m.id === id ? repaired : m));
    saveAiMeals(updated);
    if (needsRepair) queueMealMediaHydration([repaired]);
  }
  return repaired;
}

export function listAllDietMeals(): DietMeal[] {
  const ai = listAiDietMeals();
  return dedupeDietMealsByName([
    ...ai,
    ...dietMeals.filter((m) => !ai.some((a) => a.id === m.id)),
  ]);
}

/** Collapse duplicate AI saves that share the same dish name. */
export function dedupeDietMealsByName(meals: DietMeal[]): DietMeal[] {
  const byName = new Map<string, DietMeal>();
  for (const meal of meals) {
    const key = meal.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, meal);
      continue;
    }
    const preferMeal =
      existing.aiIntelligence && !meal.aiIntelligence
        ? meal
        : !existing.aiIntelligence && meal.aiIntelligence
          ? existing
          : meal.id.startsWith("ai-") && !existing.id.startsWith("ai-")
            ? existing
            : meal;
    byName.set(key, preferMeal);
  }
  return Array.from(byName.values());
}
