import { apkDoctor } from "@/lib/doctor-apk-data";
import {
  getPatientProblems,
  getPatientMedications,
  getPatientHistoryRx,
  type PanelPatient,
} from "@/lib/doctor-patients-apk-data";
import { parseAllergieSubstances } from "@/lib/patient-allergy";
import { DRUGS, type Drug } from "@/lib/pharmacy-desk/mockData";

export type AiAlertSeverity = "critical" | "warning" | "info";

export type AiAlert = {
  id: string;
  severity: AiAlertSeverity;
  title: string;
  detail: string;
};

export type AiSuggestionTier = "first-line" | "alternative" | "caution";

export type AiMedicationSuggestion = {
  id: string;
  drug_id: string;
  drug_name: string;
  strength: string;
  sig: string;
  qty_prescribed: number;
  days_supply: number;
  refills_allowed: number;
  confidence: number;
  rationale: string;
  guideline: string;
  tier: AiSuggestionTier;
};

export type PrescriptionAiAnalysis = {
  summary: string;
  suggestions: AiMedicationSuggestion[];
  alerts: AiAlert[];
  analysisSteps: string[];
  modelSource: string;
  clinicalNarrative?: string;
};

export type PrescriptionAiContext = {
  patient: PanelPatient;
  draftDrugIds: string[];
  clinicianQuery?: string;
};

const MODEL_PRIORITY = [
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
  "Qwen/Qwen2.5-72B-Instruct",
];

const NSAID_NAMES = ["ibuprofen", "aspirin", "naproxen", "diclofenac"];
const PENICILLIN_NAMES = ["amoxicillin", "ampicillin", "penicillin"];

function drugById(id: string): Drug | undefined {
  return DRUGS.find((d) => d.id === id);
}

function parseAllergies(patient: PanelPatient): string[] {
  return parseAllergieSubstances(patient.allergyWarning).map((s) => s.toLowerCase());
}

export { parseAllergieSubstances };

function matchesAllergy(drug: Drug, allergies: string[]): boolean {
  const hay = `${drug.generic_name} ${drug.brand_names.join(" ")}`.toLowerCase();
  return allergies.some((a) => {
    if (a.includes("aspirin") || a.includes("salicylate")) {
      return NSAID_NAMES.some((n) => hay.includes(n)) || hay.includes("aspirin");
    }
    if (a.includes("penicillin")) {
      return PENICILLIN_NAMES.some((n) => hay.includes(n));
    }
    return hay.includes(a);
  });
}

function buildPatientDossier(patient: PanelPatient): string {
  const problems = getPatientProblems(patient.id);
  const meds = getPatientMedications(patient.id).filter((m) => m.status === "ACTIVE");
  const recentRx = getPatientHistoryRx(patient.id).slice(0, 3);
  const allergies = parseAllergies(patient);

  return [
    `Patient: ${patient.name}, ${patient.age}y ${patient.gender}, ref ${patient.patientRef}`,
    `Primary condition: ${patient.condition}`,
    `Status: ${patient.status}${patient.alert ? ` — ${patient.alert}` : ""}`,
    allergies.length ? `Allergies: ${allergies.join(", ")}` : "Allergies: none documented",
    problems.length
      ? `Active problems: ${problems.map((p) => `${p.label} (${p.icd}, ${p.status})`).join("; ")}`
      : "",
    meds.length
      ? `Current meds: ${meds.map((m) => `${m.name} ${m.strength} ${m.frequency}`).join("; ")}`
      : "Current meds: none active",
    recentRx.length ? `Recent Rx: ${recentRx.map((r) => r.title).join("; ")}` : "",
    `Prescribing clinician: ${apkDoctor.name}, ${apkDoctor.specialty}`,
    `Formulary: ${DRUGS.filter((d) => d.rx_required).map((d) => d.generic_name).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

type RulePack = {
  drug_id: string;
  sig: string;
  qty: number;
  days: number;
  refills: number;
  confidence: number;
  rationale: string;
  guideline: string;
  tier: AiSuggestionTier;
};

function rulesForPatient(patient: PanelPatient, allergies: string[]): RulePack[] {
  const id = patient.id;
  const packs: RulePack[] = [];

  const add = (pack: RulePack) => {
    const drug = drugById(pack.drug_id);
    if (!drug || matchesAllergy(drug, allergies)) return;
    packs.push(pack);
  };

  if (id === "p1") {
    add({
      drug_id: "drug-sal100",
      sig: "1–2 puffs inhaled every 4–6 hours as needed for wheeze",
      qty: 1,
      days: 90,
      refills: 2,
      confidence: 94,
      rationale: "Rescue bronchodilator for poorly controlled asthma with frequent rescue use.",
      guideline: "GINA 2024 — Step 2+ short-acting beta-agonist PRN",
      tier: "first-line",
    });
    add({
      drug_id: "drug-pred5",
      sig: "40 mg (8 tablets) once daily with food for 5 days",
      qty: 40,
      days: 5,
      refills: 0,
      confidence: 88,
      rationale: "Acute exacerbation with low O2 — short oral steroid to prevent admission.",
      guideline: "GINA exacerbation bundle — oral corticosteroid 5 days",
      tier: "first-line",
    });
    add({
      drug_id: "drug-azt250",
      sig: "500 mg once daily × 3 days if bacterial trigger suspected",
      qty: 1,
      days: 3,
      refills: 0,
      confidence: 62,
      rationale: "Alternative if purulent sputum; avoid if viral trigger only.",
      guideline: "ATS community-acquired infection guidance",
      tier: "alternative",
    });
  }

  if (id === "p2") {
    add({
      drug_id: "drug-aml5",
      sig: "5 mg once daily in the morning",
      qty: 30,
      days: 30,
      refills: 3,
      confidence: 91,
      rationale: "Essential HTN — CCB well tolerated; aligns with current amlodipine therapy.",
      guideline: "JNC/AHA — first-line CCB for hypertension",
      tier: "first-line",
    });
    add({
      drug_id: "drug-los50",
      sig: "50 mg once daily",
      qty: 30,
      days: 30,
      refills: 3,
      confidence: 85,
      rationale: "ARB alternative if CCB edema or cough develops.",
      guideline: "JNC/AHA — ARB class for HTN",
      tier: "alternative",
    });
    add({
      drug_id: "drug-ato40",
      sig: "40 mg once daily at bedtime",
      qty: 30,
      days: 30,
      refills: 3,
      confidence: 90,
      rationale: "Hyperlipidemia on active problem list — LDL still above target on lifestyle alone.",
      guideline: "ACC/AHA — moderate-intensity statin for ASCVD risk",
      tier: "first-line",
    });
    add({
      drug_id: "drug-hct25",
      sig: "12.5 mg every morning",
      qty: 30,
      days: 30,
      refills: 3,
      confidence: 72,
      rationale: "Add-on if BP remains >130/80 on monotherapy.",
      guideline: "JNC — thiazide add-on therapy",
      tier: "alternative",
    });
  }

  if (id === "p3") {
    add({
      drug_id: "drug-met500",
      sig: "500 mg twice daily with meals",
      qty: 60,
      days: 30,
      refills: 3,
      confidence: 93,
      rationale: "T2DM suboptimal control — metformin first-line; renew before lapse.",
      guideline: "ADA Standards of Care — metformin unless contraindicated",
      tier: "first-line",
    });
    add({
      drug_id: "drug-gli1",
      sig: "1 mg once daily before breakfast",
      qty: 30,
      days: 30,
      refills: 2,
      confidence: 78,
      rationale: "Add-on secretagogue when HbA1c above goal on metformin alone.",
      guideline: "ADA — consider sulfonylurea add-on with hypoglycemia counseling",
      tier: "alternative",
    });
    add({
      drug_id: "drug-ins100",
      sig: "10 units subcutaneously at bedtime",
      qty: 1,
      days: 30,
      refills: 2,
      confidence: 65,
      rationale: "Basal insulin if oral dual therapy insufficient — high-alert med.",
      guideline: "ADA — basal insulin when A1c > goal on orals",
      tier: "caution",
    });
  }

  if (id === "p4") {
    add({
      drug_id: "drug-asp75",
      sig: "75 mg once daily after food",
      qty: 30,
      days: 30,
      refills: 5,
      confidence: 96,
      rationale: "Post-PCI DAPT — aspirin continuation per cardiology plan.",
      guideline: "ESC post-PCI antiplatelet therapy",
      tier: "first-line",
    });
    add({
      drug_id: "drug-ato40",
      sig: "40 mg once daily at night",
      qty: 30,
      days: 30,
      refills: 5,
      confidence: 94,
      rationale: "High-intensity statin for secondary prevention post-PCI.",
      guideline: "ACC/AHA — high-intensity statin post-ACS/PCI",
      tier: "first-line",
    });
    add({
      drug_id: "drug-lis10",
      sig: "5 mg once daily",
      qty: 30,
      days: 30,
      refills: 3,
      confidence: 70,
      rationale: "ACE inhibitor if LV dysfunction or HTN co-management needed.",
      guideline: "Post-MI cardioprotection — ACE-I when indicated",
      tier: "alternative",
    });
  }

  if (id === "p5") {
    add({
      drug_id: "drug-ome20",
      sig: "20 mg once daily 30 minutes before breakfast",
      qty: 30,
      days: 30,
      refills: 2,
      confidence: 86,
      rationale: "GERD symptom control — PPI before breakfast most effective.",
      guideline: "ACG GERD guideline — daily PPI",
      tier: "first-line",
    });
  }

  if (packs.length === 0) {
    const condition = patient.condition.toLowerCase();
    if (condition.includes("hypertension") || condition.includes("cardiac")) {
      add({
        drug_id: "drug-los50",
        sig: "50 mg once daily",
        qty: 30,
        days: 30,
        refills: 3,
        confidence: 75,
        rationale: "ARB first-line for hypertension based on problem list.",
        guideline: "JNC/AHA hypertension",
        tier: "first-line",
      });
    }
    if (condition.includes("diabetes")) {
      add({
        drug_id: "drug-met500",
        sig: "500 mg twice daily with meals",
        qty: 60,
        days: 30,
        refills: 3,
        confidence: 80,
        rationale: "Metformin anchor therapy for type 2 diabetes.",
        guideline: "ADA Standards of Care",
        tier: "first-line",
      });
    }
    if (condition.includes("asthma")) {
      add({
        drug_id: "drug-sal100",
        sig: "1–2 puffs inhaled PRN wheeze",
        qty: 1,
        days: 90,
        refills: 2,
        confidence: 82,
        rationale: "SABA rescue for asthma symptoms.",
        guideline: "GINA stepwise therapy",
        tier: "first-line",
      });
    }
  }

  return packs.sort((a, b) => b.confidence - a.confidence);
}

function detectInteractionAlerts(
  patient: PanelPatient,
  draftDrugIds: string[],
  allergies: string[],
): AiAlert[] {
  const alerts: AiAlert[] = [];
  const activeMeds = getPatientMedications(patient.id).filter((m) => m.status === "ACTIVE");

  if (allergies.length) {
    alerts.push({
      id: "allergy-doc",
      severity: "warning",
      title: "Allergy on file — review",
      detail: `${patient.allergyWarning ?? allergies.join(", ")}. Verify prescribed drugs are safe before sending.`,
    });
  }

  for (const drugId of draftDrugIds) {
    const drug = drugById(drugId);
    if (!drug) continue;
    if (matchesAllergy(drug, allergies)) {
      alerts.push({
        id: `allergy-${drugId}`,
        severity: "critical",
        title: `${drug.generic_name} — allergy conflict`,
        detail: `Conflicts with documented allergy (${allergies.join(", ")}). Remove this drug or choose an alternative.`,
      });
    }
    if (drug.lasa_pair) {
      const pair = drugById(drug.lasa_pair);
      if (pair) {
        alerts.push({
          id: `lasa-${drugId}`,
          severity: "warning",
          title: "Look-alike / sound-alike pair",
          detail: `Verify not ${pair.generic_name} — LASA pair in formulary.`,
        });
      }
    }
    if (drug.high_alert) {
      alerts.push({
        id: `ha-${drugId}`,
        severity: "warning",
        title: `${drug.generic_name} — high-alert medication`,
        detail: drug.counseling ?? "Requires additional verification before sending.",
      });
    }
    if (drug.controlled_schedule) {
      alerts.push({
        id: `cs-${drugId}`,
        severity: "warning",
        title: `${drug.controlled_schedule} controlled substance`,
        detail: "EPCS signature and PDMP check required in production.",
      });
    }
  }

  const draftNames = draftDrugIds.map((id) => drugById(id)?.generic_name.toLowerCase() ?? "");
  const onMetformin = activeMeds.some((m) => m.name.toLowerCase().includes("metformin"));
  const onAce = activeMeds.some((m) => /lisinopril|losartan|telmisartan|ramipril/i.test(m.name));
  const addingNsaid = draftNames.some((n) => NSAID_NAMES.some((x) => n.includes(x)));
  const addingAce = draftNames.some((n) => /lisinopril|losartan/i.test(n));

  if (onMetformin && draftNames.some((n) => n.includes("contrast"))) {
    alerts.push({
      id: "met-contrast",
      severity: "warning",
      title: "Metformin + contrast caution",
      detail: "Hold metformin around iodinated contrast per renal function.",
    });
  }

  if ((onAce || addingAce) && draftNames.some((n) => n.includes("potassium"))) {
    alerts.push({
      id: "ace-k",
      severity: "warning",
      title: "ACE/ARB + potassium risk",
      detail: "Monitor serum potassium if combining RAAS blocker with supplements.",
    });
  }

  if (patient.id === "p4" && addingNsaid && !draftNames.some((n) => n.includes("aspirin"))) {
    alerts.push({
      id: "pci-nsaid",
      severity: "critical",
      title: "NSAID after PCI",
      detail: "Avoid non-aspirin NSAIDs in post-PCI patients unless cardiology approves.",
    });
  }

  if (patient.id === "p1" && addingNsaid) {
    alerts.push({
      id: "asthma-nsaid",
      severity: "warning",
      title: "NSAID in aspirin-sensitive asthma",
      detail: "Cross-reactivity risk — prefer paracetamol for analgesia.",
    });
  }

  const stockLow = draftDrugIds
    .map((id) => drugById(id))
    .filter((d): d is Drug => !!d)
    .filter((d) => d.id === "drug-ome20");

  if (stockLow.length) {
    alerts.push({
      id: "stock-ome",
      severity: "info",
      title: "Low formulary stock",
      detail: "Omeprazole below reorder level — pharmacy may substitute or delay.",
    });
  }

  return alerts;
}

function packsToSuggestions(packs: RulePack[]): AiMedicationSuggestion[] {
  return packs.map((p, i) => {
    const drug = drugById(p.drug_id)!;
    return {
      id: `sug-${p.drug_id}-${i}`,
      drug_id: p.drug_id,
      drug_name: drug.generic_name,
      strength: drug.strength,
      sig: p.sig,
      qty_prescribed: p.qty,
      days_supply: p.days,
      refills_allowed: p.refills,
      confidence: p.confidence,
      rationale: p.rationale,
      guideline: p.guideline,
      tier: p.tier,
    };
  });
}

function buildLocalAnalysis(ctx: PrescriptionAiContext): PrescriptionAiAnalysis {
  const allergies = parseAllergies(ctx.patient);
  const packs = rulesForPatient(ctx.patient, allergies);
  const suggestions = packsToSuggestions(packs);
  const alerts = detectInteractionAlerts(ctx.patient, ctx.draftDrugIds, allergies);

  const top = suggestions[0];
  const summary = top
    ? `Based on ${ctx.patient.name}'s chart, ${top.drug_name} is the highest-confidence recommendation (${top.confidence}%) for ${ctx.patient.condition.toLowerCase()}. ${suggestions.length} formulary options ranked.`
    : `Review ${ctx.patient.name}'s chart and select medications from the formulary.`;

  let clinicalNarrative = [
    `Clinical synthesis for ${ctx.patient.name}:`,
    top ? `• Primary recommendation: ${top.drug_name} ${top.strength} — ${top.rationale}` : "",
    suggestions.length > 1
      ? `• Alternatives: ${suggestions.slice(1, 3).map((s) => s.drug_name).join(", ")}`
      : "",
    alerts.length ? `• ${alerts.length} safety alert(s) require attention before signing.` : "• No critical safety blocks detected.",
    ctx.clinicianQuery ? `• Query addressed: ${ctx.clinicianQuery}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (ctx.clinicianQuery) {
    const q = ctx.clinicianQuery.toLowerCase();
    if (q.includes("refill") || q.includes("renew")) {
      const active = getPatientMedications(ctx.patient.id).filter((m) => m.status === "ACTIVE");
      clinicalNarrative += `\n• Refill candidates: ${active.map((m) => m.name).join(", ") || "none on chart"}.`;
    }
    if (q.includes("interaction")) {
      clinicalNarrative += `\n• Interaction scan complete across ${ctx.draftDrugIds.length} draft line(s) and active therapy.`;
    }
  }

  return {
    summary,
    suggestions,
    alerts,
    analysisSteps: [],
    modelSource: "Medora Clinical Intelligence (on-device)",
    clinicalNarrative,
  };
}

async function queryCloudModel(
  prompt: string,
  onStep: (step: string) => void,
  serverInput?: {
    dossier: string;
    localSummary: string;
    suggestionNames: string[];
    alertTitles: string[];
    draftDrugIds: string[];
    clinicianQuery?: string;
  },
): Promise<{ text: string; source: string; ragSnippets?: string[] } | null> {
  if (serverInput) {
    try {
      onStep("Connecting to Medora neural engine (server)…");
      const { medoraPrescriptionAi } = await import("@/lib/ai/medora-ai");
      const result = await medoraPrescriptionAi({ data: serverInput });
      if (result?.clinicalNarrative) {
        onStep("Clinical synthesis complete.");
        return {
          text: result.clinicalNarrative,
          source: result.modelSource,
          ragSnippets: result.ragSnippets,
        };
      }
    } catch {
      onStep("Server AI unavailable — trying legacy fallback…");
    }
  }

  const token = import.meta.env.VITE_HUGGINGFACE_TOKEN as string | undefined;
  if (!token) return null;

  onStep("Connecting to Medora neural prescribing engine…");
  await delay(400);

  for (const modelId of MODEL_PRIORITY) {
    try {
      onStep(`Analyzing with ${modelId.split("/")[1]}…`);
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: "system",
              content:
                "You are Medora Clinical Intelligence, an e-prescribing assistant for licensed physicians. Given patient context, provide concise prescribing rationale, first-line medication suggestions from the formulary list, sig recommendations, and safety warnings. Never replace clinical judgment. Use bullet points.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.4,
        }),
      });

      if (response.status === 404 || response.status === 401) continue;
      if (response.status === 503) {
        await delay(1500);
        continue;
      }
      if (!response.ok) continue;

      const result = await response.json();
      const answer = result.choices?.[0]?.message?.content?.trim();
      if (answer) {
        return { text: answer, source: "Medora Neural Engine (cloud)" };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function analyzePrescriptionContext(
  ctx: PrescriptionAiContext,
  onStep?: (step: string) => void,
): Promise<PrescriptionAiAnalysis> {
  const steps: string[] = [];
  const step = (s: string) => {
    steps.push(s);
    onStep?.(s);
  };

  step("Loading patient chart & problem list…");
  await delay(350);

  step("Cross-referencing active medications…");
  await delay(300);

  const dossier = buildPatientDossier(ctx.patient);
  const local = buildLocalAnalysis(ctx);
  local.analysisSteps = [...steps];

  step("Running interaction & allergy checks…");
  await delay(400);

  step("Ranking formulary recommendations…");
  await delay(350);

  const cloudPrompt = [
    dossier,
    ctx.draftDrugIds.length
      ? `Draft prescription lines: ${ctx.draftDrugIds.map((id) => drugById(id)?.generic_name).join(", ")}`
      : "No draft lines yet.",
    ctx.clinicianQuery ? `Physician question: ${ctx.clinicianQuery}` : "",
    "Provide 3-5 bullet clinical recommendations for this prescribing session.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const cloudAnswer = await queryCloudModel(cloudPrompt, step, {
    dossier,
    localSummary: local.summary,
    suggestionNames: local.suggestions.map((s) => s.drug_name),
    alertTitles: local.alerts.map((a) => a.title),
    draftDrugIds: ctx.draftDrugIds,
    clinicianQuery: ctx.clinicianQuery,
  });

  if (cloudAnswer) {
    return {
      ...local,
      clinicalNarrative: cloudAnswer.text,
      modelSource: cloudAnswer.source,
      analysisSteps: steps,
    };
  }

  step("Synthesizing on-device clinical recommendations…");
  await delay(300);

  return {
    ...local,
    analysisSteps: [...steps, "Clinical synthesis complete."],
  };
}

export function quickSafetyScan(
  patient: PanelPatient,
  draftDrugIds: string[],
): AiAlert[] {
  return detectInteractionAlerts(patient, draftDrugIds, parseAllergies(patient));
}

export const SIG_TEMPLATES = [
  "Take 1 tablet by mouth once daily",
  "Take 1 tablet by mouth twice daily with meals",
  "Take 1 tablet by mouth at bedtime",
  "Take 1 tablet by mouth every 8 hours as needed for pain",
  "Inhale 1–2 puffs every 4–6 hours as needed",
] as const;

export const PHARMACY_OPTIONS = [
  { id: "oak-central", name: "Oak Haven Central Pharmacy", distance: "0.4 km", preferred: true },
  { id: "medplus", name: "MedPlus Express", distance: "1.2 km", preferred: false },
  { id: "apollo", name: "Apollo 24×7 — Koramangala", distance: "2.1 km", preferred: false },
] as const;
