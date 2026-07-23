# Rollback Guide

## Docker

```bash
# Previous immutable tag
export BUILD_VERSION=<previous-sha-tag>
docker compose up -d
curl -sS http://127.0.0.1:3001/api/status
```

## Cloudflare Worker

```bash
npx wrangler rollback
# or redeploy known-good git tag
git checkout <tag>
npm ci && npm run deploy
```

## Database

Do not reverse DLQ lifecycle / PHI lockdown migrations without DBA review.
Prefer forward-fix. App supports `resolved_at` fallback when status column absent.

## Validation after rollback

- `audit_dlq.source=database_rpc`, `open_failures=0`
- PHI appointments/patients/lab_results 200
- Cross-tenant 403
