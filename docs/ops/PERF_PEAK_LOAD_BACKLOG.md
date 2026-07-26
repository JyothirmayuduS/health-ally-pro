# Performance backlog — peak-load p95 (enterprise budget)

**Status:** CLOSED for production Worker ladder (2026-07-24)  
**Evidence:** `docs/evidence/perf-production-scale-report.md`  
**Observed (production Worker, after opt):** 1000 concurrent users → p95 ≈ 746ms, errors = 0  
**Enterprise target (common reads):** p50 ≤ 500ms, p95 ≤ 2000ms, p99 ≤ 4000ms, error rate &lt; 0.5% — **all PASS**

Historical Docker Vite/workerd note (~10.5s p95) is environment-specific and superseded by production Worker evidence for release claims.

## Do not

- Speculative authorization caching without security review (current: 20s memo + coalesce only)
- Weaken RLS / tenant checks
- Suppress or disable audit / DLQ work
- “Fix” latency only by lengthening sleeps or dropping routes from the mix
- Edge-cache PHI list payloads without invalidation + compliance review

## Completed this pass

1. Production ladder 100/250/500/750/1000 — before + after
2. Bottleneck isolation: Worker CPU and Postgres plans are fine; auth subrequest stampede + cold first step were real
3. Opt: in-flight `authorizePhiRead` coalesce + Cache API share (20s); ladder warm-up
4. CF `workersInvocationsAdaptive` CPU/wall/subrequests captured

## Optional follow-ups (architecture — not required for budget)

1. Smart Placement / region closer to Supabase if p50 must drop below ~150ms
2. Connection pooling strategy review under multi-isolate fanout
3. Separate cold-start SLO vs steady-state p95 in release gates

## Acceptance

Rerun 100 / 250 / 500 / 750 / 1000 with p50/p95/p99/RPS/errors/CPU/memory — **done** on production Worker. Prefer Worker evidence over local Docker for production claims.
