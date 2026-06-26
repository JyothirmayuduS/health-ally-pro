import type { DietCuisineFilter, DietLanguage } from "@/lib/diet-ai-types";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import { mealMediaFingerprint } from "@/lib/diet-meal-fingerprint";

const STORAGE_KEY = "medora-diet-media-cache-v1";

type CachedEntry = {
  imageUrl: string | null;
  videos: DietYoutubeVideo[];
  source: string;
  savedAt: number;
};

type MediaCacheStore = Record<string, CachedEntry>;

function loadStore(): MediaCacheStore {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MediaCacheStore;
  } catch {
    return {};
  }
}

function saveStore(store: MediaCacheStore): void {
  if (typeof localStorage === "undefined") return;
  const keys = Object.keys(store);
  const trimmed =
    keys.length > 120
      ? Object.fromEntries(
          keys
            .sort((a, b) => (store[b].savedAt ?? 0) - (store[a].savedAt ?? 0))
            .slice(0, 120)
            .map((k) => [k, store[k]]),
        )
      : store;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function cacheKey(mealName: string, ingredients: string[], language: DietLanguage): string {
  return `${mealMediaFingerprint(mealName, ingredients)}::${language}`;
}

export function readCachedMealMedia(
  mealName: string,
  ingredients: string[],
  language: DietLanguage,
): CachedEntry | undefined {
  const key = cacheKey(mealName, ingredients, language);
  const entry = loadStore()[key];
  if (!entry) return undefined;
  if (Date.now() - entry.savedAt > 7 * 24 * 60 * 60 * 1000) return undefined;
  return entry;
}

export function writeCachedMealMedia(
  mealName: string,
  ingredients: string[],
  language: DietLanguage,
  data: Omit<CachedEntry, "savedAt">,
): void {
  const store = loadStore();
  const key = cacheKey(mealName, ingredients, language);
  store[key] = { ...data, savedAt: Date.now() };
  saveStore(store);
}

export type MealMediaRequest = {
  mealId?: string;
  mealName: string;
  ingredients: string[];
  language: DietLanguage;
  cuisine?: DietCuisineFilter;
};

export type MealMediaResult = {
  imageUrl: string | null;
  videos: DietYoutubeVideo[];
  source: string;
  fingerprint?: string;
};

/** Resolve image + videos for any meal — built-in, AI, or unlimited custom dishes. */
export async function fetchMealMedia(req: MealMediaRequest): Promise<MealMediaResult> {
  const cached = readCachedMealMedia(req.mealName, req.ingredients, req.language);
  if (cached?.videos?.length) {
    return {
      imageUrl: cached.imageUrl,
      videos: cached.videos,
      source: `${cached.source}+local`,
    };
  }

  if (!req.mealName?.trim() || !req.ingredients?.length) {
    return { imageUrl: null, videos: [], source: "none" };
  }

  try {
    const res = await fetch("/api/diet/meal-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      return { imageUrl: null, videos: [], source: "error" };
    }

    const data = (await res.json()) as MealMediaResult;
    if (data.videos?.length || data.imageUrl) {
      writeCachedMealMedia(req.mealName, req.ingredients, req.language, {
        imageUrl: data.imageUrl ?? null,
        videos: data.videos ?? [],
        source: data.source ?? "api",
      });
    }
    return data;
  } catch {
    return { imageUrl: null, videos: [], source: "error" };
  }
}

export async function fetchMealHeroImage(req: Omit<MealMediaRequest, "language"> & { language?: DietLanguage }): Promise<string | null> {
  const result = await fetchMealMedia({
    ...req,
    language: req.language ?? "en",
  });
  return result.imageUrl;
}

export async function fetchYoutubeRecipeVideos(
  req: MealMediaRequest,
): Promise<DietYoutubeVideo[]> {
  const result = await fetchMealMedia(req);
  return result.videos ?? [];
}

/** hqdefault is more reliable than maxresdefault when the latter 404s. */
export function mealImageFallbackChain(url: string): string[] {
  const ytMatch = url.match(/i\.ytimg\.com\/vi\/([^/]+)\/(?:maxres)?default\.jpg/);
  if (ytMatch) {
    const id = ytMatch[1];
    return [
      url,
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    ];
  }
  return [url];
}
