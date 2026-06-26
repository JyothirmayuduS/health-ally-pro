import { simplifyMealSearchName } from "@/lib/diet-meal-search";

/** Stable cache key for any meal — built-in or AI-generated. */
export function mealMediaFingerprint(mealName: string, ingredients: string[]): string {
  const name = simplifyMealSearchName(mealName, ingredients).toLowerCase().trim();
  const ings = ingredients
    .map((i) =>
      i
        .toLowerCase()
        .replace(/\([^)]*\)/g, "")
        .replace(/[^a-z0-9\u0900-\u097F]+/gi, " ")
        .trim(),
    )
    .filter(Boolean)
    .sort()
    .join("|");
  return `${name}::${ings}`;
}

export function primaryIngredientTokens(ingredients: string[]): string[] {
  const tokens = new Set<string>();
  for (const raw of ingredients.slice(0, 4)) {
    const base = raw
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .trim()
      .split(/[\s,/]+/)[0]
      ?.replace(/[^a-z]/g, "");
    if (base && base.length > 2) tokens.add(base);
  }
  return [...tokens];
}
