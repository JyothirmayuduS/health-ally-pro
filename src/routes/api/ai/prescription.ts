import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse, unauthorizedResponse, verifyMedoraApiKey } from "@/server/ai/api-auth";
import type { PrescriptionAiServerInput } from "@/lib/ai/types";

export const Route = createFileRoute("/api/ai/prescription")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyMedoraApiKey(request)) return unauthorizedResponse();

        try {
          const body = (await request.json()) as PrescriptionAiServerInput;
          const { runPrescriptionAi } = await import("@/server/ai/prescription");
          const result = await runPrescriptionAi(body, "native");
          return jsonResponse(result ?? { error: "AI unavailable" }, {
            status: result ? 200 : 503,
          });
        } catch (e) {
          return jsonResponse(
            { error: e instanceof Error ? e.message : "Prescription AI failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
