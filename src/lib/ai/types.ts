export type AiTask =
  | "prescription"
  | "clinical_chat"
  | "billing_insight"
  | "lab_summary"
  | "search_rerank";

export type AiProviderId = "gemini" | "groq" | "huggingface" | "local";

export type AiCompletionRequest = {
  task: AiTask;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

export type AiCompletionResult = {
  text: string;
  provider: AiProviderId;
  model: string;
};

export type KnowledgeChunk = {
  id: string;
  category: "patient" | "drug" | "invoice" | "encounter" | "clinical" | "nav" | "erp";
  title: string;
  body: string;
  keywords: string[];
  to?: string;
};

export type SemanticSearchHit = {
  chunk: KnowledgeChunk;
  score: number;
  matchReason?: string;
};

export type PrescriptionAiServerInput = {
  dossier: string;
  localSummary: string;
  suggestionNames: string[];
  alertTitles: string[];
  draftDrugIds: string[];
  clinicianQuery?: string;
};

export type PrescriptionAiServerOutput = {
  clinicalNarrative: string;
  modelSource: string;
  ragSnippets: string[];
  phiRedacted?: boolean;
  complianceNote?: string;
};

export type ClinicalChatInput = {
  query: string;
  context?: "prescribing" | "general" | "billing" | "lab";
  patientDossier?: string;
};

export type ClinicalChatOutput = {
  answer: string;
  modelSource: string;
  disclaimer: string;
  hipaaNote?: string;
  phiRedacted?: boolean;
};
