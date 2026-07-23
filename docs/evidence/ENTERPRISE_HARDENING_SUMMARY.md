# Enterprise Hardening Evidence Summary

**Generated:** 2026-07-23  
**Image:** `medora-app:7b4d0b9-20260723T153116Z-hardened`  
**Git HEAD (dirty tree at build):** `7b4d0b9438a5c557f4c45f2ddedb21e551147923`

## Executed validations

| Check | Result | Evidence |
|-------|--------|----------|
| Unit tests | PASS (46/46) | vitest run |
| Typecheck | FAIL (1092 TS errors, pre-existing) | `/tmp/medora-typecheck-full.log` |
| Lint | FAIL (~10k prettier backlog) | soft in CI |
| Docker multi-stage build | PASS | `docs/evidence/docker-hardened-build.log` |
| `/api/status` | PASS `database_rpc`, `open_failures=0` | `docs/evidence/docker-hardened-status.json` |
| PHI + audit durability smoke | PASS | `docs/evidence/docker-hardened-smoke.log` |
| Load smoke 100u/c20 | PASS 0 errors | `docs/evidence/load-smoke.json` |
| npm audit | 0 critical, 10 high, 5 medium, 2 low | `docs/evidence/security-scan-npm-classified.json` |
| DR restore drill | PENDING | `docs/evidence/dr-restore-test.json` |
| 500/1000 VU load | PENDING | needs k6/external |
| CI full run on GitHub | PENDING | workflow authored, not executed on Actions runners here |
| Image Trivy JSON | see scan job | may still be writing |
| Docker Scout | PENDING/slow | indexing hung or slow locally |

## Readiness

**Production Ready** (with limitations) — not Enterprise Ready until typecheck burn-down, full load, DR restore drill, and Actions green.
