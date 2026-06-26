import { createFileRoute } from "@tanstack/react-router";
import {
  jsonResponse,
  optionsResponse,
  verifyPatientWebAiRequest,
} from "@/server/ai/api-auth";
import type { DietAiSearchInput } from "@/lib/diet-ai-types";

export const Route = createFileRoute("/api/ai/diet")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyPatientWebAiRequest(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = (await request.json()) as DietAiSearchInput;
          const { runDietAiSearch } = await import("@/server/ai/diet");
          const result = await runDietAiSearch(body);
          return jsonResponse(result);
        } catch (e) {
          return jsonResponse(
            { error: e instanceof Error ? e.message : "Diet AI failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
