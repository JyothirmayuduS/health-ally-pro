import type { DietMeal, DietYoutubeVideo } from "@/lib/diet-mock-data";

export type DietBudget = DietMeal["budget"];
export type DietCuisineFilter = "all" | "indian" | "vegan" | "non-veg" | "lactose-free";
export type DietLanguage = "en" | "hi" | "ta" | "te";

export type DietAiSearchInput = {
  query: string;
  budget: DietBudget;
  cuisine: DietCuisineFilter;
  language: DietLanguage;
  mealType?: DietMeal["mealType"];
  patientContext?: {
    profileId?: string;
    severity?: "stable" | "moderate" | "high";
    medications: string[];
    restrictions: string[];
    conditions: string[];
    labFindings?: string[];
    nutrientPriorities?: string[];
    avoidIngredients?: string[];
    clinicalSummary?: string;
    timingSummary?: string;
  };
};

export type DietAiSearchResult = {
  meal: DietMeal;
  source: "ai" | "template";
  modelSource?: string;
  videos: DietYoutubeVideo[];
};

export const BUDGET_LABELS: Record<DietBudget, { label: string; subtitle: string }> = {
  essential: { label: "Essential", subtitle: "Low budget" },
  balanced: { label: "Balanced", subtitle: "Mid budget" },
  elite: { label: "Elite", subtitle: "Premium" },
};

export const DIET_LANGUAGE_LABELS: Record<DietLanguage, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
};
