import { SHAREABLE_DOCTORS } from "@/lib/reports-utils";

export type ShareGrantStatus = "pending" | "active";

export type ReportShareGrant = {
  id: string;
  reportId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  initials: string;
  status: ShareGrantStatus;
  expiresDays: number;
  grantedAt: string;
};

const STORAGE_KEY = "medora-patient-report-shares-v1";
export const PATIENT_REPORTS_EVENT = "medora-patient-reports-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PATIENT_REPORTS_EVENT));
  }
}

function seedGrants(): ReportShareGrant[] {
  const rajesh = SHAREABLE_DOCTORS[0]!;
  return [
    {
      id: "sg-r1-rm",
      reportId: "r1",
      doctorId: rajesh.id,
      doctorName: rajesh.name,
      specialty: rajesh.specialty,
      initials: rajesh.initials,
      status: "pending",
      expiresDays: 7,
      grantedAt: new Date().toISOString(),
    },
  ];
}

export function listReportShareGrants(): ReportShareGrant[] {
  if (typeof window === "undefined") return seedGrants();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = seedGrants();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const parsed = JSON.parse(raw) as ReportShareGrant[];
    return Array.isArray(parsed) ? parsed : seedGrants();
  } catch {
    return seedGrants();
  }
}

export function grantsForReport(reportId: string): ReportShareGrant[] {
  return listReportShareGrants().filter((g) => g.reportId === reportId);
}

export function addShareGrants(
  reportId: string,
  doctorIds: string[],
  expiresDays: number,
): ReportShareGrant[] {
  const existing = listReportShareGrants();
  const created: ReportShareGrant[] = [];

  for (const doctorId of doctorIds) {
    if (existing.some((g) => g.reportId === reportId && g.doctorId === doctorId)) {
      continue;
    }
    const doc = SHAREABLE_DOCTORS.find((d) => d.id === doctorId);
    if (!doc) continue;
    created.push({
      id: `sg-${reportId}-${doctorId}-${Date.now()}`,
      reportId,
      doctorId,
      doctorName: doc.name,
      specialty: doc.specialty,
      initials: doc.initials,
      status: "pending",
      expiresDays,
      grantedAt: new Date().toISOString(),
    });
  }

  const next = [...existing, ...created];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
  }
  return created;
}

export function revokeShareGrant(grantId: string) {
  const next = listReportShareGrants().filter((g) => g.id !== grantId);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
  }
}

export function activatePendingGrants(reportId: string) {
  const next = listReportShareGrants().map((g) =>
    g.reportId === reportId && g.status === "pending"
      ? { ...g, status: "active" as const }
      : g,
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
  }
}
