import type { ResolveMealMediaInput } from "@/server/diet/resolve-meal-media";
import { resolveMealImage } from "@/server/diet/resolve-meal-media";

/** @deprecated Prefer /api/diet/meal-media — kept for backward compatibility. */
export async function searchMealHeroImage(input: {
  mealId?: string;
  mealName: string;
  ingredients: string[];
}): Promise<{ imageUrl: string | null; source: string }> {
  const imageUrl = await resolveMealImage(input as ResolveMealMediaInput);
  return { imageUrl, source: imageUrl ? "resolved" : "none" };
}
