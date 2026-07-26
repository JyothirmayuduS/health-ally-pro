import { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";
import type {
  AllergyEmrInput,
  DiagnosisInput,
  EmrChartBundle,
  HistoryEmrInput,
  ImmunizationInput,
  ProcedureInput,
  SoapNoteInput,
  VitalsInput,
} from "./schemas";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<ApiResult<T>> {
  if (typeof window === "undefined") {
    return { ok: false, error: "client_only", status: 0 };
  }
  try {
    const response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: await workerAuthHeaders(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };
    if (!response.ok || payload.ok === false) {
      return {
        ok: false,
        error: payload.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }
    return { ok: true, data: payload.data as T };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

function patientPath(patientId: string, action?: string) {
  const base = `/api/hospital/emr/${encodeURIComponent(patientId)}`;
  return action ? `${base}?action=${encodeURIComponent(action)}` : base;
}

export function getEmrChart(patientId: string) {
  return request<EmrChartBundle>(patientPath(patientId));
}

export function openEmrEncounter(
  patientId: string,
  input: {
    chiefComplaint?: string;
    appointmentId?: string | null;
    doctorStaffId?: string | null;
  },
) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "open_encounter"),
    "POST",
    input,
  );
}

export function saveEmrSoap(patientId: string, input: SoapNoteInput) {
  return request<{ encounter: Record<string, unknown>; version: Record<string, unknown> }>(
    patientPath(patientId, "soap"),
    "POST",
    input,
  );
}

export function recordEmrVitals(patientId: string, input: VitalsInput) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "vitals"),
    "POST",
    input,
  );
}

export function addEmrDiagnosis(patientId: string, input: DiagnosisInput) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "diagnosis"),
    "POST",
    input,
  );
}

export function addEmrProcedure(patientId: string, input: ProcedureInput) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "procedure"),
    "POST",
    input,
  );
}

export function addEmrAllergy(patientId: string, input: AllergyEmrInput) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "allergy"),
    "POST",
    input,
  );
}

export function addEmrImmunization(patientId: string, input: ImmunizationInput) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "immunization"),
    "POST",
    input,
  );
}

export function addEmrHistory(patientId: string, input: HistoryEmrInput) {
  return request<Record<string, unknown>>(
    patientPath(patientId, "history"),
    "POST",
    input,
  );
}

export function listEmrNoteVersions(patientId: string, encounterId?: string) {
  const q = new URLSearchParams({ action: "note_versions" });
  if (encounterId) q.set("encounterId", encounterId);
  return request<Array<Record<string, unknown>>>(
    `/api/hospital/emr/${encodeURIComponent(patientId)}?${q}`,
  );
}

export async function uploadEmrAttachment(
  patientId: string,
  file: File,
  meta: { title: string; category?: string; encounterId?: string },
): Promise<ApiResult<Record<string, unknown>>> {
  if (typeof window === "undefined") {
    return { ok: false, error: "client_only", status: 0 };
  }
  try {
    const form = new FormData();
    form.set("file", file);
    form.set("title", meta.title);
    if (meta.category) form.set("category", meta.category);
    if (meta.encounterId) form.set("encounterId", meta.encounterId);
    const response = await fetch(patientPath(patientId, "attachment"), {
      method: "POST",
      credentials: "same-origin",
      headers: await workerAuthHeaders(false),
      body: form,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: Record<string, unknown>;
      error?: string;
    };
    if (!response.ok || payload.ok === false) {
      return {
        ok: false,
        error: payload.error || `HTTP ${response.status}`,
        status: response.status,
      };
    }
    return { ok: true, data: payload.data as Record<string, unknown> };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
