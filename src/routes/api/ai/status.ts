import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, optionsResponse, verifyMedoraApiKey } from "@/server/ai/api-auth";
import { hasAnyAiProvider } from "@/server/ai/env";
import { getBaaStatusSummary } from "@/server/ai/compliance";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const Route = createFileRoute("/api/ai/status")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        if (!verifyMedoraApiKey(request)) {
          return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        const { getServerAiEnv } = await import("@/server/ai/env");
        const env = getServerAiEnv();

        return jsonResponse({
          cloudEnabled: hasAnyAiProvider(env),
          providers: {
            gemini: !!env.geminiApiKey,
            groq: !!env.groqApiKey,
            huggingface: !!env.huggingfaceToken,
          },
          vectorRagEnabled: isSupabaseAdminConfigured(),
          semanticSearchEnabled: true,
          compliance: getBaaStatusSummary(),
        });
      },
    },
  },
});
