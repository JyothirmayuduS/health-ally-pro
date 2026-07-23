/**
 * Structured request logging — no PHI fields.
 * Emits one JSON line per request for aggregation (Cloudflare Logpush / container stdout).
 */

export type RequestLogFields = {
  ts: string;
  level: "info" | "warn" | "error";
  msg: string;
  request_id: string;
  correlation_id: string;
  hospital_id?: string | null;
  tenant_id?: string | null;
  user_id?: string | null;
  role?: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number;
  error_code?: string | null;
};

const recent: Array<{
  ts: number;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  hospital_id?: string | null;
}> = [];
const RECENT_MAX = 2000;

export function newRequestId(request?: Request): string {
  const hdr =
    request?.headers.get("x-request-id") ||
    request?.headers.get("cf-ray") ||
    request?.headers.get("x-correlation-id");
  if (hdr && hdr.trim()) return hdr.trim().slice(0, 128);
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Log a completed request. Never pass PHI (names, MRN, record payloads). */
export function logRequest(fields: RequestLogFields): void {
  console.log(JSON.stringify({ ...fields, service: "medora" }));
  recent.push({
    ts: Date.now(),
    endpoint: fields.endpoint,
    status_code: fields.status_code,
    latency_ms: fields.latency_ms,
    hospital_id: fields.hospital_id,
  });
  if (recent.length > RECENT_MAX) recent.splice(0, recent.length - RECENT_MAX);
}

export function getRecentRequestStats(windowMs = 5 * 60 * 1000): {
  window_ms: number;
  count: number;
  error_rate: number;
  latency_ms: { p50: number; p95: number; p99: number; avg: number };
  by_endpoint: Record<string, number>;
} {
  const cutoff = Date.now() - windowMs;
  const rows = recent.filter((r) => r.ts >= cutoff);
  const latencies = rows.map((r) => r.latency_ms).sort((a, b) => a - b);
  const pct = (p: number) => {
    if (!latencies.length) return 0;
    const idx = Math.min(
      latencies.length - 1,
      Math.max(0, Math.ceil((p / 100) * latencies.length) - 1),
    );
    return Math.round(latencies[idx] * 100) / 100;
  };
  const errors = rows.filter((r) => r.status_code >= 400).length;
  const by_endpoint: Record<string, number> = {};
  for (const r of rows) by_endpoint[r.endpoint] = (by_endpoint[r.endpoint] ?? 0) + 1;
  const avg = latencies.length
    ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100
    : 0;
  return {
    window_ms: windowMs,
    count: rows.length,
    error_rate: rows.length ? errors / rows.length : 0,
    latency_ms: { p50: pct(50), p95: pct(95), p99: pct(99), avg },
    by_endpoint,
  };
}

/** Wrap a Response with request logging. */
export function withRequestLog(
  request: Request,
  started: number,
  response: Response,
  extras?: Partial<RequestLogFields>,
): Response {
  const requestId = extras?.request_id || newRequestId(request);
  const url = new URL(request.url);
  logRequest({
    ts: new Date().toISOString(),
    level: response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info",
    msg: "http_request",
    request_id: requestId,
    correlation_id: extras?.correlation_id || requestId,
    hospital_id: extras?.hospital_id ?? null,
    tenant_id: extras?.tenant_id ?? extras?.hospital_id ?? null,
    user_id: extras?.user_id ?? null,
    role: extras?.role ?? null,
    endpoint: url.pathname,
    method: request.method,
    status_code: response.status,
    latency_ms: Math.round((performance.now() - started) * 100) / 100,
    error_code: extras?.error_code ?? null,
  });
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
