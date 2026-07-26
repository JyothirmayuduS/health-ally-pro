# Monitoring Guide

## Endpoints

| Endpoint | Type | Contents |
|----------|------|----------|
| `/api/status` | JSON | Build identity, checks, `audit_dlq`, 5m request stats, latency budgets |
| `/api/metrics` | Prometheus text | `medora_audit_dlq_*`, `medora_http_*` |

## Suggested Grafana panels

1. `medora_audit_dlq_open_failures` (alert > 0)  
2. `medora_http_latency_ms{quantile="0.95"}`  
3. `medora_http_error_rate_5m`  
4. Request rate by endpoint  
5. Supabase dashboard: DB CPU, connection count, query latency  

## Thresholds

See `docs/OPERATIONS_LATENCY_BUDGET.md`.

## Log fields (stdout JSON)

`request_id`, `correlation_id`, `hospital_id`/`tenant_id`, `user_id`, `role`, `endpoint`, `latency_ms`, `status_code` — **no PHI payloads**.

## Retention

- Container/Cloudflare logs: retain ≥ 30 days (pilot); ≥ 90 days (enterprise)  
- `audit_logs` / `audit_write_failures`: retain per compliance policy (do not purge DLQ for “cleanup”)
