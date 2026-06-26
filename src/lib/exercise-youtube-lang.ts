import type { DietLanguage } from "@/lib/diet-ai-types";
import { LANG_SEARCH } from "@/lib/diet-youtube-lang";

const EXERCISE_I18N: Record<DietLanguage, { beginner: string; explained: string; short: string }> = {
  en: { beginner: "beginner", explained: "explained easy", short: "short" },
  hi: { beginner: "शुरुआती", explained: "आसान समझाएं", short: "छोटा" },
  ta: { beginner: "தொடக்கநிலை", explained: "விளக்கம்", short: "குறுகிய" },
  te: { beginner: "ప్రారంభకులు", explained: "వివరణ", short: "చిన్న" },
};

export function buildExerciseYoutubeQueries(
  routineName: string,
  keywords: string[],
  language: DietLanguage,
): string[] {
  const i18n = EXERCISE_I18N[language];
  const cfg = LANG_SEARCH[language];
  const base = keywords[0] ?? routineName;

  const queries = [
    `${base} ${i18n.beginner} ${i18n.explained} ${i18n.short}`,
    `${routineName} ${cfg.recipeTerms[0] ?? ""} ${i18n.beginner} tutorial`,
    keywords[1] ? `${keywords[1]} ${i18n.explained}` : `${routineName} gentle exercise tutorial`,
  ];

  return [...new Set(queries.map((q) => q.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, 4);
}
