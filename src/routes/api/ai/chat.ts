import { createFileRoute } from "@tanstack/react-router";
import {
  corsHeaders,
  jsonResponse,
  optionsResponse,
  unauthorizedResponse,
  verifyMedoraApiKey,
} from "@/server/ai/api-auth";
import type { ClinicalChatInput } from "@/lib/ai/types";

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        if (!verifyMedoraApiKey(request)) return unauthorizedResponse();

        try {
          const body = (await request.json()) as ClinicalChatInput & {
            patientDossier?: string;
          };
          const { runClinicalChat, runPatientAssistantChat } = await import(
            "@/server/ai/prescription"
          );

          const result =
            body.context === "general" && body.patientDossier
              ? await runPatientAssistantChat(body.query, body.patientDossier, "native")
              : await runClinicalChat(body, "native");

          return jsonResponse(result);
        } catch (e) {
          return jsonResponse(
            { error: e instanceof Error ? e.message : "AI request failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
