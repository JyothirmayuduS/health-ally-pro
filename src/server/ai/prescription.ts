import type {
  ClinicalChatInput,
  ClinicalChatOutput,
  PrescriptionAiServerInput,
  PrescriptionAiServerOutput,
} from "@/lib/ai/types";
import { ragContextBlock } from "@/lib/ai/knowledge-index";
import { retrieveRagContextAsync } from "./vector-rag";
import { completeWithCompliance, formatModelSource } from "./secure-ai";
import { hasAnyAiProvider } from "./env";
import { getAiComplianceConfig, HIPAA_DISCLAIMER } from "./compliance";

const CLINICAL_DISCLAIMER =
  "AI-assisted guidance only. Licensed clinician must verify all decisions before prescribing or treating.";

const PRESCRIPTION_SYSTEM = `You are Medora Clinical Intelligence, an e-prescribing assistant for licensed physicians in a hospital EMR.
Use the patient dossier, formulary RAG context, local analysis, and safety alerts provided.
Provide 4-6 concise bullet points: prescribing rationale, first-line options from formulary, sig tips, and safety warnings.
Never replace clinical judgment. Do not invent drugs outside the formulary list.`;

export async function runPrescriptionAi(
  input: PrescriptionAiServerInput,
  auditSource = "web",
): Promise<PrescriptionAiServerOutput | null> {
  if (!hasAnyAiProvider()) return null;

  const ragQuery = [
    input.clinicianQuery,
    input.suggestionNames.join(" "),
    input.draftDrugIds.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const ragChunks = await retrieveRagContextAsync(ragQuery || input.localSummary, 6);
  const ragBlock = ragContextBlock(ragChunks);

  const userPrompt = [
    input.dossier,
    ragBlock ? `Relevant formulary & hospital context:\n${ragBlock}` : "",
    `Local analysis summary: ${input.localSummary}`,
    input.suggestionNames.length
      ? `Ranked suggestions: ${input.suggestionNames.join(", ")}`
      : "",
    input.alertTitles.length ? `Safety alerts: ${input.alertTitles.join("; ")}` : "",
    input.draftDrugIds.length
      ? `Draft lines: ${input.draftDrugIds.join(", ")}`
      : "No draft prescription lines yet.",
    input.clinicianQuery ? `Physician question: ${input.clinicianQuery}` : "",
    "Provide clinical prescribing recommendations as bullet points.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await completeWithCompliance({
    task: "prescription",
    taskLabel: "prescription_analyze",
    system: PRESCRIPTION_SYSTEM,
    user: userPrompt,
    maxTokens: 650,
    temperature: 0.35,
    auditSource,
  });

  if (!result) return null;

  return {
    clinicalNarrative: result.text,
    modelSource: formatModelSource(result),
    ragSnippets: ragChunks.map((c) => c.title),
    phiRedacted: result.phiRedacted,
    complianceNote: result.baaCompliant
      ? "BAA-eligible provider"
      : "Non-BAA provider — PHI redacted",
  };
}

const CHAT_SYSTEMS: Record<NonNullable<ClinicalChatInput["context"]>, string> = {
  prescribing:
    "You are Medora Clinical Intelligence for physicians. Answer prescribing and formulary questions concisely with evidence-based bullets.",
  general:
    "You are Medora hospital assistant. Help staff navigate clinical and operational workflows. Be concise and professional.",
  billing:
    "You are Medora finance assistant. Help with billing, revenue, invoices, and hospital KPIs. Use numbers when available.",
  lab: "You are Medora lab assistant. Help with test orders, sample status, and lab workflow. Be precise.",
};

export async function runClinicalChat(
  input: ClinicalChatInput,
  auditSource = "web",
): Promise<ClinicalChatOutput> {
  const context = input.context ?? "general";
  const ragChunks = await retrieveRagContextAsync(input.query, 5);
  const ragBlock = ragContextBlock(ragChunks);

  const userPrompt = [
    input.patientDossier ? `Patient context:\n${input.patientDossier}` : "",
    ragBlock ? `Hospital knowledge:\n${ragBlock}` : "",
    `Question: ${input.query}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await completeWithCompliance({
    task: context === "prescribing" ? "prescription" : "clinical_chat",
    taskLabel: `clinical_chat_${context}`,
    system: CHAT_SYSTEMS[context],
    user: userPrompt,
    maxTokens: 500,
    temperature: 0.4,
    auditSource,
  });

  if (result) {
    return {
      answer: result.text,
      modelSource: formatModelSource(result),
      disclaimer: CLINICAL_DISCLAIMER,
      hipaaNote: HIPAA_DISCLAIMER,
      phiRedacted: result.phiRedacted,
    };
  }

  const fallback = ragChunks.length
    ? `Based on hospital records:\n${ragChunks.map((c) => `• ${c.title}: ${c.body.slice(0, 120)}…`).join("\n")}`
    : "Cloud AI unavailable. Configure GEMINI_API_KEY (BAA via Google Cloud) on the server.";

  return {
    answer: fallback,
    modelSource: "Medora Clinical Intelligence (on-device RAG)",
    disclaimer: CLINICAL_DISCLAIMER,
    hipaaNote: HIPAA_DISCLAIMER,
    phiRedacted: getAiComplianceConfig().phiRedactionEnabled,
  };
}

export async function runHospitalInsights(auditSource = "web"): Promise<ClinicalChatOutput> {
  const ragChunks = await retrieveRagContextAsync("finance ipd opd lab ot occupancy revenue", 8);
  const prompt = `Summarize today's hospital operational priorities in 5 bullets for the admin command center.\n\n${ragContextBlock(ragChunks)}`;

  const result = await completeWithCompliance({
    task: "billing_insight",
    taskLabel: "hospital_insights",
    system:
      "You are Medora hospital operations AI. Provide an executive briefing for hospital administrators. Use bullet points with metrics.",
    user: prompt,
    maxTokens: 400,
    temperature: 0.3,
    auditSource,
  });

  if (result) {
    return {
      answer: result.text,
      modelSource: formatModelSource(result),
      disclaimer: "Operational AI summary — verify against live dashboards.",
      hipaaNote: HIPAA_DISCLAIMER,
      phiRedacted: result.phiRedacted,
    };
  }

  return {
    answer: ragChunks.map((c) => `• ${c.title}: ${c.body}`).join("\n"),
    modelSource: "Medora ERP Intelligence (on-device)",
    disclaimer: "Operational summary from cached hospital data.",
    hipaaNote: HIPAA_DISCLAIMER,
    phiRedacted: false,
  };
}

/** Native patient assistant — PHI always redacted */
export async function runPatientAssistantChat(
  query: string,
  patientDossier: string,
  auditSource = "native",
): Promise<ClinicalChatOutput> {
  return runClinicalChat(
    {
      query,
      context: "general",
      patientDossier,
    },
    auditSource,
  );
}
