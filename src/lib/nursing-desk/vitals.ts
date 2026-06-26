/** Nursing vitals & notes — localStorage per patient. */

export type VitalReading = {
  id: string;
  patientId: string;
  at: string;
  bpSys: number;
  bpDia: number;
  pulse: number;
  temp: number;
  spo2: number;
  notes?: string;
  nurse: string;
};

const KEY = "medora-nursing-vitals-v1";

function load(): VitalReading[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VitalReading[]) : [];
  } catch {
    return [];
  }
}

function save(list: VitalReading[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

export function listVitals(patientId?: string): VitalReading[] {
  const all = load().sort((a, b) => b.at.localeCompare(a.at));
  return patientId ? all.filter((v) => v.patientId === patientId) : all;
}

export function recordVitals(input: Omit<VitalReading, "id" | "at">): VitalReading {
  const reading: VitalReading = {
    ...input,
    id: `VIT-${Date.now()}`,
    at: new Date().toISOString(),
  };
  const list = load();
  list.unshift(reading);
  save(list);
  return reading;
}
