import type { DietAiSearchInput, DietLanguage } from "@/lib/diet-ai-types";
import type { DietMeal } from "@/lib/diet-mock-data";
import { formatMacroSummary, getMealNutrition } from "@/lib/diet-nutrition";

export type RecipeIntentContext = {
  medNames: string[];
  takesThyroidMeds: boolean;
  needsLactoseFree: boolean;
  restrictions: string[];
};

const VAGUE_PATTERNS = [
  /^(which|what|best|good|suggest|recommend|help|need|want|give|show)\b/i,
  /^(breakfast|lunch|dinner|snack)\s*recipes?$/i,
  /for my med/i,
  /food to cure/i,
  /suggestions for/i,
  /whatever/i,
  /\?$/,
];

export function isVagueRecipeQuery(query: string): boolean {
  const q = query.trim();
  if (q.length < 4) return true;
  return VAGUE_PATTERNS.some((p) => p.test(q));
}

export function wantsRecipeSuggestion(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /recipe|cook|make|prepare|suggest|meal|breakfast|lunch|dinner|snack|food|eat|best|recommend|cure|which/.test(
      lower,
    ) && !/^how (do|should) i take/.test(lower)
  );
}

export function wantsMedicationRulesOnly(text: string): boolean {
  const lower = text.toLowerCase();
  const mentionsMeds = /med|medication|levothyroxine|thyroid|pill/.test(lower);
  const wantsFood =
    /recipe|cook|make|prepare|food|meal|breakfast|lunch|dinner|eat|best|cure|suggest/.test(
      lower,
    );
  return mentionsMeds && !wantsFood;
}

export function inferMealTypeFromText(text: string): DietMeal["mealType"] | undefined {
  const lower = text.toLowerCase();
  if (/breakfast|morning|oats/.test(lower)) return "breakfast";
  if (/lunch|midday|noon/.test(lower)) return "lunch";
  if (/dinner|evening|night/.test(lower)) return "dinner";
  if (/snack/.test(lower)) return "snack";
  return undefined;
}

/** Turn chat text into a clinical search query — never pass raw vague text as a dish name. */
export function resolveSemanticQuery(text: string, ctx: RecipeIntentContext): string {
  const lower = text.toLowerCase().trim();
  const mealType = inferMealTypeFromText(text);

  if (ctx.takesThyroidMeds) {
    if (mealType === "breakfast" || /breakfast/.test(lower)) {
      return "iodized overnight oats thyroid safe breakfast";
    }
    if (mealType === "lunch" || /lunch/.test(lower)) {
      return "thyroid safe lunch dal sardine iodine zinc indian";
    }
    if (mealType === "dinner" || /dinner/.test(lower)) {
      return "thyroid safe dinner lentil zinc turmeric";
    }
    if (
      /med|medicine|pill|thyroid|best|suggest|cure|good|which|recommend/.test(lower)
    ) {
      return "levothyroxine medication safe meal iodine selenium zinc lactose free";
    }
  }

  if (mealType === "breakfast") return "healthy clinical breakfast protein";
  if (mealType === "lunch") return "balanced clinical lunch indian";
  if (mealType === "dinner") return "light clinical dinner vegetables";
  if (/indian|dal|masala|curry/.test(lower)) return "indian clinical healthy recipe";
  if (/vegan|plant/.test(lower)) return "vegan clinical balanced meal";

  if (isVagueRecipeQuery(text)) {
    return ctx.takesThyroidMeds
      ? "thyroid safe clinical nutrition meal"
      : "balanced clinical healthy meal";
  }

  return text.trim();
}

export function resolveRecipeInput(
  text: string,
  preferredLanguage: DietLanguage,
  ctx: RecipeIntentContext,
): DietAiSearchInput {
  const lower = text.toLowerCase();
  let cuisine: DietAiSearchInput["cuisine"] = "all";
  if (/indian|dal|masala|curry|dosa|idli/.test(lower)) cuisine = "indian";
  else if (/vegan|plant/.test(lower)) cuisine = "vegan";
  else if (/non-veg|chicken|fish|meat|egg/.test(lower)) cuisine = "non-veg";
  else if (/lactose/.test(lower)) cuisine = "lactose-free";
  else if (ctx.takesThyroidMeds && ctx.needsLactoseFree) cuisine = "lactose-free";

  let budget: DietAiSearchInput["budget"] = "balanced";
  if (/budget|cheap|essential|low/.test(lower)) budget = "essential";
  if (/premium|elite|expensive/.test(lower)) budget = "elite";

  let language: DietLanguage = preferredLanguage;
  if (/hindi|हिंदी/.test(lower)) language = "hi";
  if (/tamil|தமிழ்/.test(lower)) language = "ta";
  if (/telugu|తెలుగు/.test(lower)) language = "te";

  const mealType = inferMealTypeFromText(text) ?? "lunch";
  const semanticQuery = resolveSemanticQuery(text, ctx);

  return {
    query: semanticQuery,
    budget,
    cuisine,
    language,
    mealType,
  };
}

export function isBadGeneratedMealName(name: string, userText: string): boolean {
  const n = name.trim().toLowerCase();
  const u = userText.trim().toLowerCase();
  if (!n) return true;
  if (n === u) return true;
  if (isVagueRecipeQuery(name)) return true;
  if (/^which is|^what is|^best food|^breakfast recipes$/i.test(n)) return true;
  return false;
}

export function formatMealNutritionBlock(meal: DietMeal): string {
  const n = getMealNutrition(meal);
  const microLines: string[] = [];
  if (n.iodineMcg) microLines.push(`Iodine ${n.iodineMcg} mcg`);
  if (n.seleniumMcg) microLines.push(`Selenium ${n.seleniumMcg} mcg`);
  if (n.zincMg) microLines.push(`Zinc ${n.zincMg} mg`);
  if (n.ironMg) microLines.push(`Iron ${n.ironMg} mg`);
  if (n.fiberG) microLines.push(`Fiber ${n.fiberG} g`);

  const lines = [
    `**Nutrition per serving** (${n.servingSize})`,
    `• ${n.calories} kcal · ${formatMacroSummary(n)}`,
    `• Fiber ${n.fiberG}g · Sodium ${n.sodiumMg}mg · Sugar ${n.sugarG}g`,
    microLines.length ? `• Clinical micros: ${microLines.join(" · ")}` : null,
    `• Prep time: ${meal.prepTimeMinutes ?? 25} min · Slot: ${meal.mealType}`,
    `• Type: ${meal.type === "vegan" ? "Vegan" : "Non-vegetarian"}${meal.lactoseFree ? " · Lactose-free" : ""}`,
    `• Key nutrients: ${meal.nutrients.join(", ")}`,
  ].filter((l): l is string => !!l);
  return lines.join("\n");
}

export function formatMealProcedureBlock(meal: DietMeal): string {
  const ingredients = meal.ingredients.map((i) => `• ${i}`).join("\n");
  const steps =
    meal.instructions?.map((s, i) => `${i + 1}. ${s}`).join("\n") ??
    "See full recipe for preparation steps.";

  return [`**Ingredients**`, ingredients, ``, `**Preparation**`, steps].join("\n");
}

export function formatMealClinicalBlock(meal: DietMeal, ctx: RecipeIntentContext): string {
  const lines = [
    `**Clinical analysis**`,
    meal.clinicalRationale ?? "Optimized for your metabolic profile.",
  ];

  if (meal.protocol) {
    lines.push(
      ``,
      `**Medication timing:** ${meal.protocol.medGap} gap after thyroid dose`,
      ...meal.protocol.caution.map((c) => `• ${c}`),
    );
  }

  if (ctx.medNames.length) {
    lines.push(``, `**Synced to:** ${ctx.medNames.join(", ")}`);
  }

  return lines.join("\n");
}

export function formatChefMealReply(meal: DietMeal, ctx: RecipeIntentContext, language: DietLanguage): string {
  const langLabel =
    language === "en"
      ? "English"
      : language === "hi"
        ? "Hindi"
        : language === "ta"
          ? "Tamil"
          : "Telugu";

  const videoNote = meal.youtubeVideos?.length
    ? `\n\n**Videos:** ${meal.youtubeVideos.length} tutorial${meal.youtubeVideos.length > 1 ? "s" : ""} for these foods in ${langLabel}.`
    : "";

  return [
    `**${meal.name}**`,
    ``,
    `**AI-selected from your clinical basket**`,
    meal.ingredients.map((i) => `• ${i}`).join("\n"),
    ``,
    formatMealNutritionBlock(meal),
    ``,
    formatMealClinicalBlock(meal, ctx),
    ``,
    formatMealProcedureBlock(meal),
    videoNote,
    ``,
    `Tap the recipe card for the full breakdown and video tutorials.`,
  ].join("\n");
}
