import type { DietLanguage } from "@/lib/diet-ai-types";

const KEY = "medora-diet-video-language-v1";
export const DIET_LANGUAGE_EVENT = "medora-diet-language-changed";

export function getDietVideoLanguage(): DietLanguage {
  if (typeof localStorage === "undefined") return "en";
  const stored = localStorage.getItem(KEY);
  if (stored === "en" || stored === "hi" || stored === "ta" || stored === "te") return stored;
  return "en";
}

export function setDietVideoLanguage(lang: DietLanguage) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, lang);
    window.dispatchEvent(new CustomEvent(DIET_LANGUAGE_EVENT));
  }
}
