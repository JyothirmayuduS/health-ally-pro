import { createFileRoute } from "@tanstack/react-router";
import { optionsResponse } from "@/server/ai/api-auth";
import { getAuditWriteFailuresHealth } from "@/server/phi-audit";
import { getRecentRequestStats, newRequestId, withRequestLog } from "@/server/request-log";
import { productionBootHttpResponse } from "@/server/production-boot";

/**
 * Prometheus-text metrics — no PHI.
 * Scrapable by Grafana Agent / Prometheus.
 */
export const Route = createFileRoute("/api/metrics")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const started = performance.now();
        const blocked = productionBootHttpResponse();
        if (blocked) return withRequestLog(request, started, blocked);

        const dlq = await getAuditWriteFailuresHealth();
        const stats = getRecentRequestStats();
        const lines: string[] = [
          "# HELP medora_up 1 if process is serving",
          "# TYPE medora_up gauge",
          "medora_up 1",
          "# HELP medora_audit_dlq_open_failures Unresolved audit write failures",
          "# TYPE medora_audit_dlq_open_failures gauge",
          `medora_audit_dlq_open_failures ${dlq.open_failures}`,
          "# HELP medora_audit_dlq_acknowledged_failures Acknowledged but unresolved DLQ rows",
          "# TYPE medora_audit_dlq_acknowledged_failures gauge",
          `medora_audit_dlq_acknowledged_failures ${dlq.acknowledged_failures}`,
          "# HELP medora_audit_dlq_alert 1 when open_failures > 0",
          "# TYPE medora_audit_dlq_alert gauge",
          `medora_audit_dlq_alert ${dlq.alert ? 1 : 0}`,
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
        ];
        for (const [endpoint, count] of Object.entries(stats.by_endpoint)) {
          const safe = endpoint.replace(/"/g, "");
          lines.push(
            `# TYPE medora_http_requests_by_endpoint_5m gauge`,
            `medora_http_requests_by_endpoint_5m{endpoint="${safe}"} ${count}`,
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
