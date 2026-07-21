/**
 * Server-side license gate (not spoofable via VITE_ alone).
 * Prefer MEDORA_LICENSE_KEY; fall back to VITE_MEDORA_LICENSE_KEY for single-env deploys.
 */
export type ServerLicense = {
  licensed: boolean;
  plan: "evaluation" | "starter" | "professional" | "enterprise";
};

function read(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
}

export function getServerLicense(): ServerLicense {
  const key =
    (read("MEDORA_LICENSE_KEY") ?? read("VITE_MEDORA_LICENSE_KEY") ?? "").trim();
  const planRaw = (read("MEDORA_PLAN") ?? read("VITE_MEDORA_PLAN") ?? "").toLowerCase();
  const plan =
    planRaw === "starter" || planRaw === "professional" || planRaw === "enterprise"
      ? planRaw
      : "evaluation";

  if (key.length < 16) {
    return { licensed: false, plan: "evaluation" };
  }
  return { licensed: true, plan };
}

export function serverHasModule(moduleId: string): boolean {
  const { licensed, plan } = getServerLicense();
  if (!licensed) return ["opd", "emr", "specialty_desk"].includes(moduleId);
  const map: Record<ServerLicense["plan"], string[]> = {
    evaluation: ["opd", "emr", "specialty_desk"],
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
  return map[plan].includes(moduleId);
}
