import type { DietLanguage } from "@/lib/diet-ai-types";
import { videoMatchesLanguage } from "@/lib/diet-youtube-lang";
import type { ExerciseYoutubeVideo } from "@/lib/exercise-mock-data";
import { buildExerciseYoutubeQueries } from "@/lib/exercise-youtube-lang";
import { getCuratedExerciseVideos } from "@/lib/exercise-youtube-curated";

function getYoutubeApiKey(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env.YOUTUBE_API_KEY ?? process.env.GOOGLE_YOUTUBE_API_KEY;
}

async function searchYoutubeOnce(
  apiKey: string,
  searchQuery: string,
  language: DietLanguage,
): Promise<(ExerciseYoutubeVideo & { _audioLang?: string })[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("relevanceLanguage", language);
  url.searchParams.set("videoDuration", "short");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const json = (await res.json()) as {
    items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[];
  };

  const ids = json.items?.map((i) => i.id?.videoId).filter((id): id is string => !!id) ?? [];
  if (!ids.length) return [];

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "statistics,status,contentDetails,snippet");
  detailsUrl.searchParams.set("id", ids.join(","));
  detailsUrl.searchParams.set("key", apiKey);

  const detailsRes = await fetch(detailsUrl.toString());
  if (!detailsRes.ok) return [];

  const detailsJson = (await detailsRes.json()) as {
    items?: {
      id: string;
      status?: { embeddable?: boolean };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        defaultAudioLanguage?: string;
        defaultLanguage?: string;
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
        durationLabel: parseIsoDuration(item.contentDetails?.duration),
        language,
        _audioLang: item.snippet?.defaultAudioLanguage ?? item.snippet?.defaultLanguage,
      })) ?? []
  );
}

function parseIsoDuration(iso?: string): string | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const mins = Number(m[2] ?? 0);
  const secs = Number(m[3] ?? 0);
  if (mins > 0) return `${mins} min`;
  return `${secs} sec`;
}

function scoreVideo(
  video: ExerciseYoutubeVideo & { _audioLang?: string },
  language: DietLanguage,
): number {
  let score = 0;
  const title = video.title ?? "";

  if (videoMatchesLanguage(title, language)) score += 50;
  const audio = (video._audioLang ?? "").toLowerCase();
  if (audio.startsWith(language)) score += 40;
  if (/beginner|easy|gentle|explained|tutorial|short|5 min|10 min/i.test(title)) score += 25;
  if (/advanced|intense|1 hour|60 min/i.test(title)) score -= 30;

  return score;
}

export async function searchYoutubeExercises(
  routineId: string,
  routineName: string,
  keywords: string[],
  language: DietLanguage,
): Promise<ExerciseYoutubeVideo[]> {
  const apiKey = getYoutubeApiKey();
  const queries = buildExerciseYoutubeQueries(routineName, keywords, language);

  if (apiKey && queries.length) {
    try {
      const seen = new Set<string>();
      const collected: (ExerciseYoutubeVideo & { _audioLang?: string })[] = [];

      for (const q of queries) {
        const batch = await searchYoutubeOnce(apiKey, q, language);
        for (const video of batch) {
          if (seen.has(video.videoId)) continue;
          seen.add(video.videoId);
          collected.push(video);
        }
      }

      const ranked = collected
        .map((v) => ({ v, score: scoreVideo(v, language) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => {
          const { _audioLang: _, ...rest } = x.v;
          return rest as ExerciseYoutubeVideo;
        });

      if (ranked.length) return ranked.slice(0, 3);
    } catch {
      /* fall through */
    }
  }

  return getCuratedExerciseVideos(routineId, language);
}

function formatCount(n: string): string {
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}
