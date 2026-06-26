/**
 * Medora Global Intelligence - Global Context Retriever (RAG)
 * Routes inference through the secure Medora web server (PHI redacted, audited).
 */

import { medications, doctors, appointments, reports, dietMeals, patient } from '../mock-data';
import { medoraApiChat } from './medora-api';

export type AIIntent = 'DIET' | 'SYMPTOM' | 'MEDICINE' | 'DOUBT' | 'GENERAL';

export interface AIResponse {
  intent: AIIntent;
  answer: string;
  source: string;
  analysisSteps: string[];
}

const buildGlobalContext = (query: string): string => {
  let context = `Patient Profile: ${patient.name}, ${patient.age}y, Blood Group: ${patient.bloodGroup}\n\n`;

  const meds = medications.map(m => `- ${m.name} (${m.dosage}): ${m.reason}`).join('\n');
  context += `Current Medications:\n${meds}\n\n`;

  const recentReports = reports.slice(0, 3).map(r => `- ${r.title} (${r.date}) by ${r.doctor}`).join('\n');
  context += `Recent Clinical Reports:\n${recentReports}\n\n`;

  const diet = dietMeals.slice(0, 2).map(m => `- ${m.name}: ${m.clinicalRationale}`).join('\n');
  context += `Current Clinical Diet Plan:\n${diet}\n\n`;

  const team = doctors.slice(0, 3).map(d => `- ${d.name} (${d.specialty})`).join('\n');
  context += `Active Care Team:\n${team}\n\n`;

  return context;
};

const detectIntent = (query: string): AIIntent => {
  const q = query.toLowerCase();
  if (['cook', 'recipe', 'diet', 'eat', 'meal', 'nutrition'].some(k => q.includes(k))) return 'DIET';
  if (['pain', 'ache', 'feel', 'hurt', 'dizzy', 'tired', 'symptom'].some(k => q.includes(k))) return 'SYMPTOM';
  if (['pill', 'dose', 'medication', 'side effect', 'take'].some(k => q.includes(k))) return 'MEDICINE';
  if (['why', 'how', 'what', 'understand', 'explain', 'lab', 'report', 'test'].some(k => q.includes(k))) return 'DOUBT';
  return 'GENERAL';
};

const localFallback = (intent: AIIntent): string => {
  if (intent === 'MEDICINE') {
    return "Based on your chart, continue medications as prescribed. Contact your care team before changing doses. This is general guidance — not a substitute for your doctor.";
  }
  if (intent === 'DIET') {
    return "Follow your clinical diet plan and prioritize low-glycemic, high-fiber meals. Your care team can adjust recommendations based on recent labs.";
  }
  if (intent === 'SYMPTOM') {
    return "If symptoms are new, severe, or worsening, contact your hospital or emergency services. Hydration and rest may help mild symptoms — verify with your clinician.";
  }
  return "I'm in offline mode. Please connect to the Medora server for personalized AI answers, or contact your care team directly.";
};

export const classifyAndAnswer = async (
  query: string,
  onStep: (step: string) => void
): Promise<AIResponse> => {
  const intent = detectIntent(query);
  const steps: string[] = [];

  const stepWrapper = (step: string) => {
    steps.push(step);
    onStep(step);
  };

  try {
    stepWrapper("Retrieving Global Medical Dossier...");
    const globalContext = buildGlobalContext(query);
    await new Promise(r => setTimeout(r, 400));

    stepWrapper("Sending de-identified context to Medora AI (PHI redacted)...");
    const apiResult = await medoraApiChat(query, globalContext, stepWrapper);

    return {
      intent,
      answer: apiResult.answer,
      source: `${apiResult.modelSource}${apiResult.phiRedacted ? " · PHI redacted" : ""}`,
      analysisSteps: steps,
    };
  } catch {
    stepWrapper("Secure server unreachable — using local guidance...");
    await new Promise(r => setTimeout(r, 600));

    return {
      intent,
      answer: localFallback(intent),
      source: "Medora Edge (offline fallback)",
      analysisSteps: steps,
    };
  }
};
