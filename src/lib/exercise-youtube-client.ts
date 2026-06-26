import type { DietLanguage } from "@/lib/diet-ai-types";
import type { ExerciseYoutubeVideo } from "@/lib/exercise-mock-data";
import { getCuratedExerciseVideos } from "@/lib/exercise-youtube-curated";

export type ExerciseYoutubeRequest = {
  routineId: string;
  routineName: string;
  language: DietLanguage;
  keywords: string[];
};

export async function fetchExerciseVideos(
  req: ExerciseYoutubeRequest,
): Promise<ExerciseYoutubeVideo[]> {
  const fallback = getCuratedExerciseVideos(req.routineId, req.language);

  if (!req.routineName?.trim()) return fallback;

  try {
    const res = await fetch("/api/exercise/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as { videos?: ExerciseYoutubeVideo[] };
    return data.videos?.length ? data.videos : fallback;
  } catch {
    return fallback;
  }
}
