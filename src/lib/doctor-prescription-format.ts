import type { RxFrequency, PatientLanguage } from "./doctor-prescription-workflow";
import type { PrescriptionLineDraft } from "./doctor-prescription-workflow";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import {
  resolveRxLocale,
  tDuration,
  tFreqLatin,
  tRefills,
  tRoute,
  tSubstitution,
  tTimingList,
  type RxLocale,
} from "./doctor-prescription-i18n";

export const CLINIC_RX_META = {
  hospitalName: "Maple Multi-Speciality Hospital",
  tagline: "NABH Accredited · 24×7 Emergency",
  address: "42, Koramangala 5th Block, Bengaluru, Karnataka — 560095",
  phone: "+91 80 4567 8900",
  email: "opd@maplehospital.in",
  website: "www.maplehospital.in",
  doctorName: "Dr. Rajesh Mehta",
  qualifications: "MBBS, MD (Internal Medicine)",
  nmcRegNo: "KA-MCI-78452",
  stateCouncil: "Karnataka Medical Council",
  department: "Department of Internal Medicine",
};

const FORM_ABBR: Record<string, string> = {
  Tablet: "TAB.",
  Capsule: "CAP.",
  Syrup: "SYP.",
  Suspension: "SUSP.",
  Injection: "INJ.",
  Inhaler: "INH.",
  Drops: "DRP.",
  Cream: "CRM.",
  Ointment: "OINT.",
  Patch: "PCH.",
};

export function frequencyToIndianNotation(freq: RxFrequency): string {
  const map: Record<RxFrequency, string> = {
    OD: "1-0-0",
    BD: "1-0-1",
    TDS: "1-1-1",
    QID: "1-1-1-1",
    HS: "0-0-1",
    SOS: "SOS",
    Q6H: "Q6H",
    Q8H: "Q8H",
    Weekly: "1×/week",
    Custom: "As directed",
  };
  return map[freq] ?? freq;
}

export function frequencyLatin(freq: RxFrequency): string {
  const map: Record<RxFrequency, string> = {
    OD: "OD (Once daily)",
    BD: "BD (Twice daily)",
    TDS: "TDS (Thrice daily)",
    QID: "QID (Four times daily)",
    HS: "HS (At bedtime)",
    SOS: "SOS (If required)",
    Q6H: "Every 6 hours",
    Q8H: "Every 8 hours",
    Weekly: "Once weekly",
    Custom: "As directed",
  };
  return map[freq] ?? freq;
}

export function formatDrugForm(form: string): string {
  return FORM_ABBR[form] ?? form.toUpperCase();
}

export type FormattedRxLine = {
  index: number;
  genericUpper: string;
  strength: string;
  formAbbr: string;
  route: string;
  indianDose: string;
  latinFreq: string;
  timing: string;
  durationLabel: string;
  qty: number;
  refills: string;
  sig: string;
  substitution: string;
  notes: string;
  controlled?: string;
};

export function formatPrescriptionLine(
  line: PrescriptionLineDraft,
  index: number,
  locale: RxLocale = "en",
): FormattedRxLine {
  const drug = DRUGS.find((d) => d.id === line.drug_id);
  const genericUpper = (drug?.generic_name ?? "MEDICATION").toUpperCase();
  const timingRaw = line.timing.length ? line.timing.join(", ") : "—";
  const timing = tTimingList(timingRaw, locale);
  const durationLabel = tDuration(line.durationDays, locale);
  const freqHint = tFreqLatin(line.frequency, locale);
  const latinFreq =
    locale === "en"
      ? frequencyLatin(line.frequency)
      : freqHint
        ? `${line.frequency} (${freqHint})`
        : frequencyLatin(line.frequency);

  return {
    index: index + 1,
    genericUpper,
    strength: drug?.strength ?? "",
    formAbbr: formatDrugForm(drug?.form ?? "Tablet"),
    route: tRoute(line.route, locale),
    indianDose: frequencyToIndianNotation(line.frequency),
    latinFreq,
    timing,
    durationLabel,
    qty: line.qty_prescribed,
    refills: tRefills(line.refills_allowed, locale),
    sig: line.sig,
    substitution: tSubstitution(line.allowGeneric, locale),
    notes: line.drugNotes,
    controlled: drug?.controlled_schedule,
  };
}

export function getPrescriptionLocale(
  printInPatientLanguage: boolean,
  language: PatientLanguage,
): RxLocale {
  return resolveRxLocale(printInPatientLanguage, language);
}

export function formatRxDate(iso?: string): { date: string; time: string } {
  const d = iso ? new Date(iso) : new Date();
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}
