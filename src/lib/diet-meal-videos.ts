import type { DietAiSearchInput, DietLanguage } from "@/lib/diet-ai-types";
import type { DietMeal, DietYoutubeVideo } from "@/lib/diet-mock-data";
import { fetchMealMedia } from "@/lib/diet-meal-media-client";

/** Attach YouTube tutorials only after clinical foods are resolved — never from the user's chat text. */
export async function attachYoutubeVideosForMeal(
  meal: DietMeal,
  language: DietLanguage,
  cuisine: DietAiSearchInput["cuisine"] = "all",
): Promise<DietMeal> {
  const media = await fetchMealMedia({
    mealId: meal.id,
    mealName: meal.name,
    ingredients: meal.ingredients,
    language,
    cuisine: meal.cuisine === "indian" ? "indian" : cuisine,
  });

  return { ...meal, imageUrl: media.imageUrl ?? meal.imageUrl, youtubeVideos: media.videos };
}

export function describeSelectedFoods(meal: DietMeal): string {
  return meal.ingredients.map((i) => `• ${i}`).join("\n");
}
