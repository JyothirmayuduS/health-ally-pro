# Operations: DLQ lifecycle & appointments latency budget

**Status:** Infrastructure-closed on remote Supabase (2026-07-23)  
**Project:** `wsnpwyqypgclsclktoyf` (`health_ally_pro`, region `ap-south-1`)  
**Migration:** `audit_dlq_lifecycle_appointments_index` (remote version `20260723132326`)  
**Hostname:** `db.wsnpwyqypgclsclktoyf.supabase.co` (API `https://wsnpwyqypgclsclktoyf.supabase.co`)

## DLQ lifecycle

```text
open → acknowledged → resolved
open → test_artifact
```

| Status | Counts as `open_failures`? | Alerts? | Notes |
|--------|----------------------------|---------|-------|
| `open` | Yes | Yes | Unresolved production incident |
| `acknowledged` | No | No | Still needs follow-up (`acknowledged_failures`) |
| `resolved` | No | No | Closed; row retained |
| `test_artifact` | No | No | Forced-failure proof; row retained |

Resolution metadata (JSONB `resolution` + mirrored in `payload.resolution`):

- `status`, `reason` / `resolution_reason`
- `acknowledged_at`, `acknowledged_by` (on ack)
- `resolved_at`, `resolved_by` (on resolve / test_artifact)
- `previous_status`, `original_error_message`, `original_created_at`

RPCs (service_role only; revoked from `anon` / `authenticated`):

- `audit_write_failures_health()`
- `resolve_audit_write_failure(p_id, p_status, p_resolved_by, p_reason)`

**Never delete** DLQ rows for cleanup. Use `scripts/resolve-test-dlq-artifacts.mjs` or proof-script auto-cleanup.

## `/api/status` → `audit_dlq.source`

| Value | Meaning |
|-------|---------|
| `database_rpc` | `audit_write_failures_health()` RPC succeeded — authoritative |
| `app_layer` | RPC unavailable; table scan fallback |
| `unavailable` | Admin client / query failure |

Do **not** treat `source: database_rpc` as success unless the RPC call actually returned.

## Forced-failure cleanup

1. Prefer scripts that auto-mark `test_artifact` after proof.
2. Or: `node --env-file=.env.local scripts/resolve-test-dlq-artifacts.mjs`
3. Ensure `PHI_AUDIT_FORCE_FAIL` is **not** set in `.dev.vars` / Wrangler secrets outside intentional tests.

## Appointments latency methodology

Timing boundary for Worker benches: **complete HTTP response round-trip** from a Node client to `localhost:8787` (not browser RUM, not Cloudflare edge, not TTFB-only).

Warm = single JWT with Worker `authorizePhiRead` 20s cache.  
Cold = fresh JWT each request (auth cache miss).  
Audit insert uses `waitUntil` and is **off** the response-critical path.

### Measured baselines (post-index, 2026-07-23)

Evidence: `docs/evidence/appointments-latency-post-index.json` (83 rows, ~28 KB embeds)

| Scenario | min | avg | p50 | p95 | p99 | max | errors |
|----------|-----|-----|-----|-----|-----|-----|--------|
| Warm sequential (n=30) | 91 | 125 | **119** | 212 | 217 | 217 | 0 |
| Cold-auth (n=8) | 267 | 334 | 319 | 410 | 410 | 410 | 0 |
| Concurrent-8 | 159 | 328 | 334 | 425 | 425 | 425 | 0 |

DB-only select (service_role, embeds): p50 ~96 ms. Index `idx_appointments_hospital_scheduled` used (Index Scan, ~0.17 ms execution in EXPLAIN).

### Thresholds (pilot)

| Metric | Warn | Critical | Reasoning |
|--------|------|----------|-----------|
| Warm sequential p95 | 400 ms | 800 ms | Measured p95 ~212 ms |
| Cold-auth p95 | 600 ms | 1200 ms | Measured ~410 ms |
| Concurrent-8 p95 | 800 ms | 1500 ms | Measured ~425 ms |
| Error rate | 1% | 5% | PHI appointments GET |
| `open_failures` | ≥1 | ≥5 | DLQ health |
| DLQ growth (opens / 15m) | ≥3 | ≥10 | Systemic outage |

### Reconciliation of earlier numbers

- **~119 ms PostgREST baseline:** direct DB/API path without Worker auth/framework — not a Worker e2e number.
- **~131–176 ms earlier Worker medians:** warm Worker complete-response medians on smaller/different samples.
- **~235 ms p50 (pre-closure suite):** same endpoint/methodology under different load/contention; **not** a regression from adding the index. Post-index remeasure warm p50 **~119 ms**.
- Do **not** merge these into one % overhead claim.

## Remaining limitations

- Pilot-scale table (~83 appointments): planner may still choose sequential scan on some embed plans; base filter uses the new index (verified).
- Docker image may lag code that exposes `audit_dlq` on `/api/status` until rebuilt — container still serves HTTP 200.
- Overall `/api/status` may show `degraded` when license/Stripe optional checks fail; `audit_dlq` is independent.
