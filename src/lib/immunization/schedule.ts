/**
 * Immunization schedule definitions — IAP / UIP paediatric core +
 * adolescent, adult, pregnancy, and risk-based vaccines.
 * Used by the doctor immunization workspace for due/overdue/catch-up.
 */

export type VaccineProgram =
  | "uip"
  | "iap"
  | "adolescent"
  | "adult"
  | "pregnancy"
  | "travel"
  | "risk";

export type VaccineRoute = "IM" | "SC" | "ID" | "Oral" | "Nasal" | "Other";

export type ScheduleDose = {
  id: string;
  vaccine: string;
  shortName: string;
  program: VaccineProgram;
  /** Recommended age in completed months (0 = birth). */
  ageMonths: number;
  /** Soft window end (months). Due until this; then overdue. */
  dueUntilMonths?: number;
  doseLabel: string;
  doseVolume: string;
  route: VaccineRoute;
  site?: string;
  series?: string;
  doseNumber?: number;
  minIntervalDays?: number;
  notes?: string;
  gender?: "Female" | "Male";
};

export const SCHEDULE_DOSES: ScheduleDose[] = [
  // ── Birth ──────────────────────────────────────────────────────────────────
  {
    id: "BCG",
    vaccine: "BCG",
    shortName: "BCG",
    program: "uip",
    ageMonths: 0,
    dueUntilMonths: 12,
    doseLabel: "Birth dose",
    doseVolume: "0.05 ml",
    route: "ID",
    site: "Left upper arm",
    series: "BCG",
    doseNumber: 1,
    notes: "As soon as possible after birth",
  },
  {
    id: "OPV-0",
    vaccine: "OPV",
    shortName: "OPV-0",
    program: "uip",
    ageMonths: 0,
    dueUntilMonths: 1,
    doseLabel: "Birth dose",
    doseVolume: "2 drops",
    route: "Oral",
    series: "OPV",
    doseNumber: 0,
  },
  {
    id: "HEPB-0",
    vaccine: "Hepatitis B",
    shortName: "HepB-0",
    program: "uip",
    ageMonths: 0,
    dueUntilMonths: 1,
    doseLabel: "Birth dose",
    doseVolume: "0.5 ml",
    route: "IM",
    site: "Anterolateral thigh",
    series: "HepB",
    doseNumber: 1,
  },

  // ── 6 weeks ────────────────────────────────────────────────────────────────
  {
    id: "PENTA-1",
    vaccine: "Pentavalent (DPT-HepB-Hib)",
    shortName: "Penta-1",
    program: "uip",
    ageMonths: 1.5,
    dueUntilMonths: 3,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "IM",
    site: "Anterolateral thigh",
    series: "Penta",
    doseNumber: 1,
  },
  {
    id: "OPV-1",
    vaccine: "OPV",
    shortName: "OPV-1",
    program: "uip",
    ageMonths: 1.5,
    dueUntilMonths: 3,
    doseLabel: "Dose 1",
    doseVolume: "2 drops",
    route: "Oral",
    series: "OPV",
    doseNumber: 1,
  },
  {
    id: "IPV-1",
    vaccine: "IPV",
    shortName: "IPV-1",
    program: "uip",
    ageMonths: 1.5,
    dueUntilMonths: 3,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "IM",
    site: "Anterolateral thigh",
    series: "IPV",
    doseNumber: 1,
  },
  {
    id: "ROTA-1",
    vaccine: "Rotavirus",
    shortName: "Rota-1",
    program: "uip",
    ageMonths: 1.5,
    dueUntilMonths: 3,
    doseLabel: "Dose 1",
    doseVolume: "Oral",
    route: "Oral",
    series: "Rota",
    doseNumber: 1,
  },
  {
    id: "PCV-1",
    vaccine: "PCV",
    shortName: "PCV-1",
    program: "iap",
    ageMonths: 1.5,
    dueUntilMonths: 3,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "PCV",
    doseNumber: 1,
  },

  // ── 10 weeks ───────────────────────────────────────────────────────────────
  {
    id: "PENTA-2",
    vaccine: "Pentavalent (DPT-HepB-Hib)",
    shortName: "Penta-2",
    program: "uip",
    ageMonths: 2.5,
    dueUntilMonths: 4,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Penta",
    doseNumber: 2,
    minIntervalDays: 28,
  },
  {
    id: "OPV-2",
    vaccine: "OPV",
    shortName: "OPV-2",
    program: "uip",
    ageMonths: 2.5,
    dueUntilMonths: 4,
    doseLabel: "Dose 2",
    doseVolume: "2 drops",
    route: "Oral",
    series: "OPV",
    doseNumber: 2,
    minIntervalDays: 28,
  },
  {
    id: "ROTA-2",
    vaccine: "Rotavirus",
    shortName: "Rota-2",
    program: "uip",
    ageMonths: 2.5,
    dueUntilMonths: 4,
    doseLabel: "Dose 2",
    doseVolume: "Oral",
    route: "Oral",
    series: "Rota",
    doseNumber: 2,
    minIntervalDays: 28,
  },
  {
    id: "PCV-2",
    vaccine: "PCV",
    shortName: "PCV-2",
    program: "iap",
    ageMonths: 2.5,
    dueUntilMonths: 4,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "PCV",
    doseNumber: 2,
    minIntervalDays: 28,
  },

  // ── 14 weeks ───────────────────────────────────────────────────────────────
  {
    id: "PENTA-3",
    vaccine: "Pentavalent (DPT-HepB-Hib)",
    shortName: "Penta-3",
    program: "uip",
    ageMonths: 3.5,
    dueUntilMonths: 6,
    doseLabel: "Dose 3",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Penta",
    doseNumber: 3,
    minIntervalDays: 28,
  },
  {
    id: "OPV-3",
    vaccine: "OPV",
    shortName: "OPV-3",
    program: "uip",
    ageMonths: 3.5,
    dueUntilMonths: 6,
    doseLabel: "Dose 3",
    doseVolume: "2 drops",
    route: "Oral",
    series: "OPV",
    doseNumber: 3,
    minIntervalDays: 28,
  },
  {
    id: "IPV-2",
    vaccine: "IPV",
    shortName: "IPV-2",
    program: "uip",
    ageMonths: 3.5,
    dueUntilMonths: 6,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "IPV",
    doseNumber: 2,
    minIntervalDays: 28,
  },
  {
    id: "ROTA-3",
    vaccine: "Rotavirus",
    shortName: "Rota-3",
    program: "uip",
    ageMonths: 3.5,
    dueUntilMonths: 8,
    doseLabel: "Dose 3",
    doseVolume: "Oral",
    route: "Oral",
    series: "Rota",
    doseNumber: 3,
    minIntervalDays: 28,
  },
  {
    id: "PCV-3",
    vaccine: "PCV",
    shortName: "PCV-3",
    program: "iap",
    ageMonths: 3.5,
    dueUntilMonths: 6,
    doseLabel: "Dose 3",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "PCV",
    doseNumber: 3,
    minIntervalDays: 28,
  },

  // ── 9 months ───────────────────────────────────────────────────────────────
  {
    id: "MR-1",
    vaccine: "MR / MMR",
    shortName: "MR-1",
    program: "uip",
    ageMonths: 9,
    dueUntilMonths: 12,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "SC",
    site: "Upper arm",
    series: "MR",
    doseNumber: 1,
  },
  {
    id: "JE-1",
    vaccine: "Japanese Encephalitis",
    shortName: "JE-1",
    program: "uip",
    ageMonths: 9,
    dueUntilMonths: 12,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "JE",
    doseNumber: 1,
    notes: "Endemic districts",
  },

  // ── 12–15 months ───────────────────────────────────────────────────────────
  {
    id: "MMR-1",
    vaccine: "MMR",
    shortName: "MMR-1",
    program: "iap",
    ageMonths: 12,
    dueUntilMonths: 15,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "MMR",
    doseNumber: 1,
  },
  {
    id: "VAR-1",
    vaccine: "Varicella",
    shortName: "Var-1",
    program: "iap",
    ageMonths: 12,
    dueUntilMonths: 15,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "Varicella",
    doseNumber: 1,
  },
  {
    id: "HEPA-1",
    vaccine: "Hepatitis A",
    shortName: "HepA-1",
    program: "iap",
    ageMonths: 12,
    dueUntilMonths: 18,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "HepA",
    doseNumber: 1,
  },
  {
    id: "PCV-B",
    vaccine: "PCV",
    shortName: "PCV booster",
    program: "iap",
    ageMonths: 12,
    dueUntilMonths: 15,
    doseLabel: "Booster",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "PCV",
    doseNumber: 4,
  },

  // ── 16–24 months ───────────────────────────────────────────────────────────
  {
    id: "DPT-B1",
    vaccine: "DPT / DTaP booster",
    shortName: "DPT-B1",
    program: "uip",
    ageMonths: 16,
    dueUntilMonths: 24,
    doseLabel: "1st booster",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "DPT",
    doseNumber: 4,
  },
  {
    id: "OPV-B",
    vaccine: "OPV",
    shortName: "OPV booster",
    program: "uip",
    ageMonths: 16,
    dueUntilMonths: 24,
    doseLabel: "Booster",
    doseVolume: "2 drops",
    route: "Oral",
    series: "OPV",
    doseNumber: 4,
  },
  {
    id: "MR-2",
    vaccine: "MR / MMR",
    shortName: "MR-2",
    program: "uip",
    ageMonths: 16,
    dueUntilMonths: 24,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "MR",
    doseNumber: 2,
  },
  {
    id: "JE-2",
    vaccine: "Japanese Encephalitis",
    shortName: "JE-2",
    program: "uip",
    ageMonths: 16,
    dueUntilMonths: 24,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "JE",
    doseNumber: 2,
  },
  {
    id: "TYPHOID",
    vaccine: "Typhoid conjugate",
    shortName: "TCV",
    program: "iap",
    ageMonths: 9,
    dueUntilMonths: 24,
    doseLabel: "Single / catch-up",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "TCV",
    doseNumber: 1,
  },

  // ── 4–6 years ──────────────────────────────────────────────────────────────
  {
    id: "DPT-B2",
    vaccine: "DPT / DTaP booster",
    shortName: "DPT-B2",
    program: "uip",
    ageMonths: 60,
    dueUntilMonths: 72,
    doseLabel: "2nd booster",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "DPT",
    doseNumber: 5,
  },
  {
    id: "OPV-B2",
    vaccine: "OPV",
    shortName: "OPV-B2",
    program: "uip",
    ageMonths: 60,
    dueUntilMonths: 72,
    doseLabel: "Booster",
    doseVolume: "2 drops",
    route: "Oral",
    series: "OPV",
    doseNumber: 5,
  },
  {
    id: "MMR-2",
    vaccine: "MMR",
    shortName: "MMR-2",
    program: "iap",
    ageMonths: 48,
    dueUntilMonths: 72,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "MMR",
    doseNumber: 2,
  },
  {
    id: "VAR-2",
    vaccine: "Varicella",
    shortName: "Var-2",
    program: "iap",
    ageMonths: 48,
    dueUntilMonths: 72,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "SC",
    series: "Varicella",
    doseNumber: 2,
  },

  // ── Adolescent ─────────────────────────────────────────────────────────────
  {
    id: "TD-10",
    vaccine: "Td / Tdap",
    shortName: "Td-10y",
    program: "adolescent",
    ageMonths: 120,
    dueUntilMonths: 132,
    doseLabel: "10 years",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Td",
    doseNumber: 1,
  },
  {
    id: "TD-16",
    vaccine: "Td / Tdap",
    shortName: "Td-16y",
    program: "adolescent",
    ageMonths: 192,
    dueUntilMonths: 204,
    doseLabel: "16 years",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Td",
    doseNumber: 2,
  },
  {
    id: "HPV-1",
    vaccine: "HPV",
    shortName: "HPV-1",
    program: "adolescent",
    ageMonths: 108,
    dueUntilMonths: 168,
    doseLabel: "Dose 1",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "HPV",
    doseNumber: 1,
    gender: "Female",
    notes: "Girls 9–14y preferred; catch-up to 26y",
  },
  {
    id: "HPV-2",
    vaccine: "HPV",
    shortName: "HPV-2",
    program: "adolescent",
    ageMonths: 114,
    dueUntilMonths: 174,
    doseLabel: "Dose 2",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "HPV",
    doseNumber: 2,
    gender: "Female",
    minIntervalDays: 180,
  },

  // ── Adult / annual / pregnancy / risk ──────────────────────────────────────
  {
    id: "FLU-ANN",
    vaccine: "Influenza",
    shortName: "Flu",
    program: "adult",
    ageMonths: 72,
    dueUntilMonths: 1200,
    doseLabel: "Annual",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Flu",
    doseNumber: 1,
    notes: "Annually — preferably before monsoon / flu season",
  },
  {
    id: "COVID-B",
    vaccine: "COVID-19 booster",
    shortName: "COVID",
    program: "adult",
    ageMonths: 144,
    dueUntilMonths: 1200,
    doseLabel: "Booster / risk",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "COVID",
    doseNumber: 1,
  },
  {
    id: "PPSV23",
    vaccine: "Pneumococcal PPSV23",
    shortName: "PPSV23",
    program: "risk",
    ageMonths: 780,
    dueUntilMonths: 1200,
    doseLabel: "≥65y / risk",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "PPSV",
    doseNumber: 1,
  },
  {
    id: "SHINGLES",
    vaccine: "Herpes zoster",
    shortName: "Shingles",
    program: "adult",
    ageMonths: 600,
    dueUntilMonths: 1200,
    doseLabel: "≥50y",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "HZ",
    doseNumber: 1,
  },
  {
    id: "TDAP-PREG",
    vaccine: "Tdap (pregnancy)",
    shortName: "Tdap-preg",
    program: "pregnancy",
    ageMonths: 144,
    dueUntilMonths: 600,
    doseLabel: "Each pregnancy",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Tdap",
    doseNumber: 1,
    gender: "Female",
    notes: "27–36 weeks preferred",
  },
  {
    id: "HEPB-ADULT",
    vaccine: "Hepatitis B (adult series)",
    shortName: "HepB-A1",
    program: "adult",
    ageMonths: 216,
    dueUntilMonths: 1200,
    doseLabel: "Dose 1 if unvaccinated",
    doseVolume: "1 ml",
    route: "IM",
    series: "HepB-Adult",
    doseNumber: 1,
  },
  {
    id: "TT-WOUND",
    vaccine: "Tetanus toxoid",
    shortName: "TT",
    program: "risk",
    ageMonths: 0,
    dueUntilMonths: 1200,
    doseLabel: "Wound / catch-up",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "TT",
    doseNumber: 1,
  },
  {
    id: "TYPHOID-TRAVEL",
    vaccine: "Typhoid (travel)",
    shortName: "Typhoid",
    program: "travel",
    ageMonths: 24,
    dueUntilMonths: 1200,
    doseLabel: "Travel / endemic",
    doseVolume: "0.5 ml",
    route: "IM",
    series: "Typhoid",
    doseNumber: 1,
  },
  {
    id: "HEPA-TRAVEL",
    vaccine: "Hepatitis A (travel)",
    shortName: "HepA-T",
    program: "travel",
    ageMonths: 12,
    dueUntilMonths: 1200,
    doseLabel: "Travel",
    doseVolume: "0.5–1 ml",
    route: "IM",
    series: "HepA-Travel",
    doseNumber: 1,
  },
];

export function ageInMonths(dob?: string, onDate = new Date()): number {
  if (!dob) return 0;
  const born = new Date(dob + (dob.length === 10 ? "T00:00:00" : ""));
  let months =
    (onDate.getFullYear() - born.getFullYear()) * 12 + (onDate.getMonth() - born.getMonth());
  if (onDate.getDate() < born.getDate()) months -= 1;
  return Math.max(0, months);
}

export function ageLabelFromMonths(months: number): string {
  if (months < 1) return "Newborn";
  if (months < 24) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}y ${m}mo` : `${y}y`;
}

export function dueDateFromDob(dob: string, ageMonths: number): string {
  const d = new Date(dob + "T00:00:00");
  const whole = Math.floor(ageMonths);
  const frac = ageMonths - whole;
  d.setMonth(d.getMonth() + whole);
  if (frac > 0) d.setDate(d.getDate() + Math.round(frac * 30));
  return d.toISOString().slice(0, 10);
}

export type DoseStatus = "upcoming" | "due" | "overdue" | "given" | "deferred" | "refused" | "na";

export function classifyDose(
  dose: ScheduleDose,
  patientAgeMonths: number,
  given: boolean,
  deferred: boolean,
  refused: boolean,
  gender?: string,
): DoseStatus {
  if (dose.gender && gender) {
    const g = gender.startsWith("F") ? "Female" : gender.startsWith("M") ? "Male" : undefined;
    if (g && dose.gender !== g) return "na";
  }
  if (given) return "given";
  if (refused) return "refused";
  if (deferred) return "deferred";
  const until = dose.dueUntilMonths ?? dose.ageMonths + 3;
  if (patientAgeMonths < dose.ageMonths - 0.25) return "upcoming";
  if (patientAgeMonths <= until) return "due";
  // Childhood doses far past their window are not "overdue today" for adults —
  // they clutter the chart. Hide from action lists (catch-up stays in full schedule).
  const childhood = dose.program === "uip" || dose.program === "iap";
  if (childhood && patientAgeMonths > until + 18) return "na";
  return "overdue";
}

export const SITES = [
  "Left anterolateral thigh",
  "Right anterolateral thigh",
  "Left deltoid",
  "Right deltoid",
  "Left upper arm (ID)",
  "Right upper arm (ID)",
  "Oral",
  "Other",
] as const;

export const MANUFACTURERS = [
  "Serum Institute of India",
  "Bharat Biotech",
  "Biological E",
  "GSK",
  "Sanofi",
  "Pfizer",
  "MSD",
  "Other",
] as const;

export const PROGRAM_LABELS: Record<VaccineProgram, string> = {
  uip: "UIP / National",
  iap: "IAP recommended",
  adolescent: "Adolescent",
  adult: "Adult",
  pregnancy: "Pregnancy",
  travel: "Travel",
  risk: "Risk-based",
};
