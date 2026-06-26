import type { DietYoutubeVideo } from "@/lib/diet-mock-data";
import type { DietAiSearchInput } from "@/lib/diet-ai-types";
import {
  buildFoodBasedYoutubeQueries,
  LANG_SEARCH,
  videoMatchesLanguage,
} from "@/lib/diet-youtube-lang";
import { getCuratedYoutubeForMeal, videoMatchesMeal } from "@/lib/diet-youtube-curated";
import { VERIFIED_MEAL_MEDIA } from "@/lib/diet-meal-media";
import { simplifyMealSearchName } from "@/lib/diet-meal-search";
import { getCachedVideos, setCachedVideos } from "@/server/diet/media-cache";
import { searchDynamicMealMedia } from "@/server/diet/meal-media-dynamic";

let youtubeQuotaExhausted = false;

function getYoutubeApiKey(): string | undefined {
  if (youtubeQuotaExhausted) return undefined;
  if (typeof process === "undefined") return undefined;
  const enabled =
    process.env.YOUTUBE_SEARCH_ENABLED === "true" || process.env.YOUTUBE_SEARCH_ENABLED === "1";
  if (!enabled) return undefined;
  return process.env.YOUTUBE_API_KEY ?? process.env.GOOGLE_YOUTUBE_API_KEY;
}

async function searchYoutubeOnce(
  apiKey: string,
  searchQuery: string,
  language: DietAiSearchInput["language"],
): Promise<DietYoutubeVideo[]> {
  const cfg = LANG_SEARCH[language];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("relevanceLanguage", language);
  url.searchParams.set("regionCode", cfg.regionCode);
  url.searchParams.set("hl", cfg.hl);
  url.searchParams.set("videoCategoryId", "26");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    try {
      const err = (await res.json()) as { error?: { status?: string; code?: number } };
      if (err.error?.status === "RESOURCE_EXHAUSTED" || err.error?.code === 429) {
        youtubeQuotaExhausted = true;
      }
    } catch {
      /* ignore */
    }
    return [];
  }

  const json = (await res.json()) as {
    items?: {
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        defaultAudioLanguage?: string;
        defaultLanguage?: string;
        thumbnails?: { medium?: { url?: string } };
      };
    }[];
  };

  const ids = json.items?.map((i) => i.id?.videoId).filter((id): id is string => !!id) ?? [];
  if (!ids.length) return [];

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "statistics,status,snippet");
  detailsUrl.searchParams.set("id", ids.join(","));
  detailsUrl.searchParams.set("hl", cfg.hl);
  detailsUrl.searchParams.set("key", apiKey);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) return [];

  const detailsJson = (await detailsRes.json()) as {
    items?: {
      id: string;
      status?: { embeddable?: boolean };
      statistics?: { viewCount?: string; likeCount?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        defaultAudioLanguage?: string;
        defaultLanguage?: string;
        thumbnails?: { medium?: { url?: string } };
      };
    }[];
  };

  return (
    detailsJson.items
      ?.filter((item) => item.status?.embeddable !== false)
      .map((item) => ({
        videoId: item.id,
        title: item.snippet?.title ?? searchQuery,
        channel: item.snippet?.channelTitle ?? "YouTube",
        viewCount: item.statistics?.viewCount
          ? formatCount(item.statistics.viewCount)
          : undefined,
        likeCount: item.statistics?.likeCount
          ? formatCount(item.statistics.likeCount)
          : undefined,
        language,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
        _audioLang: item.snippet?.defaultAudioLanguage ?? item.snippet?.defaultLanguage,
      })) ?? []
  );
}

type ScoredVideo = DietYoutubeVideo & { _audioLang?: string };

function scoreVideoForLanguage(video: ScoredVideo, language: DietAiSearchInput["language"]): number {
  let score = 0;
  const title = video.title ?? "";

  if (videoMatchesLanguage(title, language)) score += 50;

  const audio = (video._audioLang ?? "").toLowerCase();
  if (audio.startsWith(language)) score += 40;
  if (language === "hi" && audio.startsWith("hi")) score += 30;
  if (language === "ta" && audio.startsWith("ta")) score += 30;
  if (language === "te" && audio.startsWith("te")) score += 30;
  if (language === "en" && (audio.startsWith("en") || !audio)) score += 20;

  if (language === "hi" && /gujarati|thepla|થેપલા/i.test(title)) score -= 100;
  if (language === "en" && /gujarati|thepla/i.test(title)) score -= 50;

  return score;
}

export async function searchYoutubeRecipes(
  input: DietAiSearchInput,
  mealName: string,
  ingredients: string[] = [],
  mealId?: string,
): Promise<DietYoutubeVideo[]> {
  const lang = input.language ?? "en";
  const fingerprint = mealMediaFingerprint(mealName, ingredients);

  const cachedFp = getCachedVideos<DietYoutubeVideo[]>(fingerprint, lang);
  if (cachedFp?.length) return cachedFp;

  if (mealId) {
    const cached = getCachedVideos<DietYoutubeVideo[]>(mealId, lang);
    if (cached?.length) return cached;

    if (mealId in VERIFIED_MEAL_MEDIA) {
      const { getVerifiedMealVideos } = await import("@/lib/diet-meal-media");
      const verified = getVerifiedMealVideos(mealId, lang);
      if (verified.length) {
        setCachedVideos(mealId, lang, verified);
        setCachedVideos(fingerprint, lang, verified);
        return verified;
      }
    }
  }

  const dynamic = await searchDynamicMealMedia(mealName, ingredients, lang);
  if (dynamic?.videos.length) {
    setCachedVideos(fingerprint, lang, dynamic.videos);
    if (mealId) setCachedVideos(mealId, lang, dynamic.videos);
    return dynamic.videos;
  }

  const apiKey = getYoutubeApiKey();
  const queries = buildFoodBasedYoutubeQueries(mealName, ingredients, input.language).slice(0, 2);
  const searchName = simplifyMealSearchName(mealName, ingredients);

  if (apiKey && queries.length) {
    try {
      const seen = new Set<string>();
      const collected: ScoredVideo[] = [];

      for (const q of queries) {
        const batch = await searchYoutubeOnce(apiKey, q, input.language);
        for (const video of batch) {
          if (seen.has(video.videoId)) continue;
          seen.add(video.videoId);
          collected.push(video);
        }
      }

      const ranked = collected
        .map((v) => ({
          v,
          score:
            scoreVideoForLanguage(v, input.language) +
            (videoMatchesMeal(v, searchName, ingredients) ? 80 : 10),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => {
          const { _audioLang: _, ...rest } = x.v;
          return rest as DietYoutubeVideo;
        });

      if (ranked.length) {
        const picks = ranked.slice(0, 3);
        setCachedVideos(fingerprint, lang, picks);
        if (mealId) setCachedVideos(mealId, lang, picks);
        return picks;
      }
    } catch {
      /* fall through */
    }
  }

  const fallback = getCuratedYoutubeForMeal({
    mealId,
    mealName,
    ingredients,
    cuisine: input.cuisine,
    language: lang,
  });
  if (fallback.length) {
    setCachedVideos(fingerprint, lang, fallback);
    if (mealId) setCachedVideos(mealId, lang, fallback);
  }
  return fallback;
}

function formatCount(n: string): string {
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}
