import type { DietLanguage } from "@/lib/diet-ai-types";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import {
  mealSearchQueries,
  scoreMealNameMatch,
  simplifyMealSearchName,
} from "@/lib/diet-meal-search";
import { primaryIngredientTokens } from "@/lib/diet-meal-fingerprint";

type MealDbSearchHit = {
  idMeal?: string;
  strMeal?: string;
  strMealThumb?: string;
};

type MealDbLookup = {
  strMeal?: string;
  strMealThumb?: string;
  strYoutube?: string;
};

export type DynamicMealMedia = {
  imageUrl: string | null;
  videos: DietYoutubeVideo[];
  source: string;
};

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function parseYoutubeVideoId(url: string | undefined | null): string | null {
  if (!url) return null;
  const m = url.match(YOUTUBE_ID_RE);
  return m?.[1] ?? null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function lookupMealDb(idMeal: string): Promise<MealDbLookup | null> {
  const json = await fetchJson<{ meals?: MealDbLookup[] | null }>(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(idMeal)}`,
  );
  return json?.meals?.[0] ?? null;
}

async function searchMealDbByName(query: string): Promise<MealDbSearchHit[]> {
  const json = await fetchJson<{ meals?: MealDbSearchHit[] | null }>(
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
  );
  return json?.meals ?? [];
}

async function filterMealDbByIngredient(ingredient: string): Promise<MealDbSearchHit[]> {
  const json = await fetchJson<{ meals?: MealDbSearchHit[] | null }>(
    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`,
  );
  return json?.meals ?? [];
}

function toVideo(
  videoId: string,
  title: string,
  channel: string,
  language: DietLanguage,
  thumb?: string,
): DietYoutubeVideo {
  return {
    videoId,
    title,
    channel,
    language,
    thumbnailUrl: thumb ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

/** Free dynamic lookup — works for any dish name / ingredients (no YouTube API quota). */
export async function searchDynamicMealMedia(
  mealName: string,
  ingredients: string[],
  language: DietLanguage = "en",
): Promise<DynamicMealMedia | null> {
  const target = simplifyMealSearchName(mealName, ingredients);
  const candidates: { hit: MealDbSearchHit; score: number }[] = [];
  const seenIds = new Set<string>();

  const addHits = (hits: MealDbSearchHit[], bonus = 0) => {
    for (const hit of hits) {
      if (!hit.idMeal || seenIds.has(hit.idMeal)) continue;
      seenIds.add(hit.idMeal);
      const score = scoreMealNameMatch(hit.strMeal ?? "", target) + bonus;
      if (score > 0 || bonus > 0) candidates.push({ hit, score });
    }
  };

  for (const query of mealSearchQueries(mealName, ingredients)) {
    addHits(await searchMealDbByName(query), 5);
  }

  for (const token of primaryIngredientTokens(ingredients)) {
    addHits(await filterMealDbByIngredient(token), 2);
  }

  candidates.sort((a, b) => b.score - a.score);

  const videos: DietYoutubeVideo[] = [];
  let imageUrl: string | null = null;

  for (const { hit } of candidates.slice(0, 5)) {
    if (!hit.idMeal) continue;
    const detail = await lookupMealDb(hit.idMeal);
    if (!detail) continue;

    if (!imageUrl && detail.strMealThumb) {
      imageUrl = detail.strMealThumb;
    }

    const videoId = parseYoutubeVideoId(detail.strYoutube);
    if (videoId && !videos.some((v) => v.videoId === videoId)) {
      videos.push(
        toVideo(
          videoId,
          detail.strMeal ?? hit.strMeal ?? mealName,
          "TheMealDB",
          language,
          detail.strMealThumb,
        ),
      );
    }

    if (imageUrl && videos.length >= 2) break;
  }

  if (!imageUrl && !videos.length) return null;

  if (!imageUrl && videos[0]?.thumbnailUrl) {
    imageUrl = videos[0].thumbnailUrl;
  }

  return {
    imageUrl,
    videos: videos.slice(0, 3),
    source: videos.length ? "themealdb+youtube" : "themealdb",
  };
}
