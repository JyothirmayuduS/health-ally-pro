import type { BodyMarker } from "@/lib/shared/body-anatomy";
import type { ExtraVitalEntry } from "@/lib/shared/vitals-config";
import { appendClinicalEvent, demoPanelPatientId } from "@/lib/shared/clinical-event-log";
import { resolvePatientId } from "@/lib/shared/patients";

export type VitalsReading = {
  id: string;
  patientId: string;
  panelPatientId?: string;
  bp?: string;
  hr?: number;
  rr?: number;
  temp?: string;
  spo2?: number;
  weight?: string;
  extras?: ExtraVitalEntry[];
  bodyMarkers?: BodyMarker[];
  recordedAt: string;
  recordedBy?: string;
};

const STORAGE_KEY = "medora-shared-vitals-v1";
export const VITALS_STORE_EVENT = "medora-vitals-store-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(VITALS_STORE_EVENT));
  }
}

function readAll(): VitalsReading[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VitalsReading[]) : [];
  } catch {
    return [];
  }
}

function writeAll(readings: VitalsReading[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  emit();
}

const SEED: VitalsReading[] = [
  {
    id: "v-seed-1",
    patientId: "MRN-100232",
    panelPatientId: "p2",
    bp: "128/82",
    hr: 72,
    temp: "36.8°C",
    recordedAt: "2025-06-22T09:10:00.000Z",
  },
  {
    id: "v-seed-2",
    patientId: "MRN-100235",
    panelPatientId: "p3",
    bp: "142/88",
    hr: 78,
    temp: "37.1°C",
    recordedAt: "2025-06-21T14:30:00.000Z",
  },
];

function seedIfEmpty(): VitalsReading[] {
  const items = readAll();
  if (items.length > 0) return items;
  writeAll(SEED);
  return SEED;
}

export function listVitalsForPatient(patientId: string): VitalsReading[] {
  seedIfEmpty();
  const canonical = resolvePatientId(patientId);
  return readAll()
    .filter(
      (v) =>
        v.patientId === canonical ||
        v.panelPatientId === patientId ||
        v.patientId === patientId,
    )
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

function parseIntField(value?: string | number): number | undefined {
  if (typeof value === "number") return value;
  if (!value?.trim()) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

export function recordVitals(input: {
  patientId: string;
  panelPatientId?: string;
  bp?: string;
  hr?: string | number;
  rr?: string | number;
  temp?: string;
  spo2?: string | number;
  weight?: string;
  extras?: ExtraVitalEntry[];
  bodyMarkers?: BodyMarker[];
  recordedBy?: string;
}): VitalsReading | null {
  const extras = (input.extras ?? []).filter((e) => e.value.trim());
  const markers = input.bodyMarkers ?? [];
  const hasValue =
    Boolean(input.bp?.trim()) ||
    Boolean(String(input.hr ?? "").trim()) ||
    Boolean(String(input.rr ?? "").trim()) ||
    Boolean(input.temp?.trim()) ||
    Boolean(String(input.spo2 ?? "").trim()) ||
    Boolean(input.weight?.trim()) ||
    extras.length > 0 ||
    markers.length > 0;
  if (!hasValue) return null;

  const reading: VitalsReading = {
    id: `v-${Date.now()}`,
    patientId: resolvePatientId(input.patientId),
    panelPatientId: input.panelPatientId,
    bp: input.bp?.trim() || undefined,
    hr: parseIntField(input.hr),
    rr: parseIntField(input.rr),
    temp: input.temp?.trim() || undefined,
    spo2: parseIntField(input.spo2),
    weight: input.weight?.trim() || undefined,
    extras: extras.length > 0 ? extras : undefined,
    bodyMarkers: markers.length > 0 ? markers : undefined,
    recordedAt: new Date().toISOString(),
    recordedBy: input.recordedBy ?? "Dr. portal",
  };

  const items = seedIfEmpty();
  items.unshift(reading);
  writeAll(items);

  appendClinicalEvent({
    kind: "vitals_recorded",
    patientId: reading.patientId,
    panelPatientId: reading.panelPatientId ?? demoPanelPatientId(),
    title: "Vitals recorded",
    detail: [
      reading.bp && `BP ${reading.bp}`,
      reading.hr && `HR ${reading.hr}`,
      reading.rr && `RR ${reading.rr}`,
      reading.spo2 && `SpO₂ ${reading.spo2}%`,
      reading.temp,
      reading.bodyMarkers?.length
        ? `${reading.bodyMarkers.length} body marker${reading.bodyMarkers.length === 1 ? "" : "s"}`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    severity: "info",
    meta: { vitalsId: reading.id },
  });

  return reading;
}

export function subscribeVitals(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(VITALS_STORE_EVENT, onChange);
  return () => window.removeEventListener(VITALS_STORE_EVENT, onChange);
}

export function formatVitalsRecordedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
