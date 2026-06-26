import type { AiTask } from "@/lib/ai/types";

export type ServerAiEnv = {
  geminiApiKey?: string;
  groqApiKey?: string;
  huggingfaceToken?: string;
};

function read(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
}

export function getServerAiEnv(): ServerAiEnv {
  return {
    geminiApiKey: read("GEMINI_API_KEY") ?? read("GOOGLE_AI_API_KEY"),
    groqApiKey: read("GROQ_API_KEY"),
    huggingfaceToken: read("HUGGINGFACE_TOKEN") ?? read("HF_TOKEN"),
  };
}

export function hasAnyAiProvider(env: ServerAiEnv = getServerAiEnv()): boolean {
  return !!(env.geminiApiKey || env.groqApiKey || env.huggingfaceToken);
}

export const TASK_MODELS: Record<
  AiTask,
  { gemini: string; groq: string; huggingface: string[] }
> = {
  prescription: {
    gemini: "gemini-2.0-flash",
    groq: "llama-3.3-70b-versatile",
    huggingface: ["epfl-llm/meditron-7b-v1", "mistralai/Mistral-7B-Instruct-v0.3"],
  },
  clinical_chat: {
    gemini: "gemini-2.0-flash",
    groq: "llama-3.1-8b-instant",
    huggingface: ["meta-llama/Meta-Llama-3-8B-Instruct", "Qwen/Qwen2.5-7B-Instruct"],
  },
  billing_insight: {
    gemini: "gemini-2.0-flash",
    groq: "llama-3.1-8b-instant",
    huggingface: ["meta-llama/Meta-Llama-3-8B-Instruct"],
  },
  lab_summary: {
    gemini: "gemini-2.0-flash",
    groq: "llama-3.3-70b-versatile",
    huggingface: ["mistralai/Mistral-7B-Instruct-v0.3"],
  },
  search_rerank: {
    gemini: "gemini-2.0-flash",
    groq: "llama-3.1-8b-instant",
    huggingface: ["meta-llama/Meta-Llama-3-8B-Instruct"],
  },
};
