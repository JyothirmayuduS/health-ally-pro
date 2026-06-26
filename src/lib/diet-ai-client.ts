import { dietMeals, type DietMeal, type DietYoutubeVideo } from "@/lib/diet-mock-data";
import type { DietAiSearchInput, DietAiSearchResult, DietLanguage } from "@/lib/diet-ai-types";
import { attachYoutubeVideosForMeal } from "@/lib/diet-meal-videos";
import { enrichMealNutrition } from "@/lib/diet-nutrition";
import {
  getClinicalDietProfile,
  loadClinicalDietProfile,
  profileToApiContext,
  type ClinicalDietProfile,
} from "@/lib/patient-diet-profile";
import {
  isBadGeneratedMealName,
  isVagueRecipeQuery,
  resolveSemanticQuery,
} from "@/lib/diet-recipe-intent";
import { getCuratedYoutubeVideos, mealNeedsVideoRepair } from "@/lib/diet-youtube-curated";

export type { PatientDietContext } from "@/lib/patient-diet-profile";
export { getPatientDietContext } from "@/lib/patient-diet-profile";

import type { PatientDietContext } from "@/lib/patient-diet-profile";

export function getMedicationAwareSuggestions(ctx: PatientDietContext): string[] {
  const base = [
    "High protein lunch",
    "Light dinner",
    "Indian vegetarian breakfast",
    "South indian vegan",
    "Budget-friendly meal prep",
  ];

  if (ctx.takesThyroidMeds) {
    return [
      "Thyroid-safe breakfast (60 min after meds)",
      "Iodine-rich lunch — no calcium",
      "Low-fiber dinner before bed",
      "Indian dal without soy",
      "Lactose-free snack",
      ...base.slice(0, 2),
    ];
  }

  return base;
}

function scoreMeal(meal: DietMeal, input: DietAiSearchInput, ctx: PatientDietContext): number {
  let score = 0;
  const q = input.query.toLowerCase();

  if (meal.budget === input.budget) score += 30;
  if (q && meal.name.toLowerCase().includes(q)) score += 50;
  if (q && meal.ingredients.some((i) => i.toLowerCase().includes(q))) score += 25;
  if (q && meal.nutrients.some((n) => n.toLowerCase().includes(q))) score += 15;

  if (input.cuisine === "indian" && (meal.cuisine === "indian" || meal.id.startsWith("in"))) {
    score += 20;
  }
  if (input.cuisine === "vegan" && meal.type === "vegan") score += 25;
  if (input.cuisine === "non-veg" && meal.type === "non-veg") score += 25;
  if (input.cuisine === "lactose-free" && meal.lactoseFree) score += 30;

  if (ctx.takesThyroidMeds && meal.lactoseFree) score += 15;
  if (ctx.takesThyroidMeds && meal.protocol) score += 20;

  if (input.mealType && meal.mealType === input.mealType) score += 45;

  if (isVagueRecipeQuery(input.query)) {
    if (ctx.takesThyroidMeds && meal.protocol) score += 25;
    if (ctx.takesThyroidMeds && meal.lactoseFree) score += 15;
    if (meal.nutrients.some((n) => /iodine|selenium|zinc/i.test(n))) score += 20;
  }

  if (!q) score += 10;

  return score;
}

export function suggestLibraryMeals(
  input: DietAiSearchInput,
  ctx: PatientDietContext,
  limit = 5,
): DietMeal[] {
  const searchInput = {
    ...input,
    query: resolveSemanticQuery(input.query, ctx),
  };

  const scored = [...dietMeals]
    .map((meal) => ({ meal, score: scoreMeal(meal, searchInput, ctx) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const byType = searchInput.mealType
    ? scored.filter((x) => x.meal.mealType === searchInput.mealType)
    : scored;

  const pool = byType.length ? byType : scored;

  if (pool.length > 0) {
    return pool.slice(0, limit).map((x) => x.meal);
  }

  return dietMeals
    .filter(
      (m) =>
        (m.budget === searchInput.budget || searchInput.budget === "balanced") &&
        (!searchInput.mealType || m.mealType === searchInput.mealType),
    )
    .slice(0, limit);
}

export function getSuggestedVideos(
  input: DietAiSearchInput,
  ctx?: PatientDietContext,
): DietYoutubeVideo[] {
  return curatedVideos(input, ctx ?? getPatientDietContext());
}

export function personalizeLibraryMeal(
  meal: DietMeal,
  input: DietAiSearchInput,
  ctx?: PatientDietContext,
): DietMeal {
  const profile = ctx ?? getPatientDietContext();
  const isIndian = meal.cuisine === "indian" || meal.id.startsWith("in");
  const isVegan = meal.type === "vegan";

  return {
    ...meal,
    id: `ai-${Date.now()}`,
    clinicalRationale: personalizeRationale(meal.clinicalRationale ?? "", profile),
    instructions:
      meal.instructions ??
      buildInstructions(isIndian, isVegan, profile),
    protocol: meal.protocol ?? (profile.takesThyroidMeds
      ? { medGap: "60 mins", caution: profile.restrictions.slice(0, 3) }
      : undefined),
  };
}

function curatedVideos(input: DietAiSearchInput, _ctx: PatientDietContext): DietYoutubeVideo[] {
  return getCuratedYoutubeVideos(input);
}

function generateLocalRecipe(input: DietAiSearchInput, profile: ClinicalDietProfile): DietMeal {
  const semanticQuery = resolveSemanticQuery(input.query, profile);
  const searchInput = { ...input, query: semanticQuery };
  const library = suggestLibraryMeals(searchInput, profile, 3);

  if (library.length > 0 && !profile.labFindings.length) {
    return personalizeLibraryMeal(library[0], searchInput, profile);
  }

  return buildPatientUniqueRecipe(input, profile, semanticQuery);
}

function buildPatientUniqueRecipe(
  input: DietAiSearchInput,
  profile: ClinicalDietProfile,
  semanticQuery: string,
): DietMeal {
  const isIndian =
    input.cuisine === "indian" || /indian|dal|masala|curry|idli|dosa/i.test(semanticQuery);
  const isVegan =
    input.cuisine === "vegan" ||
    input.cuisine === "lactose-free" ||
    /vegan|plant/i.test(semanticQuery);

  const slot = input.mealType ?? inferMealType(semanticQuery);
  const id = `ai-${profile.profileId}-${Date.now()}`;

  const ingredients = pickPatientIngredients(profile, isIndian, isVegan, input.budget);
  const nutrients = profile.nutrientPriorities.length
    ? profile.nutrientPriorities.slice(0, 4).map((n) => n.replace(/\b\w/g, (c) => c.toUpperCase()))
    : profile.takesThyroidMeds
      ? ["Iodine", "Selenium", "Zinc", "Fiber"]
      : ["Protein", "Omega-3", "Antioxidants"];

  const severityLabel =
    profile.severity === "high"
      ? "Intensive Clinical"
      : profile.severity === "moderate"
        ? "Targeted Clinical"
        : "Balanced Clinical";

  const primaryNutrient = profile.nutrientPriorities[0] ?? "metabolic";
  const name = `${severityLabel} ${capitalize(primaryNutrient)} ${slot === "breakfast" ? "Morning" : slot === "dinner" ? "Evening" : ""} Plate`.replace(
    /\s+/g,
    " ",
  ).trim();

  const calories =
    profile.severity === "high"
      ? input.budget === "essential"
        ? 380
        : 480
      : input.budget === "essential"
        ? 350
        : input.budget === "elite"
          ? 520
          : 430;

  const labNote = profile.labFindings.length
    ? ` Tuned for your labs: ${profile.labFindings.slice(0, 2).map((l) => `${l.name} ${l.status}`).join(", ")}.`
    : "";

  return {
    id,
    name,
    ingredients,
    nutrients,
    type: isVegan ? "vegan" : "non-veg",
    lactoseFree: input.cuisine === "lactose-free" || isVegan || profile.needsLactoseFree,
    budget: input.budget,
    mealType: slot,
    calories,
    cuisine: isIndian ? "indian" : "continental",
    prepTimeMinutes: input.budget === "elite" ? 35 : input.budget === "balanced" ? 25 : 18,
    clinicalRationale: `Personalized for patient ${profile.profileId} (${profile.severity} severity). Medications: ${profile.medNames.join(", ")}.${labNote} ${profile.restrictions[0] ?? ""}`.trim(),
    instructions: buildInstructions(isIndian, isVegan, profile),
    protocol: profile.takesThyroidMeds
      ? {
          medGap: profile.severity === "high" ? "60 mins" : "60 mins",
          caution: [...profile.restrictions.slice(0, 2), ...profile.avoidIngredients.slice(0, 1)],
        }
      : undefined,
    clinicalBenefits: [
      {
        title: "Profile-Matched",
        description: `Built for ${profile.conditions[0] ?? "your clinical profile"} (${profile.severity}).`,
        icon: "Shield",
      },
      {
        title: "Lab-Aligned",
        description: profile.labFindings[0]
          ? `Addresses ${profile.labFindings[0].name} (${profile.labFindings[0].status}).`
          : "Supports your current nutrient priorities.",
        icon: "Flame",
      },
    ],
    aiIntelligence: {
      confidence: profile.severity === "high" ? 0.94 : 0.89,
      model: "Medora Clinical Chef",
      dataset: `Patient Graph ${profile.profileId}`,
    },
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickPatientIngredients(
  profile: ClinicalDietProfile,
  isIndian: boolean,
  isVegan: boolean,
  budget: DietMeal["budget"],
): string[] {
  const pools: Record<string, string[]> = {
    iodine: ["Iodized salt", "Seaweed flakes", "Eggs", "Yogurt (lactose-free)"],
    selenium: ["Brazil nuts", "Sunflower seeds", "Brown rice", "Mushrooms"],
    zinc: ["Pumpkin seeds", "Chickpeas", "Lentils", "Cashews"],
    "vitamin d": ["Salmon", "Mackerel", "Egg yolks", "Mushrooms"],
    "healthy fats": ["Avocado", "Olive oil", "Walnuts", "Flaxseed"],
    fiber: ["Oats", "Quinoa", "Lentils", "Broccoli"],
    "omega-3": ["Sardines", "Walnuts", "Flaxseed", "Chia seeds"],
    iron: ["Spinach", "Lentils", "Pumpkin seeds", "Lean beef"],
    magnesium: ["Pumpkin seeds", "Spinach", "Almonds", "Dark chocolate (70%)"],
    protein: ["Chicken breast", "Tofu", "Greek yogurt", "Lentils"],
    "low glycemic index": ["Sweet potato", "Barley", "Chickpeas", "Leafy greens"],
  };

  const picked: string[] = [];
  for (const priority of profile.nutrientPriorities) {
    const key = Object.keys(pools).find((k) => priority.toLowerCase().includes(k));
    if (key) {
      for (const item of pools[key]) {
        if (!picked.includes(item) && picked.length < 6) picked.push(item);
      }
    }
  }

  if (picked.length >= 4) return picked.slice(0, 6);

  const fallback = isIndian
    ? isVegan
      ? ["Brown rice", "Moong dal", "Turmeric", "Spinach", "Mustard seeds", "Coconut oil"]
      : ["Brown rice", "Grilled chicken", "Turmeric", "Ginger", "Ghee", "Steamed vegetables"]
    : isVegan
      ? ["Quinoa", "Chickpeas", "Kale", "Olive oil", "Lemon", "Pumpkin seeds"]
      : budget === "elite"
        ? ["Wild salmon", "Asparagus", "Quinoa", "Olive oil", "Garlic", "Herbs"]
        : ["Salmon", "Sweet potato", "Broccoli", "Olive oil", "Garlic", "Fresh herbs"];

  for (const item of fallback) {
    if (!picked.includes(item) && picked.length < 6) picked.push(item);
  }
  return picked;
}

function personalizeRationale(base: string, ctx: PatientDietContext): string {
  return `${base} Personalized for ${ctx.medNames.join(", ")}. ${ctx.restrictions[0] ?? ""}`.trim();
}

function inferMealType(query: string): DietMeal["mealType"] {
  const q = query.toLowerCase();
  if (/breakfast|morning|oats/i.test(q)) return "breakfast";
  if (/dinner|evening|night/i.test(q)) return "dinner";
  if (/snack/i.test(q)) return "snack";
  return "lunch";
}

function buildInstructions(
  isIndian: boolean,
  isVegan: boolean,
  ctx: PatientDietContext,
): string[] {
  const steps = [
    "Wash and prep all ingredients; measure portions for your macro targets.",
    isIndian
      ? "Temper mustard seeds and turmeric in oil until fragrant."
      : "Preheat pan with olive oil on medium heat.",
    isVegan
      ? "Cook legumes and grains until tender; season with iodized salt if thyroid support is needed."
      : "Cook protein through; pair with complex carbs and vegetables.",
  ];

  if (ctx.takesThyroidMeds) {
    steps.push(
      "Schedule this meal at least 60 minutes after levothyroxine, avoiding calcium and iron-rich add-ons.",
    );
  }

  steps.push("Plate and rest 2 minutes before serving.");
  return steps;
}

/** Phase 1 only — clinical basket meal without videos */
export function runDietAiSearchClient(
  input: DietAiSearchInput,
  profile?: ClinicalDietProfile,
): DietAiSearchResult {
  const clinical = profile ?? getClinicalDietProfile();
  const meal = enrichMealNutrition(generateLocalRecipe(input, clinical));
  return {
    meal,
    source: "template",
    modelSource: `Medora Clinical Chef · profile ${clinical.profileId}`,
    videos: [],
  };
}

/** Patient app: clinical basket first, then food-based YouTube videos */
export async function runDietAiSearch(input: DietAiSearchInput): Promise<DietAiSearchResult> {
  const profile = await loadClinicalDietProfile();
  const local = runDietAiSearchClient(input, profile);

  let meal = local.meal;

  try {
    const res = await fetch("/api/ai/diet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        patientContext: profileToApiContext(profile),
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as DietAiSearchResult & { error?: string };
      if (data.meal?.id) {
        const useLocalCore = isBadGeneratedMealName(data.meal.name, input.query);
        meal = useLocalCore
          ? {
              ...local.meal,
              clinicalRationale:
                data.source === "ai" && data.meal.clinicalRationale
                  ? data.meal.clinicalRationale
                  : local.meal.clinicalRationale,
            }
          : {
              ...data.meal,
              instructions:
                data.meal.instructions?.length
                  ? data.meal.instructions
                  : local.meal.instructions,
              protocol: data.meal.protocol ?? local.meal.protocol,
              metabolicImpact: data.meal.metabolicImpact ?? local.meal.metabolicImpact,
              clinicalBenefits: data.meal.clinicalBenefits ?? local.meal.clinicalBenefits,
              ingredients:
                data.meal.ingredients?.length >= 3
                  ? data.meal.ingredients
                  : local.meal.ingredients,
              name: isBadGeneratedMealName(data.meal.name, input.query)
                ? local.meal.name
                : data.meal.name,
            };
      }
    }
  } catch {
    /* use local meal */
  }

  // Phase 3: Real images + videos matched to resolved clinical foods
  const withMedia = await attachYoutubeVideosForMeal(meal, input.language, input.cuisine);

  return {
    meal: enrichMealNutrition(withMedia),
    source: local.source,
    modelSource: local.modelSource,
    videos: withMedia.youtubeVideos ?? [],
  };
}

export function formatLanguageLabel(lang: DietLanguage): string {
  const labels: Record<DietLanguage, string> = {
    en: "English",
    hi: "Hindi",
    ta: "Tamil",
    te: "Telugu",
  };
  return labels[lang];
}
