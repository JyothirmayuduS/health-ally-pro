import { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";
import type { ClinicalResource } from "@/server/clinical-phi";

export async function fetchPhiResource<T = unknown>(
  resource: string,
  params?: Record<string, string>,
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const qs = new URLSearchParams({ resource, ...(params ?? {}) });
  try {
    const res = await fetch(`/api/hospital/phi?${qs}`, {
      credentials: "same-origin",
      headers: await workerAuthHeaders(),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, data: null, error: body.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: (body.data as T) ?? null };
  } catch (e) {
    return { ok: false, data: null, error: String(e) };
  }
}

export async function upsertClinicalEntities(
  resource: ClinicalResource,
  rows: Array<{ legacy_id: string; payload: Record<string, unknown> }>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/hospital/phi", {
      method: "POST",
      credentials: "same-origin",
      headers: await workerAuthHeaders(true),
      body: JSON.stringify({ resource, rows }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: body.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** @deprecated use workerAuthHeaders from ./worker-auth-headers */
export { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";
