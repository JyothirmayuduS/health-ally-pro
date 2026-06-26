import {
  getMedicationAwareSuggestions,
  getPatientDietContext,
  runDietAiSearch,
  suggestLibraryMeals,
} from "@/lib/diet-ai-client";
import type { DietLanguage } from "@/lib/diet-ai-types";
import {
  formatChefMealReply,
  resolveRecipeInput,
  wantsMedicationRulesOnly,
  wantsRecipeSuggestion,
} from "@/lib/diet-recipe-intent";
import { formatMacroSummary, getMealNutrition } from "@/lib/diet-nutrition";
import { saveAiDietMeal } from "@/lib/diet-store";

export function getChefSuggestionChips(): string[] {
  const ctx = getPatientDietContext();
  return [
    "Suggestions for my meds",
    "Thyroid-safe breakfast",
    "Indian vegan lunch",
    "Lactose-free dinner",
    ...getMedicationAwareSuggestions(ctx).slice(0, 2),
  ];
}

export async function buildChefAssistantReply(
  userText: string,
  preferredLanguage: DietLanguage,
): Promise<{
  content: string;
  mealId?: string;
  mealName?: string;
}> {
  const ctx = getPatientDietContext();
  const lower = userText.toLowerCase();

  if (wantsMedicationRulesOnly(userText)) {
    const topMeals = suggestLibraryMeals(
      resolveRecipeInput("thyroid safe lunch", preferredLanguage, ctx),
      ctx,
      2,
    );

    const mealIdeas =
      topMeals.length > 0
        ? `\n\n**Top picks for your profile:**\n${topMeals.map((m) => `• ${m.name} (${m.calories} kcal, ${m.mealType})`).join("\n")}\n\nAsk for any of these by name for the full recipe, nutrition, and videos.`
        : "";

    const lines = [
      `Based on your medications (${ctx.medNames.join(", ")}), here are clinical meal rules:`,
      ...ctx.restrictions.map((r) => `• ${r}`),
      ctx.timingNotes.length
        ? `\nTiming: ${ctx.timingNotes.slice(0, 2).join(" · ")}`
        : "",
      mealIdeas,
    ];
    return { content: lines.filter(Boolean).join("\n") };
  }

  if (wantsRecipeSuggestion(userText) || /suggestions for my meds/i.test(lower)) {
    const input = resolveRecipeInput(userText, preferredLanguage, ctx);
    const result = await runDietAiSearch(input);
    const meal = result.meal;

    saveAiDietMeal(meal);

    return {
      content: formatChefMealReply(meal, ctx, input.language),
      mealId: meal.id,
      mealName: meal.name,
    };
  }

  return {
    content:
      "I can suggest clinical-grade recipes synced to your medications, with full nutrition, prep steps, and YouTube tutorials in English, Hindi, Tamil, or Telugu.\n\nTry: “Suggestions for my meds”, “Thyroid-safe breakfast”, or “Indian vegan lunch”.",
  };
}
