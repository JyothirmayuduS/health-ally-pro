import { createFileRoute } from "@tanstack/react-router";
import type { DietLanguage } from "@/lib/diet-ai-types";
import {
  jsonResponse,
  optionsResponse,
  verifyPatientWebAiRequest,
} from "@/server/ai/api-auth";
import { searchYoutubeExercises } from "@/server/exercise/youtube";

type Body = {
  routineId: string;
  routineName: string;
  language: DietLanguage;
  keywords: string[];
};

export const Route = createFileRoute("/api/exercise/youtube")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyPatientWebAiRequest(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = (await request.json()) as Body;
          if (!body.routineName?.trim() || !body.routineId) {
            return jsonResponse(
              { error: "routineId and routineName required" },
              { status: 400 },
            );
          }

          const language = body.language ?? "en";
          const videos = await searchYoutubeExercises(
            body.routineId,
            body.routineName,
            body.keywords ?? [],
            language,
          );

          return jsonResponse({ videos, source: "youtube-api" });
        } catch (e) {
          return jsonResponse(
            { error: e instanceof Error ? e.message : "YouTube search failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
