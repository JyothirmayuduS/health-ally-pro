import type { PharmacyPatient, Prescription, AuditEntry } from "./mockData";

export function getPatient(
  rxOrId: Prescription | string,
  patients: PharmacyPatient[],
): PharmacyPatient | undefined {
  const id = typeof rxOrId === "string" ? rxOrId : rxOrId.patient_id;
  return patients.find((p) => p.id === id);
}

export const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
};

export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function pushHistory(
  rx: Prescription,
  actor: string,
  action: string,
  note?: string,
): AuditEntry[] {
  return [
    { at: new Date().toISOString(), actor, action, ...(note ? { note } : {}) },
    ...rx.history,
  ];
}
