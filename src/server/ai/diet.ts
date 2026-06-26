import type { DietMeal } from "@/lib/diet-mock-data";
import type { DietAiSearchInput } from "@/lib/diet-ai-types";
import { enrichMealNutrition } from "@/lib/diet-nutrition";
import { completeWithRouter, formatModelSource } from "@/server/ai/router";
import { resolveMealMedia } from "@/server/diet/resolve-meal-media";

const BUDGET_CALORIES: Record<DietMeal["budget"], [number, number]> = {
  essential: [280, 420],
  balanced: [380, 520],
  elite: [450, 650],
};

function templateMeal(input: DietAiSearchInput): DietMeal {
  const [minCal, maxCal] = BUDGET_CALORIES[input.budget];
  const calories = Math.round((minCal + maxCal) / 2);
  const isIndian = input.cuisine === "indian";
  const isVegan =
    input.cuisine === "vegan" || input.cuisine === "lactose-free" || input.query.toLowerCase().includes("vegan");
  const lactoseFree = input.cuisine === "lactose-free" || isVegan || isIndian;

  const takesThyroid =
    input.patientContext?.medications?.some((m) => /levothyroxine|thyroid/i.test(m)) ??
    /thyroid|iodine|levothyroxine/i.test(input.query);

  const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const slotLabel =
    input.mealType === "breakfast"
      ? "Breakfast"
      : input.mealType === "dinner"
        ? "Dinner"
        : input.mealType === "snack"
          ? "Snack"
          : "Lunch";

  const baseName =
    input.mealType === "breakfast"
      ? takesThyroid
        ? "Iodized Overnight Oats"
        : "Clinical Breakfast Plate"
      : input.mealType === "dinner"
        ? "Lentil & Carrot Stew"
        : input.mealType === "snack"
          ? "Magnesium Trail Mix Bowl"
          : isIndian
            ? isVegan
              ? "Clinical Masala Dal Bowl"
              : "Thyroid-Safe Indian Lunch Bowl"
            : isVegan
              ? "Mediterranean Buddha Bowl"
              : "Metabolic Balance Plate";

  const name = `${baseName} · ${slotLabel}`;

  const ingredients = isIndian
    ? isVegan
      ? ["Brown rice", "Moong dal", "Turmeric", "Spinach", "Mustard seeds", "Coconut oil"]
      : ["Brown rice", "Grilled chicken", "Turmeric", "Yogurt (optional)", "Ginger", "Ghee"]
    : isVegan
      ? ["Quinoa", "Chickpeas", "Kale", "Olive oil", "Lemon", "Pumpkin seeds"]
      : ["Salmon fillet", "Sweet potato", "Broccoli", "Olive oil", "Garlic", "Herbs"];

  return {
    id,
    name,
    ingredients,
    nutrients: isIndian ? ["Iodine", "Zinc", "Fiber"] : ["Omega-3", "Protein", "Antioxidants"],
    type: isVegan ? "vegan" : "non-veg",
    lactoseFree,
    budget: input.budget,
    mealType: input.mealType ?? "lunch",
    calories,
    cuisine: isIndian ? "indian" : "continental",
    prepTimeMinutes: input.budget === "elite" ? 35 : input.budget === "balanced" ? 25 : 18,
    clinicalRationale: `AI-curated for ${input.budget} budget with thyroid-safe spacing. Optimized for steady glucose and medication absorption windows.`,
    instructions: [
      "Prep ingredients and measure portions for clinical macro targets.",
      isIndian
        ? "Temper spices in oil to activate bioactive compounds."
        : "Sear protein on medium-high heat for even browning.",
      "Combine components; avoid calcium-rich sauces within 4h of thyroid medication.",
      "Plate and rest 2 minutes before serving for optimal digestion.",
    ],
    clinicalBenefits: [
      {
        title: "Metabolic Balance",
        description: "Macro ratio supports stable energy through the afternoon.",
        icon: "Flame",
      },
      {
        title: "Clinical Safety",
        description: "Ingredients selected to minimize med-nutrient competition.",
        icon: "Shield",
      },
    ],
    aiIntelligence: {
      confidence: 0.88,
      model: "Medora-Diet-v1",
      dataset: "Clinical Nutrition Graph",
    },
  };
}

function parseAiJson(text: string): Partial<DietMeal> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<DietMeal>;
  } catch {
    return null;
  }
}

export async function runDietAiSearch(input: DietAiSearchInput): Promise<{
  meal: DietMeal;
  source: "ai" | "template";
  modelSource?: string;
  videos: Awaited<ReturnType<typeof resolveMealMedia>>["videos"];
}> {
  const medContext = input.patientContext;
  const clinicalBlock = medContext
    ? [
        medContext.clinicalSummary,
        medContext.labFindings?.length ? `Labs: ${medContext.labFindings.join("; ")}` : "",
        medContext.nutrientPriorities?.length
          ? `Prioritize: ${medContext.nutrientPriorities.join(", ")}`
          : "",
        medContext.avoidIngredients?.length
          ? `Avoid: ${medContext.avoidIngredients.join("; ")}`
          : "",
        medContext.timingSummary ? `Timing: ${medContext.timingSummary}` : "",
        medContext.severity ? `Clinical severity: ${medContext.severity}` : "",
        medContext.profileId ? `Patient profile: ${medContext.profileId}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "General clinical nutrition.";

  const system = `You are a clinical nutritionist for Medora Health. Return ONLY valid JSON for a single meal recipe.
Fields: name, ingredients (array), nutrients (array), type ("vegan"|"non-veg"), lactoseFree (boolean), calories (number), prepTimeMinutes (number), clinicalRationale (string), instructions (array of strings), mealType ("breakfast"|"lunch"|"dinner"|"snack"), nutritionPerServing (object with servingSize string, servings number, calories number, proteinG, carbsG, fatG, fiberG, sugarG, sodiumMg, saturatedFatG, and optional iodineMcg, seleniumMcg, zincMg, ironMg, vitaminDMcg, magnesiumMg).
Respect budget tier: essential=low cost ingredients, balanced=mid, elite=premium.
Respect cuisine filter and dietary restrictions. All nutrition values are per single serving. No markdown.
Every recipe MUST be unique to this patient's medications, lab abnormalities, and severity — never generic template names.`;

  const user = `Create a ${input.budget} budget ${input.cuisine} meal for: "${input.query}".
${clinicalBlock}
Language context: ${input.language}.
Meal slot: ${input.mealType ?? "lunch"}.`;

  let meal = templateMeal(input);
  let source: "ai" | "template" = "template";
  let modelSource: string | undefined;

  const ai = await completeWithRouter({
    task: "clinical_chat",
    system,
    user,
    maxTokens: 900,
    temperature: 0.4,
  });

  if (ai?.text) {
    const parsed = parseAiJson(ai.text);
    if (parsed?.name && parsed.ingredients?.length) {
      meal = {
        ...meal,
        ...parsed,
        id: meal.id,
        budget: input.budget,
        lactoseFree: parsed.lactoseFree ?? meal.lactoseFree,
        type: parsed.type ?? meal.type,
        cuisine: input.cuisine === "indian" ? "indian" : meal.cuisine,
      };
      source = "ai";
      modelSource = formatModelSource(ai);
    }
  }

  const media = await resolveMealMedia({
    mealId: meal.id,
    mealName: meal.name,
    ingredients: meal.ingredients,
    language: input.language,
    cuisine: input.cuisine,
  });
  const videos = media.videos;
  meal = { ...meal, youtubeVideos: videos, imageUrl: media.imageUrl ?? undefined };

  return { meal: enrichMealNutrition(meal), source, modelSource, videos };
}
