import { createFileRoute } from "@tanstack/react-router";
import type { DietCuisineFilter, DietLanguage } from "@/lib/diet-ai-types";
import {
  jsonResponse,
  optionsResponse,
  verifyPatientWebAiRequest,
} from "@/server/ai/api-auth";
import { resolveMealVideos } from "@/server/diet/resolve-meal-media";

type Body = {
  mealId?: string;
  mealName: string;
  language: DietLanguage;
  cuisine?: DietCuisineFilter;
  ingredients: string[];
};

export const Route = createFileRoute("/api/diet/youtube")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyPatientWebAiRequest(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = (await request.json()) as Body;
          if (!body.mealName?.trim() || !body.ingredients?.length) {
            return jsonResponse(
              { error: "mealName and ingredients required" },
              { status: 400 },
            );
          }

          const language = body.language ?? "en";
          const videos = await resolveMealVideos({
            mealId: body.mealId,
            mealName: body.mealName,
            ingredients: body.ingredients,
            language,
            cuisine: body.cuisine ?? "all",
          });

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
