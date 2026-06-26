import { createServerFn } from "@tanstack/react-start";
import type {
  ClinicalChatInput,
  ClinicalChatOutput,
  PrescriptionAiServerInput,
  PrescriptionAiServerOutput,
} from "@/lib/ai/types";

export const medoraPrescriptionAi = createServerFn({ method: "POST" })
  .inputValidator((data: PrescriptionAiServerInput) => data)
  .handler(async ({ data }): Promise<PrescriptionAiServerOutput | null> => {
    const { runPrescriptionAi } = await import("@/server/ai/prescription");
    return runPrescriptionAi(data, "web");
  });

export const medoraClinicalChat = createServerFn({ method: "POST" })
  .inputValidator((data: ClinicalChatInput) => data)
  .handler(async ({ data }): Promise<ClinicalChatOutput> => {
    const { runClinicalChat } = await import("@/server/ai/prescription");
    return runClinicalChat(data, "web");
  });

export const medoraHospitalInsights = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClinicalChatOutput> => {
    const { runHospitalInsights } = await import("@/server/ai/prescription");
    return runHospitalInsights("web");
  },
);

export const medoraAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getServerAiEnv, hasAnyAiProvider } = await import("@/server/ai/env");
  const { getBaaStatusSummary } = await import("@/server/ai/compliance");
  const { isSupabaseAdminConfigured } = await import("@/lib/supabase/admin");
  const env = getServerAiEnv();
  return {
    cloudEnabled: hasAnyAiProvider(env),
    providers: {
      gemini: !!env.geminiApiKey,
      groq: !!env.groqApiKey,
      huggingface: !!env.huggingfaceToken,
    },
    ragEnabled: true,
    vectorRagEnabled: isSupabaseAdminConfigured(),
    semanticSearchEnabled: true,
    compliance: getBaaStatusSummary(),
  };
});

export const medoraSyncVectorIndex = createServerFn({ method: "POST" }).handler(async () => {
  const { syncKnowledgeToVectorStore } = await import("@/server/ai/vector-rag");
  return syncKnowledgeToVectorStore();
});
