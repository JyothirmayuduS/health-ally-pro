/**
 * Medora secure AI client — routes all inference through the web server.
 * PHI is redacted server-side before cloud providers. No API keys in the app.
 */

import Constants from "expo-constants";

export type MedoraApiChatResponse = {
  answer: string;
  modelSource: string;
  disclaimer: string;
  hipaaNote?: string;
  phiRedacted?: boolean;
};

function apiBase(): string {
  const extra = Constants.expoConfig?.extra as { medoraApiUrl?: string } | undefined;
  return (
    process.env.EXPO_PUBLIC_MEDORA_API_URL ??
    extra?.medoraApiUrl ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function apiKey(): string {
  const extra = Constants.expoConfig?.extra as { medoraAiKey?: string } | undefined;
  return process.env.EXPO_PUBLIC_MEDORA_AI_KEY ?? extra?.medoraAiKey ?? "";
}

export async function medoraApiChat(
  query: string,
  patientDossier: string,
  onStep: (step: string) => void,
): Promise<MedoraApiChatResponse> {
  onStep("Connecting to Medora secure AI gateway…");

  const response = await fetch(`${apiBase()}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-medora-ai-key": apiKey(),
    },
    body: JSON.stringify({
      query,
      context: "general",
      patientDossier,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `Medora API error ${response.status}`);
  }

  onStep("Synthesizing HIPAA-safe clinical response…");
  return (await response.json()) as MedoraApiChatResponse;
}

export async function medoraApiStatus(): Promise<{ cloudEnabled: boolean }> {
  try {
    const response = await fetch(`${apiBase()}/api/ai/status`, {
      headers: { "x-medora-ai-key": apiKey() },
    });
    if (!response.ok) return { cloudEnabled: false };
    return (await response.json()) as { cloudEnabled: boolean };
  } catch {
    return { cloudEnabled: false };
  }
}
