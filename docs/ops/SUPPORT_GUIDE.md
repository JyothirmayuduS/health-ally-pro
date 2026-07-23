# Support Guide

| Symptom | First checks |
|---------|----------------|
| Cannot sign in | Supabase Auth; demo auth must be off in production |
| Empty clinical lists | Worker secrets (`SUPABASE_*`); hospital membership; `/api/status` persistence |
| DLQ alert | `open_failures` on `/api/status`; acknowledge/resolve via admin DLQ API |
| Slow appointments | `/api/metrics`, `docs/OPERATIONS_LATENCY_BUDGET.md` |
| Docker unhealthy | `docker logs`, license key length ≥16, `CLOUDFLARE_INCLUDE_PROCESS_ENV` |
| 401 on PHI | Missing/expired JWT |
| 403 on PHI | Wrong hospital / cross-tenant |

Escalation: SEV1 → `docs/ops/INCIDENT_RESPONSE_GUIDE.md`.
