/** Hospital white-label + onboarding draft (local until Supabase tenant create ships) */

export type HospitalBrand = {
  hospitalName: string;
  legalName: string;
  adminName: string;
  adminEmail: string;
  city: string;
  beds: number;
  plan: "starter" | "professional" | "enterprise";
  specialties: string[];
  logoDataUrl?: string;
  accent: string;
  createdAt: string;
};

const KEY = "medora-hospital-brand-v1";
const EVENT = "medora-hospital-brand-updated";

export const ONBOARDING_SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Ophthalmology",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "OB-GYN",
  "Emergency",
  "Dental",
  "Dermatology",
];

export function loadHospitalBrand(): HospitalBrand | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HospitalBrand) : null;
  } catch {
    return null;
  }
}

export function saveHospitalBrand(brand: HospitalBrand, opts?: { syncRemote?: boolean }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(brand));
  window.dispatchEvent(new Event(EVENT));
  if (opts?.syncRemote === false) return;
  return import("@/lib/specialties/remote-sync").then(({ syncOnboardingLead }) =>
    syncOnboardingLead(brand).catch(() => null),
  );
}

export function subscribeHospitalBrand(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function displayHospitalName(fallback = "Medora Hospital"): string {
  const fromEnv = (import.meta.env.VITE_HOSPITAL_DISPLAY_NAME as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  return loadHospitalBrand()?.hospitalName || fallback;
}
