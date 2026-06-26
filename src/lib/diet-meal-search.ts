/** Strip clinical / marketing words so web & YouTube search match real dish names. */
const NOISE_WORDS =
  /\b(iodized|clinical|lactose[- ]free|thyroid[- ]friendly|metabolic|recovery|wild|steamed|poached|roasted|grilled|baked|pan[- ]seared|dhaba|style|bowl|stew|salad|skewers?|crust|crusted)\b/gi;

export function simplifyMealSearchName(mealName: string, ingredients: string[] = []): string {
  const cleaned = mealName
    .replace(/\s*·\s*(breakfast|lunch|dinner|snack)\s*$/i, "")
    .replace(/\band\b/gi, " ")
    .replace(/&/g, " ")
    .replace(NOISE_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length >= 4) return cleaned;

  return ingredients
    .slice(0, 2)
    .map((i) => i.replace(NOISE_WORDS, "").replace(/\band\b/gi, " ").trim())
    .filter(Boolean)
    .join(" ");
}

export function mealSearchQueries(mealName: string, ingredients: string[]): string[] {
  const simple = simplifyMealSearchName(mealName, ingredients);
  const primary = ingredients[0]?.replace(NOISE_WORDS, "").trim();
  const queries = [simple, primary, `${simple} recipe`, primary ? `${primary} recipe` : ""].filter(
    Boolean,
  );
  return [...new Set(queries)].slice(0, 4);
}

export function scoreMealNameMatch(candidate: string, target: string): number {
  const a = tokenize(candidate);
  const b = tokenize(target);
  if (!a.length || !b.length) return 0;
  let score = 0;
  for (const token of b) {
    if (a.some((t) => t.includes(token) || token.includes(t))) score += 10;
  }
  return score;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}
