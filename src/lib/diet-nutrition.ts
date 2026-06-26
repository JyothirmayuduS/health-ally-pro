import type { DietMeal } from "@/lib/diet-mock-data";

export type DietNutritionPerServing = {
  servingSize: string;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  saturatedFatG: number;
  iodineMcg?: number;
  seleniumMcg?: number;
  zincMg?: number;
  ironMg?: number;
  vitaminDMcg?: number;
  magnesiumMg?: number;
};

/** FDA-style daily values for % DV badges (adults). */
export const DAILY_VALUES = {
  calories: 2000,
  proteinG: 50,
  carbsG: 275,
  fatG: 78,
  fiberG: 28,
  sugarG: 50,
  sodiumMg: 2300,
  saturatedFatG: 20,
  iodineMcg: 150,
  seleniumMcg: 55,
  zincMg: 11,
  ironMg: 18,
  vitaminDMcg: 20,
  magnesiumMg: 420,
} as const;

export function pctDaily(value: number | undefined, daily: number): number | null {
  if (value == null || daily <= 0) return null;
  return Math.round((value / daily) * 100);
}

export function formatMacroSummary(n: Pick<DietNutritionPerServing, "proteinG" | "carbsG" | "fatG">): string {
  return `P ${n.proteinG}g · C ${n.carbsG}g · F ${n.fatG}g`;
}

/** Curated per-serving profiles for the clinical meal library. */
const LIBRARY_NUTRITION: Record<string, Omit<DietNutritionPerServing, "calories"> & { calories?: number }> = {
  eb1: {
    servingSize: "1 bowl (250 g)",
    servings: 1,
    proteinG: 12,
    carbsG: 52,
    fatG: 8,
    fiberG: 9,
    sugarG: 4,
    sodiumMg: 180,
    saturatedFatG: 1.2,
    iodineMcg: 45,
  },
  eb2: {
    servingSize: "1 bowl (380 g)",
    servings: 1,
    proteinG: 28,
    carbsG: 42,
    fatG: 16,
    fiberG: 6,
    sugarG: 2,
    sodiumMg: 420,
    saturatedFatG: 3.5,
    iodineMcg: 35,
    vitaminDMcg: 8,
  },
  eb3: {
    servingSize: "1 bowl (320 g)",
    servings: 1,
    proteinG: 18,
    carbsG: 48,
    fatG: 6,
    fiberG: 11,
    sugarG: 5,
    sodiumMg: 290,
    saturatedFatG: 0.8,
    zincMg: 2.8,
    ironMg: 4.2,
  },
  ba1: {
    servingSize: "2 slices + toppings",
    servings: 1,
    proteinG: 16,
    carbsG: 38,
    fatG: 22,
    fiberG: 7,
    sugarG: 3,
    sodiumMg: 380,
    saturatedFatG: 5.5,
    iodineMcg: 12,
  },
  ba2: {
    servingSize: "1 plate (420 g)",
    servings: 1,
    proteinG: 42,
    carbsG: 38,
    fatG: 18,
    fiberG: 5,
    sugarG: 2,
    sodiumMg: 340,
    saturatedFatG: 4.2,
    magnesiumMg: 95,
    ironMg: 3.8,
  },
  ba3: {
    servingSize: "1 bowl (300 g)",
    servings: 1,
    proteinG: 14,
    carbsG: 22,
    fatG: 8,
    fiberG: 4,
    sugarG: 3,
    sodiumMg: 720,
    saturatedFatG: 1.1,
    iodineMcg: 120,
  },
  el1: {
    servingSize: "1 fillet plate (350 g)",
    servings: 1,
    proteinG: 38,
    carbsG: 8,
    fatG: 32,
    fiberG: 4,
    sugarG: 3,
    sodiumMg: 280,
    saturatedFatG: 6.8,
    seleniumMcg: 48,
    zincMg: 2.4,
    vitaminDMcg: 14,
  },
  el2: {
    servingSize: "1 parfait cup (280 g)",
    servings: 1,
    proteinG: 10,
    carbsG: 32,
    fatG: 20,
    fiberG: 6,
    sugarG: 14,
    sodiumMg: 45,
    saturatedFatG: 4.5,
    seleniumMcg: 68,
  },
  el3: {
    servingSize: "4 scallops + puree",
    servings: 1,
    proteinG: 26,
    carbsG: 12,
    fatG: 14,
    fiberG: 3,
    sugarG: 4,
    sodiumMg: 520,
    saturatedFatG: 2.8,
    zincMg: 3.2,
    ironMg: 1.8,
  },
  in1: {
    servingSize: "1 bowl khichdi (300 g)",
    servings: 1,
    proteinG: 14,
    carbsG: 52,
    fatG: 10,
    fiberG: 8,
    sugarG: 2,
    sodiumMg: 310,
    saturatedFatG: 4.2,
    seleniumMcg: 18,
    zincMg: 2.1,
    magnesiumMg: 72,
  },
  in2: {
    servingSize: "2 dosas + chutney",
    servings: 1,
    proteinG: 11,
    carbsG: 46,
    fatG: 8,
    fiberG: 5,
    sugarG: 2,
    sodiumMg: 220,
    saturatedFatG: 3.8,
    iodineMcg: 22,
    ironMg: 3.5,
  },
  eb4: {
    servingSize: "1 plate (280 g)",
    servings: 1,
    proteinG: 10,
    carbsG: 44,
    fatG: 12,
    fiberG: 7,
    sugarG: 6,
    sodiumMg: 190,
    saturatedFatG: 2.1,
    iodineMcg: 28,
  },
  ba4: {
    servingSize: "1 bowl (340 g)",
    servings: 1,
    proteinG: 16,
    carbsG: 40,
    fatG: 14,
    fiberG: 9,
    sugarG: 5,
    sodiumMg: 360,
    saturatedFatG: 2.4,
    zincMg: 1.9,
    magnesiumMg: 58,
  },
  el4: {
    servingSize: "1 fillet plate (320 g)",
    servings: 1,
    proteinG: 32,
    carbsG: 8,
    fatG: 38,
    fiberG: 3,
    sugarG: 2,
    sodiumMg: 390,
    saturatedFatG: 7.2,
    seleniumMcg: 38,
    iodineMcg: 55,
  },
  in3: {
    servingSize: "2 theplas",
    servings: 1,
    proteinG: 9,
    carbsG: 38,
    fatG: 10,
    fiberG: 7,
    sugarG: 2,
    sodiumMg: 240,
    saturatedFatG: 1.8,
    ironMg: 3.8,
  },
  in4: {
    servingSize: "1 bowl (290 g)",
    servings: 1,
    proteinG: 12,
    carbsG: 38,
    fatG: 10,
    fiberG: 8,
    sugarG: 3,
    sodiumMg: 270,
    saturatedFatG: 2.2,
    magnesiumMg: 88,
    ironMg: 5.2,
  },
};

// Fix duplicate fiberG in eb1 - I made a mistake. Let me fix in the write - actually I have fiberG twice in eb1. I'll fix when writing.

function macroSplit(mealType: DietMeal["mealType"]): { p: number; c: number; f: number } {
  switch (mealType) {
    case "breakfast":
      return { p: 0.22, c: 0.48, f: 0.3 };
    case "lunch":
      return { p: 0.3, c: 0.4, f: 0.3 };
    case "dinner":
      return { p: 0.32, c: 0.32, f: 0.36 };
    case "snack":
      return { p: 0.18, c: 0.52, f: 0.3 };
    default:
      return { p: 0.28, c: 0.42, f: 0.3 };
  }
}

function defaultServingSize(meal: DietMeal): string {
  switch (meal.mealType) {
    case "breakfast":
      return "1 breakfast serving";
    case "lunch":
      return "1 lunch plate";
    case "dinner":
      return "1 dinner bowl";
    case "snack":
      return "1 snack portion";
    default:
      return "1 serving";
  }
}

function inferClinicalMicros(meal: DietMeal): Partial<DietNutritionPerServing> {
  const tags = meal.nutrients.join(" ").toLowerCase();
  const ings = meal.ingredients.join(" ").toLowerCase();
  const micro: Partial<DietNutritionPerServing> = {};

  if (/iodine|iodiz|kelp|sardine|salt/.test(tags + ings)) micro.iodineMcg = micro.iodineMcg ?? 25;
  if (/selenium|brazil/.test(tags + ings)) micro.seleniumMcg = micro.seleniumMcg ?? 35;
  if (/zinc|lentil|dal|scallop/.test(tags + ings)) micro.zincMg = micro.zincMg ?? 2;
  if (/iron|ragi|spinach|lentil/.test(tags + ings)) micro.ironMg = micro.ironMg ?? 3;
  if (/vitamin d|d3|sardine|salmon|egg/.test(tags + ings)) micro.vitaminDMcg = micro.vitaminDMcg ?? 6;
  if (/magnesium|quinoa|bajra|millet|spinach/.test(tags + ings)) micro.magnesiumMg = micro.magnesiumMg ?? 55;

  if (meal.mealType === "breakfast" && /oat/.test(ings)) {
    micro.iodineMcg = 40;
  }

  return micro;
}

function estimateFromCalories(meal: DietMeal): DietNutritionPerServing {
  const cal = meal.calories;
  const { p, c, f } = macroSplit(meal.mealType);
  const proteinG = Math.round((cal * p) / 4);
  const carbsG = Math.round((cal * c) / 4);
  const fatG = Math.round((cal * f) / 9);
  const fiberG = meal.type === "vegan" ? 9 : 5;
  const sugarG = meal.mealType === "snack" ? 8 : 5;
  const sodiumMg = meal.budget === "elite" ? 380 : meal.budget === "balanced" ? 320 : 260;
  const saturatedFatG = Math.round(fatG * 0.35 * 10) / 10;

  return {
    servingSize: defaultServingSize(meal),
    servings: meal.servings ?? 1,
    calories: cal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    sodiumMg,
    saturatedFatG,
    ...inferClinicalMicros(meal),
  };
}

function buildFromLibrary(meal: DietMeal): DietNutritionPerServing {
  const profile = LIBRARY_NUTRITION[meal.id];
  if (!profile) return estimateFromCalories(meal);

  const { calories: _omit, ...rest } = profile;
  return {
    calories: meal.calories,
    ...rest,
    servings: profile.servings ?? 1,
  };
}

export function getMealNutrition(meal: DietMeal): DietNutritionPerServing {
  if (meal.nutritionPerServing) {
    return {
      ...meal.nutritionPerServing,
      calories: meal.nutritionPerServing.calories ?? meal.calories,
    };
  }
  if (LIBRARY_NUTRITION[meal.id]) return buildFromLibrary(meal);
  return estimateFromCalories(meal);
}

export function enrichMealNutrition(meal: DietMeal): DietMeal {
  const nutrition = getMealNutrition(meal);
  return {
    ...meal,
    servings: meal.servings ?? nutrition.servings,
    calories: meal.calories || nutrition.calories,
    nutritionPerServing: nutrition,
  };
}

export type ClinicalMicroKey =
  | "iodineMcg"
  | "seleniumMcg"
  | "zincMg"
  | "ironMg"
  | "vitaminDMcg"
  | "magnesiumMg";

export const CLINICAL_MICRO_LABELS: Record<ClinicalMicroKey, { label: string; unit: string; daily: number }> = {
  iodineMcg: { label: "Iodine", unit: "mcg", daily: DAILY_VALUES.iodineMcg },
  seleniumMcg: { label: "Selenium", unit: "mcg", daily: DAILY_VALUES.seleniumMcg },
  zincMg: { label: "Zinc", unit: "mg", daily: DAILY_VALUES.zincMg },
  ironMg: { label: "Iron", unit: "mg", daily: DAILY_VALUES.ironMg },
  vitaminDMcg: { label: "Vitamin D", unit: "mcg", daily: DAILY_VALUES.vitaminDMcg },
  magnesiumMg: { label: "Magnesium", unit: "mg", daily: DAILY_VALUES.magnesiumMg },
};

export function listClinicalMicros(n: DietNutritionPerServing): { key: ClinicalMicroKey; value: number; pct: number | null }[] {
  return (Object.keys(CLINICAL_MICRO_LABELS) as ClinicalMicroKey[])
    .map((key) => {
      const value = n[key];
      if (value == null) return null;
      return {
        key,
        value,
        pct: pctDaily(value, CLINICAL_MICRO_LABELS[key].daily),
      };
    })
    .filter((x): x is { key: ClinicalMicroKey; value: number; pct: number | null } => x != null);
}
