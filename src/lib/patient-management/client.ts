import { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";
import type {
  AllergyInput,
  EmergencyContactInput,
  HistoryEntryInput,
  ManagedPatient,
  PatientProfileBundle,
  PatientSearchInput,
  RegisterPatientInput,
  SignConsentInput,
  UpdatePatientInput,
} from "./schemas";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string; status?: number };

async function parseJson<T>(res: Response): Promise<ApiOk<T> | ApiErr> {
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: T;
    error?: string;
  };
  if (!res.ok || body.ok === false) {
    return { ok: false, error: body.error || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true, data: body.data as T };
}

async function jsonRequest<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<ApiOk<T> | ApiErr> {
  // Relative Worker fetches are browser-only; SSR/Miniflare has no page origin.
  if (typeof window === "undefined") {
    return { ok: false, error: "client_only", status: 0 };
  }
  try {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: await workerAuthHeaders(body != null),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    return parseJson<T>(res);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

const BASE = "/api/hospital/patients";

export async function searchPatients(q: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (q.trim()) params.set("q", q.trim());
  return jsonRequest<{
    items: ManagedPatient[];
    total: number;
    page: number;
    pageSize: number;
  }>(`${BASE}?${params}`, "GET");
}

export async function registerPatient(input: RegisterPatientInput) {
  return jsonRequest<{
    patient: ManagedPatient;
    duplicates?: ManagedPatient[];
    needsConfirmation?: boolean;
  }>(BASE, "POST", input);
}

async function fetchProfileById(id: string) {
  return jsonRequest<PatientProfileBundle>(`${BASE}/${encodeURIComponent(id)}`, "GET");
}

export async function getPatientProfile(patientId: string) {
  const direct = await fetchProfileById(patientId);
  if (direct.ok) return direct;
  if (direct.status === 404 || patientId.toUpperCase().startsWith("MRN-")) {
    const search = await searchPatients(patientId, 1);
    if (search.ok && search.data.items[0]) {
      return fetchProfileById(search.data.items[0].id);
    }
  }
  return direct;
}

export async function updatePatient(patientId: string, input: UpdatePatientInput) {
  return jsonRequest<ManagedPatient>(
    `${BASE}/${encodeURIComponent(patientId)}`,
    "PATCH",
    input,
  );
}

export async function replaceEmergencyContacts(
  patientId: string,
  contacts: EmergencyContactInput[],
) {
  return jsonRequest<unknown[]>(
    `${BASE}/${encodeURIComponent(patientId)}?action=contacts`,
    "POST",
    { contacts },
  );
}

export async function addAllergy(patientId: string, allergy: AllergyInput) {
  return jsonRequest<Record<string, unknown>>(
    `${BASE}/${encodeURIComponent(patientId)}?action=allergy`,
    "POST",
    allergy,
  );
}

export async function addHistoryEntry(patientId: string, entry: HistoryEntryInput) {
  return jsonRequest<Record<string, unknown>>(
    `${BASE}/${encodeURIComponent(patientId)}?action=history`,
    "POST",
    entry,
  );
}

export async function listConsentTemplates() {
  return jsonRequest<Array<Record<string, unknown>>>(`${BASE}?action=templates`, "GET");
}

export async function signConsent(patientId: string, input: SignConsentInput) {
  return jsonRequest<Record<string, unknown>>(
    `${BASE}/${encodeURIComponent(patientId)}?action=sign_consent`,
    "POST",
    input,
  );
}

export async function revokeConsent(patientId: string, consentId: string, reason?: string) {
  return jsonRequest<Record<string, unknown>>(
    `${BASE}/${encodeURIComponent(patientId)}?action=revoke_consent`,
    "POST",
    { consentId, reason },
  );
}

export async function uploadDocument(
  patientId: string,
  file: File,
  meta: { title: string; category: string },
) {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("title", meta.title);
    form.append("category", meta.category);
    const res = await fetch(
      `${BASE}/${encodeURIComponent(patientId)}?action=upload_document`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: await workerAuthHeaders(false),
        body: form,
      },
    );
    return parseJson<Record<string, unknown>>(res);
  } catch (e) {
    return { ok: false, error: String(e) } as ApiErr;
  }
}

export async function downloadDocument(patientId: string, documentId: string) {
  return jsonRequest<{ url: string; expiresIn: number }>(
    `${BASE}/${encodeURIComponent(patientId)}?action=download_document&documentId=${encodeURIComponent(documentId)}`,
    "GET",
  );
}

export async function archiveDocument(patientId: string, documentId: string) {
  return jsonRequest<Record<string, unknown>>(
    `${BASE}/${encodeURIComponent(patientId)}?action=archive_document`,
    "POST",
    { documentId },
  );
}

export async function issueQr(patientId: string) {
  return jsonRequest<{
    id: string;
    tokenPrefix: string;
    status: string;
    expiresAt: string | null;
    token: string;
    payload: { t: string; v: number };
    resolvePath: string;
  }>(`${BASE}/${encodeURIComponent(patientId)}?action=issue_qr`, "POST", {});
}

export async function resolveQr(token: string) {
  return jsonRequest<PatientProfileBundle>(`${BASE}?action=resolve_qr`, "POST", { token });
}

export type { PatientSearchInput };
