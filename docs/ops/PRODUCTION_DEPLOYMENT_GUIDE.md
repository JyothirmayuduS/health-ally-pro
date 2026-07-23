# Production Deployment Guide (Medora)

**Project:** `health_ally_pro` / `wsnpwyqypgclsclktoyf`  
**Stack:** TanStack Start + Cloudflare Workers + Supabase + Docker (vite preview/workerd)

## Prerequisites

- Supabase project with migrations applied through `20260723140000_audit_dlq_lifecycle_appointments_index`
- Wrangler secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MEDORA_LICENSE_KEY`
- Build-time: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Never bake `.env.local` / `.dev.vars` / service-role keys into images

## Deploy paths

### A. Cloudflare Workers (primary SaaS)

```bash
npm ci
npm run build
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put MEDORA_LICENSE_KEY
npm run deploy
```

### B. Docker (compose / VM)

```bash
cp .env.example .env.docker   # fill runtime secrets
export GIT_COMMIT=$(git rev-parse HEAD)
export BUILD_VERSION="$(git rev-parse --short HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"
export BUILT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
docker compose build
docker compose up -d
curl -sS http://127.0.0.1:3001/api/status
```

Expect: `audit_dlq.source=database_rpc`, `open_failures=0`, `build.git_commit` matches.

## Post-deploy validation

1. `GET /api/status` — DLQ healthy  
2. `GET /api/metrics` — Prometheus text  
3. Authenticated PHI reads: appointments, patients, lab_results → 200  
4. Missing/invalid auth → 401; cross-tenant → 403  
5. Audit row appears after response (waitUntil) within 8s  

## Rollback

- Cloudflare: `wrangler rollback` or redeploy previous version  
- Docker: `docker compose up -d` with previous immutable tag `medora-app:<sha>`  
- DB: do **not** reverse DLQ lifecycle migration without DBA review; app supports resolved_at fallback
