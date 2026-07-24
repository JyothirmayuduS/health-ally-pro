import { createFileRoute } from "@tanstack/react-router";
import { optionsResponse } from "@/server/ai/api-auth";
import { getAuditWriteFailuresHealth } from "@/server/phi-audit";
import { getRecentRequestStats, newRequestId, withRequestLog } from "@/server/request-log";
import { productionBootHttpResponse } from "@/server/production-boot";
import { authorizeMetricsRequest } from "@/server/metrics-auth";

/**
 * Prometheus-text metrics — no PHI.
 * Protected by METRICS_BEARER_TOKEN (runtime secret).
 */
export const Route = createFileRoute("/api/metrics")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const blocked = productionBootHttpResponse();
        if (blocked) return withRequestLog(request, started, blocked);

        const denied = authorizeMetricsRequest(request);
        if (denied) return withRequestLog(request, started, denied);

        const dlq = await getAuditWriteFailuresHealth();
        const stats = getRecentRequestStats();
        const lines: string[] = [
          "# HELP medora_up 1 if process is serving",
          "# TYPE medora_up gauge",
          "medora_up 1",
          "# HELP medora_http_requests_total Cumulative HTTP requests (process lifetime)",
          "# TYPE medora_http_requests_total counter",
          `medora_http_requests_total ${stats.http_total}`,
          "# HELP medora_http_requests_5m Requests in rolling 5m window (in-process)",
          "# TYPE medora_http_requests_5m gauge",
          `medora_http_requests_5m ${stats.count}`,
          "# HELP medora_http_error_rate_5m Error rate in rolling 5m window",
          "# TYPE medora_http_error_rate_5m gauge",
          `medora_http_error_rate_5m ${stats.error_rate}`,
          "# HELP medora_http_latency_ms Request latency percentiles (5m in-process)",
          "# TYPE medora_http_latency_ms gauge",
          `medora_http_latency_ms{quantile="0.5"} ${stats.latency_ms.p50}`,
          `medora_http_latency_ms{quantile="0.95"} ${stats.latency_ms.p95}`,
          `medora_http_latency_ms{quantile="0.99"} ${stats.latency_ms.p99}`,
          `medora_http_latency_ms{quantile="avg"} ${stats.latency_ms.avg}`,
          "# HELP medora_auth_failures_total Authentication failures (HTTP 401)",
          "# TYPE medora_auth_failures_total counter",
          `medora_auth_failures_total ${stats.auth_failures_total}`,
          "# HELP medora_cross_tenant_denials_total Cross-tenant / out-of-scope denials (HTTP 403)",
          "# TYPE medora_cross_tenant_denials_total counter",
          `medora_cross_tenant_denials_total ${stats.cross_tenant_denials_total}`,
          "# HELP medora_audit_dlq_open_failures Unresolved audit write failures",
          "# TYPE medora_audit_dlq_open_failures gauge",
          `medora_audit_dlq_open_failures ${dlq.open_failures}`,
          "# HELP medora_audit_dlq_acknowledged_failures Acknowledged but unresolved DLQ rows",
          "# TYPE medora_audit_dlq_acknowledged_failures gauge",
          `medora_audit_dlq_acknowledged_failures ${dlq.acknowledged_failures}`,
          "# HELP medora_audit_dlq_alert 1 when open_failures > 0",
          "# TYPE medora_audit_dlq_alert gauge",
          `medora_audit_dlq_alert ${dlq.alert ? 1 : 0}`,
          "# HELP medora_audit_persist_failures_total Alias of open DLQ for alert compatibility",
          "# TYPE medora_audit_persist_failures_total gauge",
          `medora_audit_persist_failures_total ${dlq.open_failures}`,
        ];
        for (const [code, count] of Object.entries(stats.by_status)) {
          lines.push(
            `# TYPE medora_http_responses_5m gauge`,
            `medora_http_responses_5m{status="${code}"} ${count}`,
          );
        }
        for (const [endpoint, count] of Object.entries(stats.by_endpoint)) {
          const safe = endpoint.replace(/"/g, "");
          lines.push(
            `# TYPE medora_http_requests_by_endpoint_5m gauge`,
            `medora_http_requests_by_endpoint_5m{endpoint="${safe}"} ${count}`,
          );
        }
        for (const [resource, lat] of Object.entries(stats.by_resource_latency_ms)) {
          const safe = resource.replace(/"/g, "");
          lines.push(
            `# TYPE medora_resource_latency_ms gauge`,
            `medora_resource_latency_ms{resource="${safe}",quantile="0.5"} ${lat.p50}`,
            `medora_resource_latency_ms{resource="${safe}",quantile="0.95"} ${lat.p95}`,
            `medora_resource_latency_ms{resource="${safe}",quantile="0.99"} ${lat.p99}`,
            `medora_resource_requests_5m{resource="${safe}"} ${lat.count}`,
          );
        }
        // Convenience aliases for appointments/patients/lab when present
        for (const key of ["appointments", "patients", "lab_results", "phi"] as const) {
          const lat = stats.by_resource_latency_ms[key];
          if (!lat) continue;
          lines.push(
            `medora_${key.replace(/[^a-z0-9_]/g, "_")}_latency_ms{quantile="0.95"} ${lat.p95}`,
          );
        }
        const body = lines.join("\n") + "\n";
        const res = new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
        return withRequestLog(request, started, res, { request_id: newRequestId(request) });
      },
    },
  },
});
