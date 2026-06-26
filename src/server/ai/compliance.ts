import { getServerAiEnv } from "./env";

export type AiComplianceConfig = {
  allowCloudPhi: boolean;
  requireBaaForCloud: boolean;
  baaProviders: {
    gemini: boolean;
    groq: boolean;
    huggingface: boolean;
  };
  phiRedactionEnabled: boolean;
  auditEnabled: boolean;
};

function envBool(key: string, defaultValue: boolean): boolean {
  const v = typeof process !== "undefined" ? process.env[key] : undefined;
  if (v === undefined || v === "") return defaultValue;
  return v === "1" || v.toLowerCase() === "true";
}

export function getAiComplianceConfig(): AiComplianceConfig {
  return {
    allowCloudPhi: envBool("MEDORA_AI_ALLOW_CLOUD_PHI", false),
    requireBaaForCloud: envBool("MEDORA_AI_REQUIRE_BAA", true),
    baaProviders: {
      gemini: envBool("MEDORA_AI_BAA_GEMINI", true),
      groq: envBool("MEDORA_AI_BAA_GROQ", false),
      huggingface: envBool("MEDORA_AI_BAA_HUGGINGFACE", false),
    },
    phiRedactionEnabled: envBool("MEDORA_AI_PHI_REDACTION", true),
    auditEnabled: envBool("MEDORA_AI_AUDIT_LOG", true),
  };
}

export function isProviderBaaCompliant(provider: "gemini" | "groq" | "huggingface"): boolean {
  const cfg = getAiComplianceConfig();
  return cfg.baaProviders[provider];
}

export function canSendToCloudProvider(provider: "gemini" | "groq" | "huggingface"): boolean {
  const cfg = getAiComplianceConfig();
  const env = getServerAiEnv();

  const hasKey =
    (provider === "gemini" && !!env.geminiApiKey) ||
    (provider === "groq" && !!env.groqApiKey) ||
    (provider === "huggingface" && !!env.huggingfaceToken);

  if (!hasKey) return false;
  if (cfg.requireBaaForCloud && !isProviderBaaCompliant(provider)) return false;
  return true;
}

export function complianceSystemAddendum(): string {
  return [
    "HIPAA-safe mode: Do not request, store, or repeat patient identifiers.",
    "Use de-identified placeholders only. This is clinical decision support, not a diagnosis.",
  ].join(" ");
}

export const HIPAA_DISCLAIMER =
  "Medora AI operates under HIPAA-aligned controls: PHI is redacted before cloud inference unless explicitly enabled. Verify all outputs. BAA required with cloud providers in production.";

export function getBaaStatusSummary() {
  const cfg = getAiComplianceConfig();
  return {
    phiRedactionEnabled: cfg.phiRedactionEnabled,
    allowCloudPhi: cfg.allowCloudPhi,
    requireBaaForCloud: cfg.requireBaaForCloud,
    providers: cfg.baaProviders,
    recommendation:
      "For production HIPAA: enable Google Cloud BAA + Gemini via Vertex AI, or use on-prem Ollama. Groq/HF free tiers are not HIPAA-eligible.",
  };
}
