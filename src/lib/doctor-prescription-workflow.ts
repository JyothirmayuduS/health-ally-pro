import type { PanelPatient } from "@/lib/doctor-patients-apk-data";
import { getPatientProblems } from "@/lib/doctor-patients-apk-data";
import { quickSafetyScan } from "@/lib/doctor-prescription-ai";
import { DRUGS, type Drug } from "@/lib/pharmacy-desk/mockData";
import type { DoctorRxLine } from "@/lib/pharmacy-desk/prescription-bridge";

export type RxFrequency = "OD" | "BD" | "TDS" | "QID" | "HS" | "SOS" | "Q6H" | "Q8H" | "Weekly" | "Custom";
export type RxType = "regular" | "controlled" | "narcotic";
export type PatientLanguage = "en" | "hi" | "te" | "ta";

export type PrescriptionLineDraft = DoctorRxLine & {
  key: string;
  route: string;
  frequency: RxFrequency;
  timing: string[];
  durationDays: number;
  allowGeneric: boolean;
  drugNotes: string;
};

export type PrescriptionDraft = {
  patientId: string;
  diagnosis: string;
  diagnosisIcd?: string;
  lines: PrescriptionLineDraft[];
  patientInstructions: string;
  instructionTags: string[];
  pharmacistNotes: string;
  validFrom: string;
  validUntil: string;
  rxType: RxType;
  followUpRequired: boolean;
  followUpNote: string;
  pharmacyId: string;
  patientLanguage: PatientLanguage;
  printInPatientLanguage: boolean;
  priority: "routine" | "urgent" | "stat";
  updatedAt: string;
};

export const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Suspension",
  "Drops",
  "Injection",
  "Cream",
  "Ointment",
  "Inhaler",
  "Patch",
] as const;

export const ROUTES = [
  "Oral",
  "IV",
  "IM",
  "SC",
  "Topical",
  "Inhaled",
  "Sublingual",
  "Rectal",
  "Nasal",
  "Ophthalmic",
] as const;

export const FREQUENCIES: { id: RxFrequency; label: string; perDay: number }[] = [
  { id: "OD", label: "OD", perDay: 1 },
  { id: "BD", label: "BD", perDay: 2 },
  { id: "TDS", label: "TDS", perDay: 3 },
  { id: "QID", label: "QID", perDay: 4 },
  { id: "HS", label: "HS", perDay: 1 },
  { id: "SOS", label: "SOS", perDay: 1 },
  { id: "Q6H", label: "Q6H", perDay: 4 },
  { id: "Q8H", label: "Q8H", perDay: 3 },
  { id: "Weekly", label: "Weekly", perDay: 1 / 7 },
  { id: "Custom", label: "Custom", perDay: 1 },
];

export const TIMING_OPTIONS = [
  "Before meals",
  "After meals",
  "With food",
  "Empty stomach",
  "With water",
  "At bedtime",
  "In the morning",
  "With milk",
  "Avoid dairy",
] as const;

export const DURATION_OPTIONS = [
  { label: "3 days", days: 3 },
  { label: "5 days", days: 5 },
  { label: "7 days", days: 7 },
  { label: "10 days", days: 10 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "Ongoing", days: 365 },
] as const;

export const PATIENT_INSTRUCTION_TAGS = [
  "Take with food",
  "Avoid alcohol",
  "Do not drive",
  "Keep refrigerated",
  "Finish full course",
  "Monitor blood sugar",
  "Check BP daily",
  "Return if worsens",
] as const;

export const RX_TEMPLATES = [
  {
    id: "starter",
    label: "Starter pack",
    diagnosis: "Acute illness — symptomatic",
    lines: [{ drug_id: "drug-par500", frequency: "QID" as RxFrequency, durationDays: 5 }],
  },
  {
    id: "htn-combo",
    label: "Hypertension combo",
    diagnosis: "Essential hypertension",
    lines: [
      { drug_id: "drug-aml5", frequency: "OD" as RxFrequency, durationDays: 30 },
      { drug_id: "drug-hct25", frequency: "OD" as RxFrequency, durationDays: 30 },
    ],
  },
  {
    id: "fever",
    label: "Fever protocol",
    diagnosis: "Fever — symptomatic relief",
    lines: [{ drug_id: "drug-par500", frequency: "Q6H" as RxFrequency, durationDays: 3 }],
  },
] as const;

export const FREQUENT_DRUG_IDS = [
  "drug-par500",
  "drug-azt250",
  "drug-ome20",
  "drug-met500",
  "drug-hct25",
  "drug-lis10",
] as const;

export type DrugMonograph = {
  drugClass: string;
  whyUsed: string;
  whoShouldReceive: string;
  howToTake: string;
  warnings?: string;
  commonSideEffects?: string;
};

const DRUG_CLASSES: Record<string, string> = {
  "drug-amx500": "Penicillin antibiotic",
  "drug-hct25": "Thiazide diuretic",
  "drug-lis10": "ACE inhibitor",
  "drug-los50": "ARB",
  "drug-met500": "Biguanide",
  "drug-ato40": "Statin",
  "drug-aml5": "CCB",
  "drug-par500": "Analgesic / antipyretic",
  "drug-ibu400": "NSAID",
  "drug-azt250": "Macrolide antibiotic",
  "drug-ome20": "PPI",
  "drug-sal100": "SABA bronchodilator",
  "drug-pred5": "Corticosteroid",
  "drug-gli1": "Sulfonylurea",
  "drug-ins100": "Basal insulin",
  "drug-asp75": "Antiplatelet",
  "drug-oxy5": "Opioid analgesic",
  "drug-vacflu": "Inactivated vaccine",
};

const MONOGRAPHS: Record<string, DrugMonograph> = {
  "drug-amx500": {
    drugClass: "Penicillin antibiotic",
    whyUsed:
      "Treats bacterial infections including otitis media, sinusitis, streptococcal pharyngitis, and uncomplicated UTI. Bactericidal via cell-wall synthesis inhibition.",
    whoShouldReceive:
      "Adults and children per weight-based dosing. Avoid if history of anaphylaxis to penicillins. Adjust dose in severe renal impairment.",
    howToTake:
      "500 mg orally every 8 hours (or as prescribed). May take with or without food. Space doses evenly and complete the full course even if symptoms improve.",
    warnings: "Cross-reactivity possible with cephalosporins in penicillin-allergic patients. Not for viral infections.",
    commonSideEffects: "Nausea, diarrhoea, rash. Seek care for urticaria, breathing difficulty, or severe diarrhoea.",
  },
  "drug-hct25": {
    drugClass: "Thiazide diuretic",
    whyUsed:
      "First-line for hypertension and mild oedema. Reduces cardiovascular events when combined with lifestyle changes and other antihypertensives.",
    whoShouldReceive: "Adults. Monitor electrolytes in elderly and those on digoxin or loop diuretics. Use caution in gout.",
    howToTake: "25 mg once daily in the morning. Take at the same time each day. May combine with ACE inhibitor or ARB.",
    warnings: "Can cause hypokalaemia, hyperuricaemia, and photosensitivity.",
    commonSideEffects: "Dizziness, polyuria, muscle cramps, mild hyperglycaemia.",
  },
  "drug-aml5": {
    drugClass: "CCB",
    whyUsed: "First-line calcium channel blocker for hypertension and angina. Reduces BP with favourable metabolic profile.",
    whoShouldReceive: "Adults and elderly. Avoid in severe aortic stenosis and cardiogenic shock.",
    howToTake: "5 mg once daily; may titrate to 10 mg. Swallow whole; take at the same time each day.",
    warnings: "Peripheral oedema and flushing are common; not interchangeable with other dihydropyridines at equal mg.",
    commonSideEffects: "Ankle swelling, headache, flushing, fatigue.",
  },
  "drug-met500": {
    drugClass: "Biguanide",
    whyUsed: "First-line therapy for type 2 diabetes. Improves insulin sensitivity and lowers HbA1c without causing hypoglycaemia alone.",
    whoShouldReceive: "Adults with T2DM. Avoid if eGFR <30. Hold before iodinated contrast and restart per protocol.",
    howToTake: "500 mg twice daily with meals. Titrate slowly over weeks to reduce GI upset.",
    warnings: "Risk of lactic acidosis (rare). Avoid excess alcohol.",
    commonSideEffects: "Nausea, diarrhoea, metallic taste, vitamin B12 deficiency with long-term use.",
  },
  "drug-lis10": {
    drugClass: "ACE inhibitor",
    whyUsed: "Treats hypertension, heart failure, and post-MI LV dysfunction. Reduces proteinuria in diabetic nephropathy.",
    whoShouldReceive: "Adults. Avoid in pregnancy. Monitor K⁺ and creatinine after initiation.",
    howToTake: "10 mg once daily. First dose may cause hypotension — counsel on dizziness when standing.",
    warnings: "Contraindicated in bilateral renal artery stenosis and pregnancy.",
    commonSideEffects: "Dry cough, hyperkalaemia, angioedema (rare but serious).",
  },
  "drug-los50": {
    drugClass: "ARB",
    whyUsed: "Alternative to ACE inhibitors for hypertension and heart failure; useful when ACE-I cough occurs.",
    whoShouldReceive: "Adults. Avoid in pregnancy. Monitor renal function and potassium.",
    howToTake: "50 mg once daily with or without food. May increase to 100 mg once daily.",
    warnings: "Do not combine with ACE inhibitor. Avoid in pregnancy.",
    commonSideEffects: "Dizziness, hyperkalaemia, fatigue; lower cough risk than ACE inhibitors.",
  },
  "drug-par500": {
    drugClass: "Analgesic / antipyretic",
    whyUsed: "Mild-to-moderate pain and fever. Preferred over NSAIDs when GI bleed risk or in children (weight-based).",
    whoShouldReceive: "Most patients. Use lowest effective dose. Hepatic dose adjustment if cirrhosis.",
    howToTake: "500 mg–1 g every 4–6 hours PRN; max 4 g/day in adults. Do not exceed labelled maximum.",
    warnings: "Hepatotoxicity with overdose. Check combination cold/flu products for duplicate paracetamol.",
    commonSideEffects: "Generally well tolerated at therapeutic doses.",
  },
  "drug-ibu400": {
    drugClass: "NSAID",
    whyUsed: "Inflammatory pain, dysmenorrhoea, and fever. Anti-inflammatory at higher doses.",
    whoShouldReceive: "Avoid in active peptic ulcer, severe heart failure, third trimester pregnancy, and significant renal impairment.",
    howToTake: "400 mg every 6–8 hours with food or milk. Use shortest duration needed.",
    warnings: "GI bleed, renal injury, and cardiovascular risk with prolonged use.",
    commonSideEffects: "Dyspepsia, nausea, dizziness, fluid retention.",
  },
  "drug-azt250": {
    drugClass: "Macrolide antibiotic",
    whyUsed: "Respiratory tract infections, atypical pneumonia, and penicillin allergy alternatives.",
    whoShouldReceive: "Adults and children per weight. Caution with QT prolongation and hepatic impairment.",
    howToTake: "250 mg once daily × 3 days (or 500 mg day 1 then 250 mg × 4 days per protocol). Take 1 hour before or 2 hours after food.",
    warnings: "QT prolongation; avoid with certain statins and antiarrhythmics.",
    commonSideEffects: "GI upset, diarrhoea, taste disturbance.",
  },
  "drug-ome20": {
    drugClass: "PPI",
    whyUsed: "GERD, peptic ulcer disease, and H. pylori regimens. Reduces gastric acid secretion.",
    whoShouldReceive: "Short-term use preferred. Review long-term need; consider B12 and Mg monitoring.",
    howToTake: "20 mg once daily 30 minutes before breakfast. Swallow capsule whole; do not crush.",
    warnings: "Long-term use linked to fracture risk, C. difficile, and hypomagnesaemia.",
    commonSideEffects: "Headache, abdominal pain, constipation.",
  },
  "drug-ato40": {
    drugClass: "Statin",
    whyUsed: "Hyperlipidaemia and cardiovascular risk reduction in primary and secondary prevention.",
    whoShouldReceive: "Adults per CV risk. Avoid in active liver disease and pregnancy.",
    howToTake: "40 mg once daily at any time; consistency helps adherence. Avoid large grapefruit intake.",
    warnings: "Monitor LFTs and report unexplained myalgia.",
    commonSideEffects: "Myalgia, headache, GI upset; rhabdomyolysis is rare.",
  },
  "drug-asp75": {
    drugClass: "Antiplatelet",
    whyUsed: "Secondary prevention after ACS/stroke and primary prevention in select high-risk patients.",
    whoShouldReceive: "Avoid in active bleeding, children with viral illness (Reye syndrome), and third trimester.",
    howToTake: "75 mg once daily with food if GI sensitivity. Use enteric-coated if dyspepsia.",
    warnings: "Bleeding risk increases with anticoagulants, NSAIDs, and alcohol.",
    commonSideEffects: "Dyspepsia, bruising, tinnitus at high doses.",
  },
  "drug-pred5": {
    drugClass: "Corticosteroid",
    whyUsed: "Anti-inflammatory and immunosuppressive therapy for asthma exacerbations, allergies, and autoimmune flares.",
    whoShouldReceive: "Taper when used >2 weeks. Monitor glucose, BP, and infection risk.",
    howToTake: "5 mg once daily in the morning with food unless directed otherwise. Do not stop abruptly after prolonged use.",
    warnings: "Adrenal suppression, osteoporosis, hyperglycaemia with prolonged courses.",
    commonSideEffects: "Insomnia, appetite increase, mood changes, fluid retention.",
  },
  "drug-sal100": {
    drugClass: "SABA bronchodilator",
    whyUsed: "Rapid relief of bronchospasm in asthma and COPD. Rescue inhaler — not for maintenance alone.",
    whoShouldReceive: "Patients with reactive airway disease. Overuse signals poor control — review preventer therapy.",
    howToTake: "1–2 puffs via spacer as needed; max 8–12 puffs/24 h. Rinse mouth after use.",
    warnings: "Tremor and tachycardia; seek urgent care if rescue use exceeds 3 days/week.",
    commonSideEffects: "Tremor, palpitations, headache.",
  },
  "drug-gli1": {
    drugClass: "Sulfonylurea",
    whyUsed: "Lowers blood glucose by stimulating pancreatic insulin release in type 2 diabetes.",
    whoShouldReceive: "Avoid in severe hepatic/renal impairment. Counsel on hypoglycaemia recognition.",
    howToTake: "1 mg once daily before breakfast; titrate per glucose. Take with first main meal.",
    warnings: "Hypoglycaemia risk, especially with skipped meals, alcohol, or renal decline.",
    commonSideEffects: "Hypoglycaemia, weight gain, GI upset.",
  },
  "drug-ins100": {
    drugClass: "Basal insulin",
    whyUsed: "Long-acting glucose control in diabetes; basal coverage overnight and between meals.",
    whoShouldReceive: "Diabetes requiring insulin. Teach injection technique and hypoglycaemia management.",
    howToTake: "Inject subcutaneously at same time daily (often bedtime). Rotate injection sites.",
    warnings: "Never mix with other insulins in same syringe unless trained. Hypoglycaemia if dose mismatched to intake.",
    commonSideEffects: "Hypoglycaemia, lipohypertrophy at repeated sites, weight gain.",
  },
  "drug-oxy5": {
    drugClass: "Opioid analgesic",
    whyUsed: "Moderate-to-severe acute pain when non-opioids insufficient. Schedule II controlled substance.",
    whoShouldReceive: "Short courses preferred. Avoid in respiratory depression, paralytic ileus, and MAOI use.",
    howToTake: "5 mg every 4–6 hours PRN severe pain. Lowest effective dose for shortest duration.",
    warnings: "Respiratory depression, dependence, and sedation — no driving. Risk with benzodiazepines.",
    commonSideEffects: "Constipation, nausea, sedation, dizziness.",
  },
  "drug-vacflu": {
    drugClass: "Inactivated vaccine",
    whyUsed: "Seasonal influenza prevention per national immunisation schedule.",
    whoShouldReceive: "Eligible adults per local guidelines; egg allergy — consult protocol.",
    howToTake: "Single IM dose annually before flu season. Observe 15 minutes post-vaccination.",
    warnings: "Not a live vaccine; cannot cause influenza. Febrile illness — defer until recovered.",
    commonSideEffects: "Injection-site soreness, low-grade fever, myalgia for 1–2 days.",
  },
};

const DRAFT_STORAGE_KEY = "medora-rx-draft-v1";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function defaultPrescriptionDraft(patientId: string): PrescriptionDraft {
  return {
    patientId,
    diagnosis: "",
    lines: [],
    patientInstructions: "",
    instructionTags: [],
    pharmacistNotes: "",
    validFrom: todayIso(),
    validUntil: addDaysIso(30),
    rxType: "regular",
    followUpRequired: false,
    followUpNote: "",
    pharmacyId: "oak-central",
    patientLanguage: "en",
    printInPatientLanguage: false,
    priority: "routine",
    updatedAt: new Date().toISOString(),
  };
}

export function drugClassFor(drugId: string): string {
  return DRUG_CLASSES[drugId] ?? "General";
}

export function getDrugMonograph(drugId: string): DrugMonograph {
  const drug = DRUGS.find((d) => d.id === drugId);
  if (MONOGRAPHS[drugId]) return MONOGRAPHS[drugId]!;

  const drugClass = drugClassFor(drugId);
  return {
    drugClass,
    whyUsed: `Prescribed for licensed indications as a ${drugClass.toLowerCase()}. Confirm diagnosis and local formulary guidance before dispensing.`,
    whoShouldReceive:
      "Review allergies, pregnancy status, renal/hepatic function, and concurrent medicines before prescribing.",
    howToTake:
      drug?.counseling ??
      `${drug?.strength ?? ""} ${drug?.route?.toLowerCase() ?? "as directed"} per prescriber instructions.`,
  };
}

export function diagnosisSuggestionsFor(patient: PanelPatient): { label: string; icd: string }[] {
  const problems = getPatientProblems(patient.id);
  const fromProblems = problems.map((p) => ({ label: p.label, icd: p.icd }));
  const extras: { label: string; icd: string }[] = [];
  if (patient.condition.toLowerCase().includes("hypertension")) {
    extras.push({ label: "Essential Hypertension", icd: "I10" });
    extras.push({ label: "Stage 1 HTN", icd: "I10" });
  }
  if (patient.condition.toLowerCase().includes("asthma")) {
    extras.push({ label: "Persistent Asthma", icd: "J45.9" });
  }
  if (patient.condition.toLowerCase().includes("diabetes")) {
    extras.push({ label: "Type 2 diabetes", icd: "E11.9" });
  }
  const seen = new Set<string>();
  return [...fromProblems, ...extras].filter((d) => {
    if (seen.has(d.icd)) return false;
    seen.add(d.icd);
    return true;
  });
}

function freqPerDay(frequency: RxFrequency): number {
  return FREQUENCIES.find((f) => f.id === frequency)?.perDay ?? 1;
}

export function calcQuantity(frequency: RxFrequency, durationDays: number): number {
  const perDay = freqPerDay(frequency);
  if (frequency === "Weekly") return Math.max(1, Math.ceil(durationDays / 7));
  if (frequency === "SOS") return Math.min(30, durationDays * 2);
  return Math.max(1, Math.ceil(perDay * durationDays));
}

export function buildSig(line: Pick<PrescriptionLineDraft, "frequency" | "timing" | "route" | "durationDays">, drug: Drug): string {
  const timing = line.timing.length ? ` ${line.timing.join(", ").toLowerCase()}` : "";
  const freqLabel = line.frequency === "Custom" ? "as directed" : line.frequency;
  return `${drug.strength} ${line.route.toLowerCase()} ${freqLabel}${timing} × ${line.durationDays} days`;
}

export function createLineFromDrug(drugId: string, partial?: Partial<PrescriptionLineDraft>): PrescriptionLineDraft {
  const drug = DRUGS.find((d) => d.id === drugId)!;
  const frequency: RxFrequency = partial?.frequency ?? "OD";
  const durationDays = partial?.durationDays ?? 30;
  const base: PrescriptionLineDraft = {
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    drug_id: drugId,
    route: drug.route || "Oral",
    frequency,
    timing: partial?.timing ?? (drug.form === "Tablet" ? ["After meals"] : []),
    durationDays,
    qty_prescribed: calcQuantity(frequency, durationDays),
    days_supply: durationDays,
    refills_allowed: partial?.refills_allowed ?? 1,
    sig: "",
    allowGeneric: true,
    drugNotes: "",
  };
  base.sig = buildSig(base, drug);
  return { ...base, ...partial, sig: partial?.sig ?? base.sig };
}

export function syncLineQuantities(line: PrescriptionLineDraft): PrescriptionLineDraft {
  const drug = DRUGS.find((d) => d.id === line.drug_id);
  if (!drug) return line;
  const qty = calcQuantity(line.frequency, line.durationDays);
  return {
    ...line,
    qty_prescribed: qty,
    days_supply: line.durationDays,
    sig: buildSig(line, drug),
  };
}

export function validatePrescription(draft: PrescriptionDraft): string[] {
  const missing: string[] = [];
  if (!draft.diagnosis.trim()) missing.push("Diagnosis");
  if (draft.lines.length === 0) missing.push("Medication");
  return missing;
}

export function isDrugSafeForPatient(patient: PanelPatient, drugId: string): boolean {
  const alerts = quickSafetyScan(patient, [drugId]);
  return !alerts.some((a) => a.severity === "critical");
}

export function loadStoredDraft(patientId: string): PrescriptionDraft | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, PrescriptionDraft>;
    const draft = map[patientId];
    if (!draft || draft.lines.length === 0) return null;
    return draft;
  } catch {
    return null;
  }
}

export function saveStoredDraft(draft: PrescriptionDraft) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, PrescriptionDraft>) : {};
    map[draft.patientId] = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function clearStoredDraft(patientId: string) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, PrescriptionDraft>;
    delete map[patientId];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function lineToDoctorRx(line: PrescriptionLineDraft): DoctorRxLine {
  const notes = [line.drugNotes, line.allowGeneric ? "Generic substitution allowed" : "Dispense as written"]
    .filter(Boolean)
    .join(" · ");
  return {
    drug_id: line.drug_id,
    sig: notes ? `${line.sig} (${notes})` : line.sig,
    qty_prescribed: line.qty_prescribed,
    days_supply: line.days_supply,
    refills_allowed: line.refills_allowed,
  };
}
