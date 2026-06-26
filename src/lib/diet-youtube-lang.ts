import type { DietLanguage } from "@/lib/diet-ai-types";
import { simplifyMealSearchName } from "@/lib/diet-meal-search";

export type LangSearchConfig = {
  /** Appended to food-based queries */
  recipeTerms: string[];
  regionCode: string;
  hl: string;
};

export const LANG_SEARCH: Record<DietLanguage, LangSearchConfig> = {
  en: {
    recipeTerms: ["recipe", "healthy breakfast", "cooking tutorial"],
    regionCode: "US",
    hl: "en",
  },
  hi: {
    recipeTerms: ["रेसिपी", "हिंदी में", "healthy recipe hindi"],
    regionCode: "IN",
    hl: "hi",
  },
  ta: {
    recipeTerms: ["சமையல்", "recipe tamil", "தமிழ்"],
    regionCode: "IN",
    hl: "ta",
  },
  te: {
    recipeTerms: ["వంట", "recipe telugu", "తెలుగు"],
    regionCode: "IN",
    hl: "te",
  },
};

/** Common clinical ingredients → language-specific search tokens */
const INGREDIENT_I18N: Record<string, Partial<Record<DietLanguage, string>>> = {
  oats: { hi: "ओट्स", ta: "ஓட்ஸ்", te: "ఓట్స్" },
  dal: { hi: "दाल", ta: "பருப்பு", te: "పప్పు" },
  lentil: { hi: "दाल", ta: "பருப்பு", te: "పప్పు" },
  rice: { hi: "चावल", ta: "அரிசி", te: "బియ్యం" },
  chicken: { hi: "चिकन", ta: "கோழி", te: "చికెన్" },
  fish: { hi: "मछली", ta: "மீன்", te: "చేప" },
  flaxseed: { hi: "अलसी", ta: "ஆளி விதை", te: "అవిసె గింజలు" },
  turmeric: { hi: "हल्दी", ta: "மஞ்சள்", te: "పసుపు" },
  spinach: { hi: "पालक", ta: "கீரை", te: "పాలకూర" },
};

export function translateIngredientToken(ingredient: string, language: DietLanguage): string {
  if (language === "en") return ingredient;
  const key = ingredient.toLowerCase().split(/\s+/)[0];
  for (const [token, map] of Object.entries(INGREDIENT_I18N)) {
    if (key.includes(token) && map[language]) return map[language]!;
  }
  return ingredient;
}

export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

export function hasTamil(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

export function hasTelugu(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

export function hasGujarati(text: string): boolean {
  return /[\u0A80-\u0AFF]/.test(text);
}

/** Reject videos that don't match the requested tutorial language */
export function videoMatchesLanguage(title: string, language: DietLanguage): boolean {
  const t = title.toLowerCase();

  if (language === "hi") {
    return (
      hasDevanagari(title) ||
      /\bhindi\b|हिंदी|हिन्दी/i.test(t)
    );
  }

  if (language === "ta") {
    return hasTamil(title) || /\btamil\b|தமிழ்/.test(t);
  }

  if (language === "te") {
    return hasTelugu(title) || /\btelugu\b|తెలుగు/.test(t);
  }

  // English: exclude Indic-script dominant titles
  return (
    !hasDevanagari(title) &&
    !hasTamil(title) &&
    !hasTelugu(title) &&
    !hasGujarati(title)
  );
}

export function buildFoodBasedYoutubeQueries(
  mealName: string,
  ingredients: string[],
  language: DietLanguage,
): string[] {
  const cfg = LANG_SEARCH[language];
  const simpleName = simplifyMealSearchName(mealName, ingredients);
  const translatedIngredients = ingredients
    .slice(0, 3)
    .map((i) => translateIngredientToken(i, language));

  const foodCore = [simpleName, ...translatedIngredients].filter(Boolean).join(" ");
  const queries: string[] = [];

  for (const term of cfg.recipeTerms) {
    queries.push(`${foodCore} ${term}`.trim());
  }

  const primary = translatedIngredients[0];
  if (primary) {
    queries.push(`${primary} ${cfg.recipeTerms[0]}`.trim());
  }

  if (language === "hi" && /oat/i.test(mealName + ingredients.join(" "))) {
    queries.push(`ओट्स रेसिपी हिंदी में`.trim());
  }
  if (language === "ta" && /oat/i.test(mealName + ingredients.join(" "))) {
    queries.push(`ஓட்ஸ் சமையல் தமிழ்`.trim());
  }
  if (language === "te" && /oat/i.test(mealName + ingredients.join(" "))) {
    queries.push(`ఓట్స్ వంట తెలుగు`.trim());
  }

  return [...new Set(queries)].slice(0, 5);
}
