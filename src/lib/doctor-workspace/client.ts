import { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";
import type {
  ClinicalTaskInput,
  ConsultationBundle,
  DoctorWorkspaceBoard,
  FollowUpInput,
  LabOrderInput,
  PrescriptionOrderInput,
  RadiologyOrderInput,
  ReferralInput,
  StartConsultationInput,
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

const BASE = "/api/hospital/doctor-workspace";

export function getDoctorWorkspaceBoard(date?: string) {
  const q = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<DoctorWorkspaceBoard>(`${BASE}${q}`);
}

export function startDoctorConsultation(input: StartConsultationInput) {
  return request<ConsultationBundle>(`${BASE}?action=start`, "POST", input);
}

export function completeDoctorConsultation(consultationId: string, notes?: string) {
  return request<Record<string, unknown>>(`${BASE}?action=complete`, "POST", {
    consultationId,
    notes,
  });
}

export function getDoctorConsultation(consultationId: string) {
  return request<ConsultationBundle>(
    `${BASE}?action=consultation&consultationId=${encodeURIComponent(consultationId)}`,
  );
}

export function orderDoctorRx(input: PrescriptionOrderInput) {
  return request<Record<string, unknown>>(`${BASE}?action=rx`, "POST", input);
}

export function orderDoctorLab(input: LabOrderInput) {
  return request<Record<string, unknown>>(`${BASE}?action=lab`, "POST", input);
}

export function orderDoctorRadiology(input: RadiologyOrderInput) {
  return request<Record<string, unknown>>(`${BASE}?action=radiology`, "POST", input);
}

export function createDoctorReferral(input: ReferralInput) {
  return request<Record<string, unknown>>(`${BASE}?action=referral`, "POST", input);
}

export function createDoctorTask(input: ClinicalTaskInput) {
  return request<Record<string, unknown>>(`${BASE}?action=task`, "POST", input);
}

export function completeDoctorTask(taskId: string) {
  return request<Record<string, unknown>>(`${BASE}?action=complete_task`, "POST", {
    taskId,
  });
}

export function scheduleDoctorFollowUp(input: FollowUpInput) {
  return request<Record<string, unknown>>(`${BASE}?action=follow_up`, "POST", input);
}
