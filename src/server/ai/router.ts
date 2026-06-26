import { canSendToCloudProvider } from "./compliance";
import type { AiCompletionRequest, AiCompletionResult } from "@/lib/ai/types";
import { getServerAiEnv, TASK_MODELS } from "./env";

async function completeGemini(
  req: AiCompletionRequest,
  apiKey: string,
): Promise<AiCompletionResult | null> {
  const model = TASK_MODELS[req.task].gemini;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts: [{ text: req.user }] }],
          generationConfig: {
            maxOutputTokens: req.maxTokens ?? 600,
            temperature: req.temperature ?? 0.35,
          },
        }),
      },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    return { text, provider: "gemini", model };
  } catch {
    return null;
  }
}

async function completeGroq(
  req: AiCompletionRequest,
  apiKey: string,
): Promise<AiCompletionResult | null> {
  const model = TASK_MODELS[req.task].groq;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
        max_tokens: req.maxTokens ?? 600,
        temperature: req.temperature ?? 0.35,
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    return { text, provider: "groq", model };
  } catch {
    return null;
  }
}

async function completeHuggingFace(
  req: AiCompletionRequest,
  token: string,
): Promise<AiCompletionResult | null> {
  for (const model of TASK_MODELS[req.task].huggingface) {
    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
          max_tokens: req.maxTokens ?? 500,
          temperature: req.temperature ?? 0.4,
        }),
      });
      if (response.status === 503) continue;
      if (!response.ok) continue;
      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      return { text, provider: "huggingface", model };
    } catch {
      continue;
    }
  }
  return null;
}

export async function completeWithRouter(req: AiCompletionRequest): Promise<AiCompletionResult | null> {
  const env = getServerAiEnv();

  if (env.geminiApiKey && canSendToCloudProvider("gemini")) {
    const result = await completeGemini(req, env.geminiApiKey);
    if (result) return result;
  }

  if (env.groqApiKey && canSendToCloudProvider("groq")) {
    const result = await completeGroq(req, env.groqApiKey);
    if (result) return result;
  }

  if (env.huggingfaceToken && canSendToCloudProvider("huggingface")) {
    const result = await completeHuggingFace(req, env.huggingfaceToken);
    if (result) return result;
  }

  return null;
}

export function formatModelSource(result: AiCompletionResult): string {
  const labels: Record<string, string> = {
    gemini: "Medora Neural Engine (Gemini)",
    groq: "Medora Neural Engine (Groq)",
    huggingface: "Medora Neural Engine (Clinical LLM)",
  };
  return `${labels[result.provider] ?? "Medora Neural Engine"} · ${result.model}`;
}
