import type { DietLanguage } from "@/lib/diet-ai-types";
import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import { mealSearchQueries } from "@/lib/diet-meal-search";
import { videoMatchesMeal } from "@/lib/diet-youtube-curated";
import { simplifyMealSearchName } from "@/lib/diet-meal-search";

/** Public Piped instances — free YouTube search without Google API quota. */
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.yt",
];

type PipedSearchItem = {
  url?: string;
  title?: string;
  uploaderName?: string;
  thumbnail?: string;
  duration?: number;
};

type PipedSearchResponse = {
  items?: PipedSearchItem[];
};

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

async function searchPipedOnce(
  baseUrl: string,
  query: string,
): Promise<PipedSearchItem[]> {
  const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&filter=videos`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) return [];
  const json = (await res.json()) as PipedSearchResponse;
  return json.items ?? [];
}

/**
 * Search recipe videos via Piped — no YouTube Data API key or daily quota.
 * Falls through instances on failure.
 */
export async function searchPipedRecipeVideos(
  mealName: string,
  ingredients: string[],
  language: DietLanguage = "en",
): Promise<DietYoutubeVideo[]> {
  const searchName = simplifyMealSearchName(mealName, ingredients);
  const queries = mealSearchQueries(mealName, ingredients).slice(0, 2);
  const seen = new Set<string>();
  const collected: DietYoutubeVideo[] = [];

  for (const instance of PIPED_INSTANCES) {
    try {
      for (const q of queries) {
        const items = await searchPipedOnce(instance, `${q} recipe`);
        for (const item of items) {
          if (!item.url) continue;
          const videoId = extractVideoId(item.url);
          if (!videoId || seen.has(videoId)) continue;
          seen.add(videoId);

          const video: DietYoutubeVideo = {
            videoId,
            title: item.title ?? mealName,
            channel: item.uploaderName ?? "YouTube",
            language,
            thumbnailUrl:
              item.thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          };

          if (videoMatchesMeal(video, searchName, ingredients)) {
            collected.unshift(video);
          } else {
            collected.push(video);
          }
        }
        if (collected.length >= 3) break;
      }
      if (collected.length) break;
    } catch {
      continue;
    }
  }

  return collected.slice(0, 3);
}
