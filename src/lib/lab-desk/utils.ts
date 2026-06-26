import type { CatalogParameter, LabOrder, LabPatient } from "./mockData";

export function getPatient(
  orderOrId: LabOrder | string,
  patients: LabPatient[],
): LabPatient | undefined {
  const id = typeof orderOrId === "string" ? orderOrId : orderOrId.patient_id;
  return patients.find((p) => p.id === id);
}

export function flagValue(
  param: CatalogParameter,
  value: string | number | null | undefined,
): { level: string; label: string } {
  if (value === "" || value === null || value === undefined) {
    return { level: "empty", label: "" };
  }
  if (param.ref_text !== undefined) {
    return String(value).toLowerCase() === String(param.ref_text).toLowerCase()
      ? { level: "normal", label: "Normal" }
      : { level: "high", label: "Abnormal" };
  }
  const num = Number(value);
  if (Number.isNaN(num)) return { level: "empty", label: "" };
  if (param.critical_low !== undefined && num <= param.critical_low) {
    return { level: "critical", label: "Critical Low" };
  }
  if (param.critical_high !== undefined && num >= param.critical_high) {
    return { level: "critical", label: "Critical High" };
  }
  if (param.ref_low !== undefined && num < param.ref_low) {
    return { level: "low", label: "Low" };
  }
  if (param.ref_high !== undefined && num > param.ref_high) {
    return { level: "high", label: "High" };
  }
  return { level: "normal", label: "Normal" };
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
  order: LabOrder,
  actor: string,
  action: string,
  note?: string,
): LabOrder["history"] {
  return [
    { at: new Date().toISOString(), actor, action, ...(note ? { note } : {}) },
    ...order.history,
  ];
}
