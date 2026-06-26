import {
  fetchLabFindingsFromSupabase,
  fetchPatientMedicationsFromSupabase,
  getMockClinicalSource,
} from "@/lib/patient-clinical-supabase";
import type { PatientMedication } from "@/lib/mock-data";
import { getLabResultsForReport, type LabResultRow } from "@/lib/reports-utils";
import { reports } from "@/lib/mock-data";

export type PatientDietContext = {
  medications: PatientMedication[];
  medNames: string[];
  conditions: string[];
  restrictions: string[];
  takesThyroidMeds: boolean;
  needsLactoseFree: boolean;
  timingNotes: string[];
};

export type ClinicalSeverity = "stable" | "moderate" | "high";

export type LabFinding = {
  name: string;
  value: string;
  status: LabResultRow["status"];
  weight: number;
};

export type ClinicalDietProfile = PatientDietContext & {
  profileId: string;
  severity: ClinicalSeverity;
  labFindings: LabFinding[];
  nutrientPriorities: string[];
  avoidIngredients: string[];
  clinicalSummary: string;
  timingSummary: string;
  activeMedCount: number;
  dataSource: "supabase" | "mock";
};

const ABNORMAL_WEIGHT: Record<LabResultRow["status"], number> = {
  Optimal: 0,
  Normal: 0,
  Borderline: 2,
  High: 4,
  Low: 4,
};

let cachedProfile: ClinicalDietProfile | null = null;
let loadPromise: Promise<ClinicalDietProfile> | null = null;

function hashProfile(parts: string[]): string {
  let h = 0;
  const s = parts.join("|").toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36).slice(0, 10);
}

export function buildPatientDietContext(medications: PatientMedication[]): PatientDietContext {
  const active = medications.filter((m) => m.status !== "past");
  const medNames = active.map((m) => m.name);
  const takesThyroidMeds = medNames.some((n) => /levothyroxine|thyroid/i.test(n));

  const restrictions: string[] = [];
  if (takesThyroidMeds) {
    restrictions.push(
      "Separate iron, calcium, soy, and high-fiber foods from thyroid medication by 4+ hours",
    );
    restrictions.push("Take levothyroxine on empty stomach — breakfast after 60 min gap");
  }
  if (medNames.some((n) => /vitamin d/i.test(n))) {
    restrictions.push("Include healthy fats when taking Vitamin D");
  }
  if (medNames.some((n) => /magnesium/i.test(n))) {
    restrictions.push("Schedule magnesium-rich dinners away from morning thyroid dose");
  }

  const conditions = active
    .map((m) => m.clinicalReason)
    .filter((c): c is string => !!c);

  const timingNotes = active.map((m) => `${m.name}: ${m.instructionTag ?? m.reason}`);

  return {
    medications: active,
    medNames,
    conditions: [...new Set(conditions)],
    restrictions,
    takesThyroidMeds,
    needsLactoseFree: takesThyroidMeds,
    timingNotes,
  };
}

function collectLabFindingsFromMock(): LabFinding[] {
  const findings: LabFinding[] = [];
  for (const report of reports) {
    if (report.type !== "Lab") continue;
    for (const row of getLabResultsForReport(report.id)) {
      if (row.status === "Normal" || row.status === "Optimal") continue;
      findings.push({
        name: row.name,
        value: row.value,
        status: row.status,
        weight: ABNORMAL_WEIGHT[row.status],
      });
    }
  }
  return findings.sort((a, b) => b.weight - a.weight);
}

function labRowsToFindings(rows: LabResultRow[]): LabFinding[] {
  return rows
    .filter((r) => r.status !== "Normal" && r.status !== "Optimal")
    .map((row) => ({
      name: row.name,
      value: row.value,
      status: row.status,
      weight: ABNORMAL_WEIGHT[row.status],
    }))
    .sort((a, b) => b.weight - a.weight);
}

function inferSeverity(labs: LabFinding[], meds: PatientMedication[]): ClinicalSeverity {
  const labScore = labs.reduce((s, l) => s + l.weight, 0);
  const activeMeds = meds.filter((m) => m.status !== "past");
  const thyroid = activeMeds.some((m) => /levothyroxine|thyroid/i.test(m.name));
  const multiMed = activeMeds.length >= 3;

  if (labScore >= 8 || (thyroid && labScore >= 4)) return "high";
  if (labScore >= 2 || multiMed || thyroid) return "moderate";
  return "stable";
}

function buildNutrientPriorities(ctx: PatientDietContext, labs: LabFinding[]): string[] {
  const priorities = new Set<string>();

  if (ctx.takesThyroidMeds) {
    priorities.add("iodine");
    priorities.add("selenium");
    priorities.add("zinc");
  }

  for (const lab of labs) {
    const n = lab.name.toLowerCase();
    if (/vitamin d|d3|25-oh/i.test(n) && /borderline|low/i.test(lab.status)) {
      priorities.add("vitamin D");
      priorities.add("healthy fats");
    }
    if (/ldl|cholesterol|triglyceride/i.test(n) && /borderline|high/i.test(lab.status)) {
      priorities.add("fiber");
      priorities.add("omega-3");
    }
    if (/tsh|t4|t3|thyroid/i.test(n)) {
      priorities.add("selenium");
      priorities.add("iodine");
    }
    if (/iron|ferritin|hemoglobin/i.test(n) && /low|borderline/i.test(lab.status)) {
      priorities.add("iron");
      priorities.add("vitamin C pairing");
    }
    if (/glucose|hba1c/i.test(n) && /borderline|high/i.test(lab.status)) {
      priorities.add("low glycemic index");
      priorities.add("protein");
    }
  }

  if (ctx.medNames.some((m) => /vitamin d/i.test(m))) priorities.add("vitamin D");
  if (ctx.medNames.some((m) => /magnesium/i.test(m))) priorities.add("magnesium");

  return [...priorities];
}

function buildAvoidList(ctx: PatientDietContext, severity: ClinicalSeverity): string[] {
  const avoid = new Set<string>();

  if (ctx.takesThyroidMeds) {
    avoid.add("calcium supplements near thyroid dose");
    avoid.add("iron-rich foods within 4h of levothyroxine");
    avoid.add("soy isolate within 4h of thyroid medication");
    avoid.add("high-fiber bran immediately after thyroid dose");
  }
  if (ctx.needsLactoseFree) avoid.add("dairy");
  if (severity === "high") {
    avoid.add("refined sugar spikes");
    avoid.add("excess iodine from kelp supplements");
  }

  return [...avoid];
}

function buildClinicalSummary(
  ctx: PatientDietContext,
  labs: LabFinding[],
  severity: ClinicalSeverity,
): string {
  const parts: string[] = [];
  parts.push(`Severity: ${severity}`);
  if (ctx.conditions.length) parts.push(`Conditions: ${ctx.conditions.join("; ")}`);
  if (labs.length) {
    parts.push(
      `Abnormal labs: ${labs.map((l) => `${l.name} ${l.value} (${l.status})`).join("; ")}`,
    );
  }
  return parts.join(". ");
}

export function buildClinicalDietProfile(
  medications: PatientMedication[],
  labRows: LabResultRow[],
  dataSource: "supabase" | "mock",
): ClinicalDietProfile {
  const ctx = buildPatientDietContext(medications);
  const labFindings = labRowsToFindings(labRows);
  const severity = inferSeverity(labFindings, medications);
  const nutrientPriorities = buildNutrientPriorities(ctx, labFindings);
  const avoidIngredients = buildAvoidList(ctx, severity);

  const profileId = hashProfile([
    ...ctx.medNames.sort(),
    ...ctx.conditions.sort(),
    ...labFindings.map((l) => `${l.name}:${l.status}`),
    severity,
    dataSource,
  ]);

  return {
    ...ctx,
    profileId,
    severity,
    labFindings,
    nutrientPriorities,
    avoidIngredients,
    clinicalSummary: buildClinicalSummary(ctx, labFindings, severity),
    timingSummary: ctx.timingNotes.join(" · "),
    activeMedCount: ctx.medications.length,
    dataSource,
  };
}

function buildMockProfile(): ClinicalDietProfile {
  const mock = getMockClinicalSource();
  const labRows: LabResultRow[] = [];
  for (const report of mock.reports) {
    if (report.type !== "Lab") continue;
    labRows.push(...getLabResultsForReport(report.id));
  }
  return buildClinicalDietProfile(mock.medications, labRows, "mock");
}

/** Sync accessor — returns cached Supabase profile or mock fallback */
export function getPatientDietContext(): PatientDietContext {
  const p = getClinicalDietProfile();
  return {
    medications: p.medications,
    medNames: p.medNames,
    conditions: p.conditions,
    restrictions: p.restrictions,
    takesThyroidMeds: p.takesThyroidMeds,
    needsLactoseFree: p.needsLactoseFree,
    timingNotes: p.timingNotes,
  };
}

export function getClinicalDietProfile(): ClinicalDietProfile {
  return cachedProfile ?? buildMockProfile();
}

/** Load meds + labs from Supabase; falls back to mock when unavailable */
export async function loadClinicalDietProfile(): Promise<ClinicalDietProfile> {
  if (cachedProfile?.dataSource === "supabase") return cachedProfile;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [meds, labs] = await Promise.all([
      fetchPatientMedicationsFromSupabase(),
      fetchLabFindingsFromSupabase(),
    ]);

    if (meds?.length) {
      const mock = getMockClinicalSource();
      const allLabRows: LabResultRow[] = labs ?? [];
      if (!allLabRows.length) {
        for (const report of mock.reports) {
          if (report.type !== "Lab") continue;
          allLabRows.push(...getLabResultsForReport(report.id));
        }
      }
      cachedProfile = buildClinicalDietProfile(meds, allLabRows, "supabase");
      return cachedProfile;
    }

    cachedProfile = buildMockProfile();
    return cachedProfile;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function invalidateClinicalProfileCache(): void {
  cachedProfile = null;
  loadPromise = null;
}

export function formatClinicalProfileForAi(profile: ClinicalDietProfile): string {
  return [
    `Patient profile ${profile.profileId} (severity: ${profile.severity}, ${profile.activeMedCount} active medications).`,
    `Medications: ${profile.medNames.join(", ") || "none"}.`,
    `Conditions: ${profile.conditions.join(", ") || "general wellness"}.`,
    profile.labFindings.length
      ? `Lab flags: ${profile.labFindings.map((l) => `${l.name} ${l.value} [${l.status}]`).join("; ")}.`
      : "Labs: within normal limits.",
    `Prioritize nutrients: ${profile.nutrientPriorities.join(", ") || "balanced macros"}.`,
    `Avoid: ${profile.avoidIngredients.join("; ") || "none"}.`,
    `Medication timing: ${profile.timingSummary || "standard"}.`,
    `Restrictions: ${profile.restrictions.join("; ") || "none"}.`,
    "Create a UNIQUE recipe for THIS patient only — do not reuse generic template names.",
  ].join("\n");
}

export function profileToApiContext(profile: ClinicalDietProfile) {
  return {
    profileId: profile.profileId,
    severity: profile.severity,
    medications: profile.medNames,
    restrictions: profile.restrictions,
    conditions: profile.conditions,
    labFindings: profile.labFindings.map((l) => `${l.name} ${l.value} (${l.status})`),
    nutrientPriorities: profile.nutrientPriorities,
    avoidIngredients: profile.avoidIngredients,
    clinicalSummary: profile.clinicalSummary,
    timingSummary: profile.timingSummary,
  };
}
