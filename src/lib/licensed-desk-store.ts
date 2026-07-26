/**
 * Licensed tenants must not rely on localStorage as the only store.
 * When licensed (or VITE_ALLOW_CLIENT_MOCKS=false), writes dual-sync to hospital_desk_records.
 */
import { allowClientMockData } from "@/lib/production";
import { isEvaluationBuild } from "@/lib/license";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { DeskId } from "@/server/hospital-persistence";
import { workerAuthHeaders } from "@/lib/supabase/worker-auth-headers";

const API = "/api/hospital/persist";

async function authHeaders(json = false): Promise<HeadersInit> {
  return workerAuthHeaders(json);
}

/** True when this deploy should prefer remote desk persistence over local-only. */
export function shouldPreferRemoteDeskStore(): boolean {
  if (!allowClientMockData()) return true;
  if (isSupabaseConfigured() && import.meta.env.DEV) return true;
  return !isEvaluationBuild();
}

export async function syncDeskRecords(
  desk: DeskId,
  records: Array<{ recordKey: string; payload: Record<string, unknown> }>,
) {
  if (!shouldPreferRemoteDeskStore() && records.length === 0) return null;
  try {
    const res = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: await authHeaders(true),
      body: JSON.stringify({
        action: "upsert_desk",
        desk,
        deskRecords: records.map((r) => ({
          desk,
          record_key: r.recordKey,
          payload: r.payload,
        })),
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { ok?: boolean };
  } catch {
    return null;
  }
}

export async function fetchDeskRecords(desk: DeskId) {
  try {
    const res = await fetch(`${API}?resource=desk&desk=${encodeURIComponent(desk)}`, {
      credentials: "same-origin",
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      ok?: boolean;
      data?: Array<{ record_key: string; payload: Record<string, unknown> }>;
    };
  } catch {
    return null;
  }
}

/** localStorage helper that dual-writes to remote when licensed. */
export function writeLicensedLocalJson(key: string, value: unknown, desk: DeskId, recordKey = key) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    /* quota / SSR */
  }
  if (shouldPreferRemoteDeskStore()) {
    void syncDeskRecords(desk, [
      { recordKey, payload: { value, savedAt: new Date().toISOString() } },
    ]);
  }
}

export async function readLicensedLocalJson<T>(
  key: string,
  desk: DeskId,
  fallback: T,
  recordKey = key,
): Promise<T> {
  if (shouldPreferRemoteDeskStore()) {
    const remote = await fetchDeskRecords(desk);
    const hit = remote?.data?.find((r) => r.record_key === recordKey);
    if (hit?.payload && "value" in hit.payload) {
      return hit.payload.value as T;
    }
  }
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
