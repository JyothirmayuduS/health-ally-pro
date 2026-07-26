/**
 * Vaccine vial stock — lots available at the clinic fridge.
 * Lets the doctor tap a lot instead of typing a lot number.
 */
import { MANUFACTURERS, type ScheduleDose } from "./schedule";

export type VaccineLot = {
  lotNumber: string;
  vaccine: string;
  manufacturer: string;
  /** ISO date */
  expiry: string;
  dosesLeft: number;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function isoPlusMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministic open + reserve lot per vaccine so the picker is stable
 * across renders and reloads.
 */
export function lotsForDose(dose: ScheduleDose): VaccineLot[] {
  const seed = hash(dose.vaccine);
  const code = dose.shortName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 5);
  const mfg = MANUFACTURERS[seed % (MANUFACTURERS.length - 1)]!;
  const altMfg = MANUFACTURERS[(seed + 3) % (MANUFACTURERS.length - 1)]!;

  return [
    {
      lotNumber: `${code}-${(seed % 900) + 100}A`,
      vaccine: dose.vaccine,
      manufacturer: mfg,
      expiry: isoPlusMonths(4 + (seed % 5)),
      dosesLeft: 3 + (seed % 8),
    },
    {
      lotNumber: `${code}-${(seed % 700) + 200}B`,
      vaccine: dose.vaccine,
      manufacturer: altMfg,
      expiry: isoPlusMonths(11 + (seed % 7)),
      dosesLeft: 10 + (seed % 15),
    },
  ];
}

/** Default = soonest expiry with stock (use-first-expiry-first). */
export function defaultLotFor(dose: ScheduleDose): VaccineLot | undefined {
  return lotsForDose(dose)
    .filter((l) => l.dosesLeft > 0)
    .sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
}

/** Age-appropriate injection site so the doctor never picks one by hand. */
export function defaultSiteFor(dose: ScheduleDose, ageMonths: number): string {
  if (dose.site) return dose.site;
  if (dose.route === "Oral") return "Oral";
  if (dose.route === "ID") return "Left upper arm (ID)";
  return ageMonths < 24 ? "Left anterolateral thigh" : "Left deltoid";
}

export function expiresSoon(lot: VaccineLot): boolean {
  const days = (new Date(lot.expiry).getTime() - Date.now()) / 86_400_000;
  return days < 120;
}
