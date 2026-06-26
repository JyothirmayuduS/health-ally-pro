import { resolvePatientId } from "./patients";
import { doctorPatientIdFromMrn } from "./clinic-queue";

export type ReleasedLabResult = {
  id: string;
  patientId: string;
  doctorPatientId: string;
  orderId: string;
  testName: string;
  testCode: string;
  date: string;
  status: "normal" | "abnormal" | "pending";
  summary: string;
  results?: Record<string, string>;
};

const KEY = "medora-lab-results-v1";
export const LAB_RESULTS_EVENT = "medora-lab-results-updated";

function load(): ReleasedLabResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReleasedLabResult[]) : [];
  } catch {
    return [];
  }
}

function save(list: ReleasedLabResult[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(LAB_RESULTS_EVENT));
  }
}

export function publishLabResult(input: {
  orderId: string;
  patientId: string;
  testName: string;
  testCode: string;
  results?: Record<string, string>;
  abnormal?: boolean;
}) {
  const pid = resolvePatientId(input.patientId);
  const values = input.results ? Object.values(input.results).filter(Boolean) : [];
  const summary =
    values.length > 0
      ? values.slice(0, 3).join(" · ")
      : `${input.testName} completed — see lab report`;
  const entry: ReleasedLabResult = {
    id: `LR-${input.orderId}`,
    patientId: pid,
    doctorPatientId: doctorPatientIdFromMrn(pid),
    orderId: input.orderId,
    testName: input.testName,
    testCode: input.testCode,
    date: new Date().toISOString().slice(0, 10),
    status: input.abnormal ? "abnormal" : "normal",
    summary,
    results: input.results,
  };
  const list = load().filter((r) => r.orderId !== input.orderId);
  list.unshift(entry);
  save(list);
  return entry;
}

export function listLabResults(patientId?: string): ReleasedLabResult[] {
  const all = load();
  if (!patientId) return all;
  const pid = resolvePatientId(patientId);
  return all.filter((r) => r.patientId === pid);
}

export function listLabResultsForDoctor(): ReleasedLabResult[] {
  return load();
}
