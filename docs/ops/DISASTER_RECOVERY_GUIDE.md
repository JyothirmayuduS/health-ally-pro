# Disaster Recovery Guide

## Targets

| Metric | Target | Notes |
|--------|--------|-------|
| RPO | ≤ 24h (pilot); ≤ 1h (enterprise goal) | Supabase PITR depends on plan |
| RTO | ≤ 4h (pilot); ≤ 1h (enterprise goal) | Redeploy Worker/Docker + DNS |

## Backups

- **Database:** Supabase automatic backups / PITR (plan-dependent). Verify in dashboard: Project Settings → Database → Backups.  
- **Object storage:** N/A for core PHI path (Postgres). Desk blobs in `hospital_desk_records`.  
- **App:** Immutable container tags + git tags; Wrangler version history.

## Restore procedures

### Database (Supabase)

1. Identify backup / PITR timestamp  
2. Restore to new project or in-place per Supabase docs  
3. Re-point `SUPABASE_URL` secrets  
4. Re-run migration history check (`list_migrations`)  
5. Validate DLQ + PHI reads  

### Worker

```bash
git checkout <known-good-tag>
npm ci && npm run deploy
```

### Docker

```bash
docker pull ghcr.io/<org>/medora-app:<sha>
# or local: docker compose up -d with BUILD_VERSION=<sha>
```

## Restore test (executed checklist)

Document date, operator, and result in `docs/evidence/dr-restore-test.json` when a PITR drill is run.  
**Pending** if Supabase plan lacks PITR or credentials for restore drill are unavailable — do not claim success without evidence.
