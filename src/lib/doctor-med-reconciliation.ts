import type { RxFrequency } from "@/lib/doctor-prescription-workflow";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";

const KEY = "medora-discontinued-meds-v1";
export const MED_RECON_EVENT = "medora-med-recon-updated";

type DiscontinuedMap = Record<string, string[]>;

function load(): DiscontinuedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DiscontinuedMap) : {};
  } catch {
    return {};
  }
}

function save(map: DiscontinuedMap) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(MED_RECON_EVENT));
  }
}

export function listDiscontinuedMedIds(patientId: string): string[] {
  return load()[patientId] ?? [];
}

export function isMedDiscontinued(patientId: string, medChartId: string): boolean {
  return listDiscontinuedMedIds(patientId).includes(medChartId);
}

export function discontinueMed(patientId: string, medChartId: string): void {
  const map = load();
  const ids = new Set(map[patientId] ?? []);
  ids.add(medChartId);
  map[patientId] = [...ids];
  save(map);
}

export function restoreMed(patientId: string, medChartId: string): void {
  const map = load();
  map[patientId] = (map[patientId] ?? []).filter((id) => id !== medChartId);
  save(map);
}

const NAME_ALIASES: Record<string, string> = {
  salbutamol: "drug-sal100",
  prednisolone: "drug-pred5",
  paracetamol: "drug-par500",
  acetaminophen: "drug-par500",
  amlodipine: "drug-aml5",
  metformin: "drug-met500",
  lisinopril: "drug-lis10",
  losartan: "drug-los50",
  atorvastatin: "drug-ato40",
  omeprazole: "drug-ome20",
  azithromycin: "drug-azt250",
  ibuprofen: "drug-ibu400",
  aspirin: "drug-asp75",
};

export function resolveDrugIdFromMedName(name: string): string | null {
  const normalized = name.toLowerCase().replace(/inhaler|tablet|capsule|syrup/gi, "").trim();
  for (const [alias, drugId] of Object.entries(NAME_ALIASES)) {
    if (normalized.includes(alias)) return drugId;
  }
  const drug = DRUGS.find(
    (d) =>
      normalized.includes(d.generic_name.toLowerCase()) ||
      d.brand_names.some((b) => normalized.includes(b.toLowerCase())),
  );
  return drug?.id ?? null;
}

export function frequencyFromChartLabel(label: string): RxFrequency {
  const u = label.toUpperCase();
  if (u.includes("SOS") || u.includes("PRN") || u.includes("AS NEEDED")) return "SOS";
  if (u.includes("BD") || u.includes("TWICE")) return "BD";
  if (u.includes("TDS") || u.includes("THREE")) return "TDS";
  if (u.includes("QID") || u.includes("FOUR")) return "QID";
  if (u.includes("HS") || u.includes("BED")) return "HS";
  return "OD";
}

export function durationDaysFromChart(duration: string): number {
  const m = duration.match(/(\d+)\s*day/i);
  if (m) return Number(m[1]);
  const months = duration.match(/(\d+)\s*month/i);
  if (months) return Number(months[1]) * 30;
  return 30;
}
