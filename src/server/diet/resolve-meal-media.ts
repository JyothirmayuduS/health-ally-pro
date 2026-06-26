import type { DietCuisineFilter, DietLanguage } from "@/lib/diet-ai-types";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import { mealMediaFingerprint } from "@/lib/diet-meal-fingerprint";
import {
  getVerifiedMealImage,
  getVerifiedMealMedia,
  getVerifiedMealVideos,
  VERIFIED_MEAL_MEDIA,
} from "@/lib/diet-meal-media";
import { getCuratedYoutubeForMeal } from "@/lib/diet-youtube-curated";
import {
  getCachedImage,
  getCachedMediaBundle,
  getCachedVideos,
  setCachedImage,
  setCachedMediaBundle,
  setCachedVideos,
} from "@/server/diet/media-cache";
import {
  loadMediaBundle,
  persistImage,
  persistMediaBundle,
  persistVideos,
} from "@/server/diet/media-cache-persist";
import { searchDynamicMealMedia } from "@/server/diet/meal-media-dynamic";
import { searchPipedRecipeVideos } from "@/server/diet/piped-youtube-search";
import { searchWikimediaFoodImage } from "@/server/diet/wikimedia-food-image";
import { verifyYoutubeVideoId } from "@/server/diet/youtube-oembed";
import { searchYoutubeRecipes } from "@/server/diet/youtube";

export type ResolvedMealMedia = {
  imageUrl: string | null;
  videos: DietYoutubeVideo[];
  source: string;
  fingerprint: string;
};

export function isBuiltInMealId(mealId?: string): boolean {
  return !!mealId && mealId in VERIFIED_MEAL_MEDIA;
}

function youtubeSearchEnabled(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.YOUTUBE_SEARCH_ENABLED === "true" || process.env.YOUTUBE_SEARCH_ENABLED === "1";
}

export type ResolveMealMediaInput = {
  mealId?: string;
  mealName: string;
  ingredients: string[];
  language?: DietLanguage;
  cuisine?: DietCuisineFilter;
};

async function verifyVideos(videos: DietYoutubeVideo[]): Promise<DietYoutubeVideo[]> {
  const verified: DietYoutubeVideo[] = [];
  for (const v of videos) {
    if (await verifyYoutubeVideoId(v.videoId)) verified.push(v);
    if (verified.length >= 3) break;
  }
  return verified;
}

/** Resolve hero image + recipe videos — quota-free sources first. */
export async function resolveMealMedia(input: ResolveMealMediaInput): Promise<ResolvedMealMedia> {
  const lang = input.language ?? "en";
  const cuisine = input.cuisine ?? "all";
  const fingerprint = mealMediaFingerprint(input.mealName, input.ingredients);

  const memBundle = getCachedMediaBundle(fingerprint, lang);
  const bundled = await loadMediaBundle(fingerprint, lang, memBundle);
  if (bundled) {
    if (!memBundle) setCachedMediaBundle(fingerprint, lang, bundled);
    return { ...bundled, fingerprint };
  }

  if (input.mealId && isBuiltInMealId(input.mealId)) {
    const verified = getVerifiedMealMedia(input.mealId)!;
    const result: ResolvedMealMedia = {
      imageUrl: verified.imageUrl,
      videos: getVerifiedMealVideos(input.mealId, lang),
      source: "verified",
      fingerprint,
    };
    await cacheResolved(input.mealId, fingerprint, lang, result);
    return result;
  }

  // ① TheMealDB
  const dynamic = await searchDynamicMealMedia(input.mealName, input.ingredients, lang);
  let dynamicImage = dynamic?.imageUrl ?? null;
  let videos = dynamic?.videos ?? [];

  if (videos.length) {
    videos = await verifyVideos(videos);
  }

  // ② Wikimedia Commons — real food photos when TheMealDB has no image
  if (!dynamicImage) {
    dynamicImage = await searchWikimediaFoodImage(input.mealName, input.ingredients);
  }

  // ③ Piped — free YouTube search (no Google API quota)
  if (videos.length < 2) {
    const piped = await searchPipedRecipeVideos(input.mealName, input.ingredients, lang);
    const seen = new Set(videos.map((v) => v.videoId));
    for (const v of piped) {
      if (!seen.has(v.videoId)) {
        seen.add(v.videoId);
        videos.push(v);
      }
    }
    videos = await verifyVideos(videos);
  }

  // ④ Ingredient-scored curated pool (offline, no API)
  if (!videos.length) {
    const curated = getCuratedYoutubeForMeal({
      mealId: input.mealId,
      mealName: input.mealName,
      ingredients: input.ingredients,
      cuisine,
      language: lang,
    });
    videos = await verifyVideos(curated);
  }

  // ⑤ YouTube Data API — opt-in only (YOUTUBE_SEARCH_ENABLED=1)
  if (!videos.length && youtubeSearchEnabled()) {
    const apiVideos = await searchYoutubeRecipes(
      { query: input.mealName, budget: "balanced", cuisine, language: lang },
      input.mealName,
      input.ingredients,
      input.mealId,
    );
    videos = await verifyVideos(apiVideos);
  }

  let imageUrl =
    dynamicImage ??
    (input.mealId ? getCachedImage(input.mealId) : undefined) ??
    getCachedImage(fingerprint) ??
    null;

  if (!imageUrl && videos[0]?.videoId) {
    imageUrl = `https://i.ytimg.com/vi/${videos[0].videoId}/hqdefault.jpg`;
  }

  const source = dynamic?.videos.length
    ? dynamic.source
    : videos.some((v) => v.channel !== "TheMealDB")
      ? "piped+verified"
      : videos.length
        ? "curated+verified"
        : "none";

  const result: ResolvedMealMedia = {
    imageUrl,
    videos: videos.slice(0, 3),
    source,
    fingerprint,
  };
  await cacheResolved(input.mealId, fingerprint, lang, result);
  return result;
}

async function cacheResolved(
  mealId: string | undefined,
  fingerprint: string,
  lang: DietLanguage,
  result: Omit<ResolvedMealMedia, "fingerprint">,
): Promise<void> {
  const bundle = { imageUrl: result.imageUrl, videos: result.videos, source: result.source };
  setCachedMediaBundle(fingerprint, lang, bundle);
  void persistMediaBundle(fingerprint, lang, bundle);

  if (mealId) {
    if (result.imageUrl) {
      setCachedImage(mealId, result.imageUrl);
      void persistImage(mealId, result.imageUrl);
    }
    if (result.videos.length) {
      setCachedVideos(mealId, lang, result.videos);
      void persistVideos(mealId, lang, result.videos);
    }
  }
  if (result.imageUrl) {
    setCachedImage(fingerprint, result.imageUrl);
    void persistImage(fingerprint, result.imageUrl);
  }
  if (result.videos.length) {
    setCachedVideos(fingerprint, lang, result.videos);
    void persistVideos(fingerprint, lang, result.videos);
  }
}

export async function resolveMealVideos(
  input: ResolveMealMediaInput,
): Promise<DietYoutubeVideo[]> {
  const lang = input.language ?? "en";
  const fp = mealMediaFingerprint(input.mealName, input.ingredients);

  const byFp = getCachedVideos<DietYoutubeVideo[]>(fp, lang);
  if (byFp?.length) return byFp;

  if (input.mealId) {
    const byId = getCachedVideos<DietYoutubeVideo[]>(input.mealId, lang);
    if (byId?.length) return byId;
  }

  const resolved = await resolveMealMedia(input);
  return resolved.videos;
}

export async function resolveMealImage(input: ResolveMealMediaInput): Promise<string | null> {
  const fp = mealMediaFingerprint(input.mealName, input.ingredients);

  const cached = getCachedImage(fp) ?? (input.mealId ? getCachedImage(input.mealId) : undefined);
  if (cached) return cached;

  if (input.mealId && isBuiltInMealId(input.mealId)) {
    const img = getVerifiedMealImage(input.mealId) ?? null;
    if (img) setCachedImage(fp, img);
    return img;
  }

  const wiki = await searchWikimediaFoodImage(input.mealName, input.ingredients);
  if (wiki) {
    setCachedImage(fp, wiki);
    if (input.mealId) setCachedImage(input.mealId, wiki);
    return wiki;
  }

  const resolved = await resolveMealMedia(input);
  return resolved.imageUrl;
}
