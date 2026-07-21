/**
 * Commercial license gate for sellable builds.
 * Licensed deployments set VITE_MEDORA_LICENSE_KEY (min 16 chars) and hospital name.
 * Unlicensed = evaluation mode (watermark + demo limits messaging).
 */

export type LicenseStatus = {
  licensed: boolean;
  evaluation: boolean;
  hospitalName: string;
  plan: "evaluation" | "starter" | "professional" | "enterprise";
  modules: string[];
};

const PLAN_MODULES: Record<LicenseStatus["plan"], string[]> = {
  evaluation: [
    "opd",
    "emr",
    "lab",
    "pharmacy",
    "billing",
    "specialty_desk",
    "anatomy_3d",
    "hospital_units",
  ],
  starter: ["opd", "emr", "lab", "pharmacy", "billing", "specialty_desk"],
  professional: [
    "opd",
    "emr",
    "lab",
    "pharmacy",
    "billing",
    "specialty_desk",
    "anatomy_3d",
    "ipd",
    "ot",
    "hospital_units",
  ],
  enterprise: [
    "opd",
    "emr",
    "lab",
    "pharmacy",
    "billing",
    "specialty_desk",
    "anatomy_3d",
    "ipd",
    "ot",
    "hospital_units",
    "ai_cdss",
    "white_label",
    "multi_branch",
  ],
};

function parsePlan(raw: string | undefined): LicenseStatus["plan"] {
  const p = (raw ?? "").toLowerCase();
  if (p === "starter" || p === "professional" || p === "enterprise") return p;
  return "evaluation";
}

export function getLicenseStatus(): LicenseStatus {
  const key = (import.meta.env.VITE_MEDORA_LICENSE_KEY as string | undefined)?.trim() ?? "";
  const hospitalName =
    (import.meta.env.VITE_HOSPITAL_DISPLAY_NAME as string | undefined)?.trim() ||
    "Your Hospital";
  const plan = parsePlan(import.meta.env.VITE_MEDORA_PLAN as string | undefined);
  const licensed = key.length >= 16;

  if (!licensed) {
    return {
      licensed: false,
      evaluation: true,
      hospitalName: "Medora Evaluation",
      plan: "evaluation",
      modules: PLAN_MODULES.evaluation,
    };
  }

  return {
    licensed: true,
    evaluation: false,
    hospitalName,
    plan,
    modules: PLAN_MODULES[plan],
  };
}

export function hasModule(moduleId: string): boolean {
  return getLicenseStatus().modules.includes(moduleId);
}

export function isEvaluationBuild(): boolean {
  return getLicenseStatus().evaluation;
}
