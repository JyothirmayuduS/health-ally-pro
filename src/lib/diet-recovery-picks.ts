import type { PatientDietContext } from "@/lib/diet-ai-client";
import type { ClinicalDietProfile } from "@/lib/patient-diet-profile";
import type { DietMeal } from "@/lib/diet-mock-data";
import { getMealNutrition, type DietNutritionPerServing } from "@/lib/diet-nutrition";

export type DietBudget = DietMeal["budget"];

export type RecoveryPick = {
  meal: DietMeal;
  rank: number;
  score: number;
  recoveryTag: string;
};

const RECOVERY_TAGS: Record<string, string> = {
  eb1: "Iodine baseline",
  eb2: "Anti-inflammatory",
  eb3: "T3 conversion",
  eb4: "Muscle repair",
  ba1: "Hormone transport",
  ba2: "Protein recovery",
  ba3: "Gut + iodine",
  ba4: "Zinc activation",
  el1: "Selenium shield",
  el2: "Deiodinase prime",
  el3: "Nerve recovery",
  el4: "Marine iodine",
  in1: "Selenium load",
  in2: "Gut priming",
  in3: "Glycemic steady",
  in4: "Iron + magnesium",
};

function inferRecoveryTag(meal: DietMeal): string {
  if (RECOVERY_TAGS[meal.id]) return RECOVERY_TAGS[meal.id];

  const tags = meal.nutrients.join(" ").toLowerCase();
  if (/selenium/.test(tags)) return "Selenium recovery";
  if (/iodine/.test(tags)) return "Thyroid substrate";
  if (/zinc/.test(tags)) return "Hormone conversion";
  if (/omega|d3|vitamin d/.test(tags)) return "Immune recovery";
  if (/protein/.test(tags)) return "Tissue repair";
  if (/iron|magnesium/.test(tags)) return "Energy restore";
  return "Clinical balance";
}

function getCurrentMealSlot(): DietMeal["mealType"] {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

function scoreForRecovery(
  meal: DietMeal,
  nutrition: DietNutritionPerServing,
  ctx: PatientDietContext,
  slot: DietMeal["mealType"],
): number {
  let score = 0;

  if (meal.aiIntelligence) score += meal.aiIntelligence.confidence * 28;

  if (nutrition.iodineMcg) score += Math.min(nutrition.iodineMcg / 4, 18);
  if (nutrition.seleniumMcg) score += Math.min(nutrition.seleniumMcg / 2.5, 22);
  if (nutrition.zincMg) score += nutrition.zincMg * 5;
  if (nutrition.vitaminDMcg) score += nutrition.vitaminDMcg * 1.8;
  if (nutrition.ironMg) score += nutrition.ironMg * 2.5;
  if (nutrition.magnesiumMg) score += nutrition.magnesiumMg / 18;
  score += nutrition.proteinG * 0.9;
  score += nutrition.fiberG * 0.4;

  if (ctx.needsLactoseFree && meal.lactoseFree) score += 14;
  if (ctx.needsLactoseFree && !meal.lactoseFree) score -= 30;

  if (ctx.takesThyroidMeds && meal.protocol) {
    if (meal.protocol.medGap === "60 mins") score += 6;
    if (meal.protocol.medGap === "2 hours") score += 4;
  }

  const profile = ctx as ClinicalDietProfile;
  if (profile.severity === "high" && meal.aiIntelligence) score += 12;
  if (profile.nutrientPriorities?.length) {
    const mealText = `${meal.nutrients.join(" ")} ${meal.ingredients.join(" ")}`.toLowerCase();
    for (const p of profile.nutrientPriorities.slice(0, 3)) {
      if (mealText.includes(p.toLowerCase())) score += 8;
    }
  }

  if (meal.mealType === slot) score += 12;

  const impactText = (meal.metabolicImpact ?? [])
    .map((m) => `${m.effect} ${m.description}`)
    .join(" ");
  if (/repair|recover|inflammation|synthesis|conversion|stability|immune/i.test(impactText)) {
    score += 10;
  }

  return Math.round(score * 10) / 10;
}

export function getTopRecoveryMeals(
  meals: DietMeal[],
  budget: DietBudget,
  ctx: PatientDietContext,
  limit = 3,
): RecoveryPick[] {
  const slot = getCurrentMealSlot();
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  return meals
    .filter((m) => m.budget === budget)
    .map((meal) => {
      const nutrition = getMealNutrition(meal);
      return {
        meal,
        score: scoreForRecovery(meal, nutrition, ctx, slot),
        recoveryTag: inferRecoveryTag(meal),
        rank: 0,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.meal.mealType === slot && b.meal.mealType !== slot) return -1;
      if (b.meal.mealType === slot && a.meal.mealType !== slot) return 1;
      return a.meal.name.localeCompare(b.meal.name);
    })
    .filter((pick) => {
      if (seenIds.has(pick.meal.id)) return false;
      const nameKey = pick.meal.name.trim().toLowerCase();
      if (seenNames.has(nameKey)) return false;
      seenIds.add(pick.meal.id);
      seenNames.add(nameKey);
      return true;
    })
    .slice(0, limit)
    .map((pick, i) => ({ ...pick, rank: i + 1 }));
}

export function getAllTierRecoveryPicks(
  meals: DietMeal[],
  ctx: PatientDietContext,
  options?: {
    lactoseFreeOnly?: boolean;
    limitPerTier?: number;
  },
): Record<DietBudget, RecoveryPick[]> {
  const pool = options?.lactoseFreeOnly
    ? meals.filter((m) => m.lactoseFree)
    : meals;
  const limit = options?.limitPerTier ?? 3;

  return {
    essential: getTopRecoveryMeals(pool, "essential", ctx, limit),
    balanced: getTopRecoveryMeals(pool, "balanced", ctx, limit),
    elite: getTopRecoveryMeals(pool, "elite", ctx, limit),
  };
}

export function getCurrentMealSlotLabel(): string {
  const slot = getCurrentMealSlot();
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}
