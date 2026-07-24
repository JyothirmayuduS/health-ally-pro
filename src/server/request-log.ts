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
  /** Non-PHI resource label: appointments | patients | lab_results | auth | other */
  resource?: string | null;
};

const recent: Array<{
  ts: number;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  hospital_id?: string | null;
  resource?: string | null;
  error_code?: string | null;
}> = [];
const RECENT_MAX = 2000;

const counters = {
  http_total: 0,
  http_by_status: {} as Record<string, number>,
  auth_failures: 0,
  cross_tenant_denials: 0,
  audit_persist_failures_reported: 0,
  audit_terminal_failures: 0,
};

/** Increment when both primary audit and DLQ persistence fail (no PHI). */
export function incrementAuditTerminalFailure(): void {
  counters.audit_terminal_failures += 1;
  counters.audit_persist_failures_reported += 1;
}

export function getAuditTerminalFailureCount(): number {
  return counters.audit_terminal_failures;
}

export function newRequestId(request?: Request): string {
  const hdr =
    request?.headers.get("x-request-id") ||
    request?.headers.get("cf-ray") ||
    request?.headers.get("x-correlation-id");
  if (hdr && hdr.trim()) return hdr.trim().slice(0, 128);
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function inferResource(endpoint: string, extras?: Partial<RequestLogFields>): string {
  if (extras?.resource) return extras.resource;
  if (endpoint.includes("/api/hospital/phi")) {
    // resource query is not available here; callers should pass extras.resource
    return "phi";
  }
  if (endpoint.includes("/login") || endpoint.includes("/auth")) return "auth";
  return "other";
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
    resource: fields.resource ?? null,
    error_code: fields.error_code ?? null,
  });
  if (recent.length > RECENT_MAX) recent.splice(0, recent.length - RECENT_MAX);

  counters.http_total += 1;
  const code = String(fields.status_code);
  counters.http_by_status[code] = (counters.http_by_status[code] ?? 0) + 1;
  if (fields.status_code === 401) counters.auth_failures += 1;
  if (
    fields.status_code === 403 &&
    (fields.error_code === "cross_tenant" ||
      fields.error_code === "Hospital out of scope" ||
      /out of scope|cross.?tenant/i.test(fields.error_code ?? ""))
  ) {
    counters.cross_tenant_denials += 1;
  } else if (fields.status_code === 403 && /phi|hospital/i.test(fields.endpoint)) {
    // Conservative: count hospital PHI 403s as potential tenant denials for metrics
    counters.cross_tenant_denials += 1;
  }
}

export function getRecentRequestStats(windowMs = 5 * 60 * 1000): {
  window_ms: number;
  count: number;
  error_rate: number;
  latency_ms: { p50: number; p95: number; p99: number; avg: number };
  by_endpoint: Record<string, number>;
  by_status: Record<string, number>;
  by_resource_latency_ms: Record<string, { p50: number; p95: number; p99: number; count: number }>;
  auth_failures_total: number;
  cross_tenant_denials_total: number;
  http_total: number;
  audit_terminal_failures_total: number;
} {
  const cutoff = Date.now() - windowMs;
  const rows = recent.filter((r) => r.ts >= cutoff);
  const latencies = rows.map((r) => r.latency_ms).sort((a, b) => a - b);
  const pct = (arr: number[], p: number) => {
    if (!arr.length) return 0;
    const idx = Math.min(arr.length - 1, Math.max(0, Math.ceil((p / 100) * arr.length) - 1));
    return Math.round(arr[idx] * 100) / 100;
  };
  const errors = rows.filter((r) => r.status_code >= 400).length;
  const by_endpoint: Record<string, number> = {};
  const by_status: Record<string, number> = {};
  const byResource: Record<string, number[]> = {};
  for (const r of rows) {
    by_endpoint[r.endpoint] = (by_endpoint[r.endpoint] ?? 0) + 1;
    by_status[String(r.status_code)] = (by_status[String(r.status_code)] ?? 0) + 1;
    const res = r.resource || "other";
    (byResource[res] ??= []).push(r.latency_ms);
  }
  const by_resource_latency_ms: Record<
    string,
    { p50: number; p95: number; p99: number; count: number }
  > = {};
  for (const [k, arr] of Object.entries(byResource)) {
    const s = [...arr].sort((a, b) => a - b);
    by_resource_latency_ms[k] = {
      p50: pct(s, 50),
      p95: pct(s, 95),
      p99: pct(s, 99),
      count: s.length,
    };
  }
  const avg = latencies.length
    ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100
    : 0;
  return {
    window_ms: windowMs,
    count: rows.length,
    error_rate: rows.length ? errors / rows.length : 0,
    latency_ms: { p50: pct(latencies, 50), p95: pct(latencies, 95), p99: pct(latencies, 99), avg },
    by_endpoint,
    by_status,
    by_resource_latency_ms,
    auth_failures_total: counters.auth_failures,
    cross_tenant_denials_total: counters.cross_tenant_denials,
    http_total: counters.http_total,
    audit_terminal_failures_total: counters.audit_terminal_failures,
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
    resource: inferResource(url.pathname, extras),
  });
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
