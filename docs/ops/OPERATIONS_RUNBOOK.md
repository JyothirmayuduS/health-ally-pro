# Operations Runbook

## Daily checks

| Check | Command / signal | Healthy |
|-------|------------------|---------|
| App | `GET /api/status` | `ok` or degraded only for optional Stripe/Turnstile |
| DLQ | `audit_dlq.open_failures` | `0`, `source=database_rpc` |
| Metrics | `GET /api/metrics` | scrapes without 5xx |
| Docker | `docker compose ps` | `healthy`, restart count stable |

## Alerts (from docs/OPERATIONS_LATENCY_BUDGET.md)

- `open_failures >= 1` → page on-call  
- appointments warm p95 > 400 ms warn / 800 ms critical  
- HTTP error rate > 1% warn / 5% critical  
- Auth 401/403 spikes (possible attack or misconfig)

## DLQ lifecycle

`open` → `acknowledged` (non-alerting) → `resolved` | `test_artifact`  

Resolve via service_role RPC `resolve_audit_write_failure` or admin `POST /api/hospital/audit-dlq`.  
**Never delete** DLQ rows for cleanup.

## Forced-failure tests

Only on staging. Disable `PHI_AUDIT_FORCE_FAIL` afterward. Auto-resolve with `scripts/resolve-test-dlq-artifacts.mjs`.
