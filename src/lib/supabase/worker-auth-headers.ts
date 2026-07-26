/**
 * Auth headers for Worker APIs (/api/hospital/phi, /api/hospital/persist).
 * Uses Supabase JWT when available; falls back to demo persist header in dev/eval.
 */
export async function workerAuthHeaders(json = false): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  try {
    const { getSession } = await import("@/lib/supabase/auth");
    const session = await getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    /* demo / offline */
  }
  headers["x-medora-persist-demo"] = "1";
  return headers;
}
