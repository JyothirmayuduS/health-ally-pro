import type { SpecialtyId } from "./types";

const STORAGE_KEY = "medora-specialty-charts-v1";
const EVENT = "medora-specialty-charts-updated";

export type SpecialtyChartNote = {
  id: string;
  specialtyId: SpecialtyId;
  doctorId: string;
  patientName: string;
  patientId?: string;
  moduleId: string;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function loadSpecialtyCharts(): SpecialtyChartNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SpecialtyChartNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSpecialtyCharts(notes: SpecialtyChartNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  emit();
}

export function subscribeSpecialtyCharts(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function saveSpecialtyChartNote(
  input: Omit<SpecialtyChartNote, "id" | "createdAt" | "updatedAt"> & { id?: string },
): SpecialtyChartNote {
  const list = loadSpecialtyCharts();
  const ts = new Date().toISOString();
  if (input.id) {
    const idx = list.findIndex((n) => n.id === input.id);
    if (idx >= 0) {
      const next = { ...list[idx], ...input, updatedAt: ts };
      list[idx] = next;
      saveSpecialtyCharts(list);
      void import("@/lib/specialties/remote-sync").then(({ syncChartToRemote }) =>
        syncChartToRemote(next).catch(() => undefined),
      );
      return next;
    }
  }
  const note: SpecialtyChartNote = {
    id: `SCH-${Date.now().toString(36)}`,
    specialtyId: input.specialtyId,
    doctorId: input.doctorId,
    patientName: input.patientName,
    patientId: input.patientId,
    moduleId: input.moduleId,
    values: input.values,
    createdAt: ts,
    updatedAt: ts,
  };
  saveSpecialtyCharts([note, ...list]);
  void import("@/lib/specialties/remote-sync").then(({ syncChartToRemote }) =>
    syncChartToRemote(note).catch(() => undefined),
  );
  return note;
}

export async function hydrateSpecialtyChartsFromRemote(specialtyId?: SpecialtyId) {
  const { fetchChartsFromRemote } = await import("@/lib/specialties/remote-sync");
  const remote = await fetchChartsFromRemote(specialtyId);
  if (!remote || remote.length === 0) return loadSpecialtyCharts();
  const local = loadSpecialtyCharts();
  const byId = new Map(local.map((n) => [n.id, n]));
  for (const n of remote) byId.set(n.id, n);
  const merged = [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  saveSpecialtyCharts(merged);
  return merged;
}

export function chartsForSpecialty(specialtyId: SpecialtyId, doctorId?: string) {
  return loadSpecialtyCharts().filter(
    (n) => n.specialtyId === specialtyId && (!doctorId || n.doctorId === doctorId),
  );
}
