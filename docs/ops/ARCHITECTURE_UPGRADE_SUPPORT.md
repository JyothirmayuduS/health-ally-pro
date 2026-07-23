# Upgrade / Rollback / Support / Architecture

## Upgrade Guide

1. Read migration notes in `docs/release/`  
2. Apply Supabase migrations (MCP/CLI) — verify history  
3. Build & deploy immutable tag  
4. Run post-deploy validation (`/api/status`, PHI smokes)  

## Rollback Guide

1. Redeploy previous image/Worker version  
2. Do not drop DLQ/status columns without forward-fix plan  
3. Confirm `open_failures` and auth/tenant tests  

## Support Guide

| Issue | First step |
|-------|------------|
| Login failures | Supabase Auth logs; demo auth must be off in prod |
| Empty clinical lists | Worker secrets; hospital membership |
| DLQ alert | `audit_write_failures_health`; resolve test artifacts |
| Slow appointments | `/api/metrics` + `docs/OPERATIONS_LATENCY_BUDGET.md` |

## Architecture Overview

```text
Browser → Cloudflare Worker (TanStack Start SSR)
        → service_role Supabase (PHI) + RLS for user JWT paths
        → audit_logs (record-level) via waitUntil
        → audit_write_failures DLQ on audit insert failure

Docker: vite preview + workerd, secrets via process env bridge
```

Security invariants: Worker-only core PHI PostgREST; tenant scope; DLQ lifecycle; no secrets in images.
