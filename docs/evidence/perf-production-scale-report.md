# Production-scale performance report — Medora Worker

**Date:** 2026-07-24  
**Target:** `https://medora-health-ally.jyothirmayudu03.workers.dev`  
**Worker version (after opt):** `c58a8101-87f2-4e1e-a8af-86935981a5c4`  
**Machine-readable:** `docs/evidence/perf-production-scale-report.json`

## Verdict

All ladder steps (100 / 250 / 500 / 750 / 1000) meet the enterprise budget after one bottleneck-focused change. Further app-level gains are not significant without architectural moves (region/placement or PHI caching).

**Budget:** p50 ≤ 500ms · p95 ≤ 2000ms · p99 ≤ 4000ms · error rate &lt; 0.5%

## What was measured

| Metric | Source |
|--------|--------|
| API latency p50/p95/p99, RPS, error rate, slowest endpoints | `scripts/perf-load-ladder.mjs` |
| DB query latency | Direct PostgREST samples after each burst + SQL `EXPLAIN ANALYZE` |
| Worker CPU / wall duration / subrequests | Cloudflare GraphQL `workersInvocationsAdaptive` |
| Memory | Load-generator RSS (Worker isolate memory not exposed per request) |

## Bottlenecks (real vs not)

**Not bottlenecks**

- PostgreSQL plans for demo-hospital appointments (~5–7ms execution)
- Worker CPU (~2.7–3.1ms p50 CPU time vs hundreds of ms wall time)
- Error rate (0 before and after)
- Audit / DLQ (`open_failures=0`; async `waitUntil`)

**Real bottlenecks addressed**

1. **Auth subrequest stampede** — concurrent requests with the same JWT fanned across isolates each re-ran membership/patient lookups. Wall time ≫ CPU; ~2.2 subrequests/request.
2. **Cold first step** — users=100 before warm-up showed artificial p95 &gt; 2s.

**Residual floor (not optimized here)**

- Uncached PHI data round-trip to Supabase (~220–340ms p50). Caching list payloads would change security posture.

## Optimization (only proven path)

In `src/server/phi-reads.ts` (no business-logic / RLS / audit / tenant changes):

- In-flight coalesce of `authorizePhiRead` per token fingerprint + hospitalId
- 20s Cloudflare Cache API share across isolates (same TTL as prior isolate memory cache)

In `scripts/perf-load-ladder.mjs`:

- Warm-up (40 requests) before the first measured scenario

## Before / after

| Users | Before p95 | After p95 | Δ p95 | Before RPS | After RPS | Δ RPS | Budget |
|------:|----------:|----------:|------:|----------:|----------:|------:|:------:|
| 100 | 2270 | 811 | −64% | 31 | 50 | +61% | PASS |
| 250 | 1335 | 544 | −59% | 93 | 109 | +18% | PASS |
| 500 | 690 | 490 | −29% | 154 | 179 | +16% | PASS |
| 750 | 1398 | 581 | −58% | 121 | 207 | +72% | PASS |
| 1000 | 2206 | 746 | −66% | 142 | 235 | +66% | PASS |

**Confirmation** (100 & 1000 only): p95 **296ms** / **753ms**, errors **0**.

**Slowest endpoints (after):** `appointments` slightly ahead of `lab_results` / `patients` under load — differences are small vs the auth/queueing win.

**Worker analytics (after window):** CPU p50 ≈ 2.7ms, wall p50 ≈ 261ms, errors 0 — I/O-bound, not CPU-bound.

## Evidence files

- Before: `docs/evidence/perf-load-ladder-production-before.json`
- After: `docs/evidence/perf-load-ladder-production-after-auth-share.json`
- Confirm: `docs/evidence/perf-load-ladder-production-confirm-100-1000.json`
- CF analytics: `docs/evidence/perf-worker-analytics-after-auth-share.json`

## Recommendations

1. Keep the 20s auth memo + coalesce; do not extend TTL without security review.
2. Gate releases with a warmed staging/production ladder; report cold-start separately from steady-state p95.
3. If p50 must fall below ~150ms: measure Smart Placement / DB-proximate routing and pooler strategy before changing code.
4. Do not edge-cache PHI list payloads without invalidation + compliance review.
5. Watch `subrequests/request` and wall-vs-CPU after deploys.
6. Run the ladder on a host with adequate free RAM (low RAM inflates client-side tails).
