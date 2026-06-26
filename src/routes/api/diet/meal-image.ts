import { createFileRoute } from "@tanstack/react-router";
import {
  jsonResponse,
  optionsResponse,
  verifyPatientWebAiRequest,
} from "@/server/ai/api-auth";
import { searchMealHeroImage } from "@/server/diet/meal-image";

type Body = {
  mealId?: string;
  mealName: string;
  ingredients: string[];
};

export const Route = createFileRoute("/api/diet/meal-image")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyPatientWebAiRequest(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = (await request.json()) as Body;
          if (!body.mealName?.trim()) {
            return jsonResponse({ error: "mealName required" }, { status: 400 });
          }

          const result = await searchMealHeroImage({
            mealId: body.mealId,
            mealName: body.mealName,
            ingredients: body.ingredients ?? [],
          });

          return jsonResponse(result);
        } catch (e) {
          return jsonResponse(
            { error: e instanceof Error ? e.message : "Image search failed", imageUrl: null },
            { status: 500 },
          );
        }
      },
    },
  },
});
