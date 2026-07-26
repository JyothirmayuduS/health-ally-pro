import { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";
import type {
  AvailabilityRuleInput,
  BookAppointmentInput,
  OpdAppointment,
  OpdQueueEntry,
  WalkInInput,
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

const APPOINTMENTS = "/api/hospital/appointments";
const QUEUE = "/api/hospital/queue";

export function listOpdAppointments(filters?: {
  date?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value) query.set(key, value);
  }
  return request<{ items: OpdAppointment[]; total: number }>(
    `${APPOINTMENTS}?${query}`,
  );
}

export function bookOpdAppointment(input: BookAppointmentInput) {
  return request<OpdAppointment>(`${APPOINTMENTS}?action=book`, "POST", input);
}

export function createOpdWalkIn(input: WalkInInput) {
  return request<{ appointment: OpdAppointment; queue: OpdQueueEntry }>(
    `${APPOINTMENTS}?action=walk_in`,
    "POST",
    input,
  );
}

export function checkInOpdAppointment(appointmentId: string) {
  return request<{ appointment: OpdAppointment; queue: OpdQueueEntry }>(
    `${APPOINTMENTS}?action=check_in`,
    "POST",
    { appointmentId },
  );
}

export function rescheduleOpdAppointment(input: {
  appointmentId: string;
  doctorId?: string;
  scheduledAt: string;
  reason?: string;
}) {
  return request<OpdAppointment>(
    `${APPOINTMENTS}?action=reschedule`,
    "POST",
    input,
  );
}

export function cancelOpdAppointment(
  appointmentId: string,
  reason: string,
  notes?: string,
) {
  return request<OpdAppointment>(`${APPOINTMENTS}?action=cancel`, "POST", {
    appointmentId,
    reason,
    notes,
  });
}

export function getDoctorAvailability(doctorId: string, date?: string) {
  const query = new URLSearchParams({ action: "availability", doctorId });
  if (date) query.set("date", date);
  return request<{ rules: unknown[]; exceptions: unknown[]; slots: string[] }>(
    `${APPOINTMENTS}?${query}`,
  );
}

export function saveDoctorAvailability(input: AvailabilityRuleInput) {
  return request<unknown>(
    `${APPOINTMENTS}?action=availability`,
    "POST",
    input,
  );
}

export function listOpdQueue(doctorId?: string) {
  const query = doctorId
    ? `?${new URLSearchParams({ doctorId }).toString()}`
    : "";
  return request<OpdQueueEntry[]>(`${QUEUE}${query}`);
}

export function transitionOpdQueue(
  queueEntryId: string,
  action: "call" | "start" | "complete" | "cancel",
) {
  return request<OpdQueueEntry>(QUEUE, "POST", { queueEntryId, action });
}

export * from "./schemas";
export * from "./compat";
