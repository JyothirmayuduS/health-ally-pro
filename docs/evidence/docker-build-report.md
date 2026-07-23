# Docker build & runtime report (evidence)

Generated: 2026-07-22  
Host verified: **macOS Darwin arm64** (Docker Desktop linux/aarch64 VM)  
**Not verified:** Linux bare metal, Windows, linux/amd64 image build/run

## Checklist vs requirements

| # | Requirement | Evidence | Result |
|---|-------------|----------|--------|
| 5 | Multi-stage Dockerfile | `Dockerfile` build + production stages | **Met in file** |
| 6 | Non-root USER | `docker inspect` → `User=medora`; `docker exec id` → `uid=100(medora)` | **Met** |
| 7 | No secrets in image | History/config scan vs `.env.local` values → `PASS: no secrets in history/config`. Compose injects `SUPABASE_*` via runtime env only (`docker-compose.yml`). | **Met** |
| 8 | Pin base by digest | `FROM node:22-alpine@sha256:d51cff3fa44ab8a368ae8708ae974480165be1b699b19527b7c0d2523433b271` (arm64 via compose `NODE_DIGEST`) | **Met** |
| 9 | HEALTHCHECK reflects app health | `wget --spider http://127.0.0.1:3000/api/status` | **Instruction present; status unhealthy** because process does not serve HTTP (see runtime) |
| 10 | docker-compose local topology | `docker-compose.yml` app service, host `3001→3000`, env injection, no local Postgres (matches prod: remote Supabase) | **Compose boots; app unhealthy** |
| 11 | Image size + contents | See below | **Reported** |

## Image size (measured)

```
health-ally-pro-main-app:latest
  ID:        efcc7815183b
  Created:   2026-07-22 10:00:28 +0530
  Size:      1.35GB   (docker images)
```

Layer cost highlights (`docs/evidence/docker-history-layers.txt`):
- Production `npm ci` + wrangler install dominates hundreds of MB
- `dist` ~20MB, `public` ~9MB
- Alpine + Node base retained

**Bloat note:** Final image is **not** distroless and still carries full Node + npm deps + wrangler. This is heavy for a “minimal” image.

## Runtime attempts (both failed)

### Attempt A — `vite preview` (first image, 1.15GB)
- Container started; `vite preview` listened on `:3000`
- Host `curl http://127.0.0.1:3001/` and `/api/status` → **HTTP 404**
- In-container `wget --spider` exit code **8**
- Docker Health = **unhealthy** (correctly detected “not serving”)

### Attempt B — `wrangler dev --local` (second image, 1.35GB)
- Logs (`docs/evidence/docker-runtime-logs.txt`):

```
✘ [ERROR] The entry-point file at "@tanstack/react-start/server-entry" was not found.
```

- Health = **unhealthy**; host curl connection failed
- Root cause: `wrangler.jsonc` `main` points at a package export that is not resolvable in the pruned production install / container layout. Production deploy path remains `npm run deploy` (`wrangler deploy`) on a full build tree — **not** this container.

## Platforms

| Platform | Build | Run | Notes |
|----------|-------|-----|-------|
| macOS arm64 + Docker Desktop | Yes | Container starts; app HTTP fails | Only platform actually exercised |
| linux/amd64 | Assumed via digest comment in Dockerfile | **Not tested** | Digest override documented in compose |
| Linux host | **Not tested** | **Not tested** | |

## Honest verdict

Hardening controls (multi-stage, non-root, digest pin, no baked secrets, HEALTHCHECK that fails when HTTP is dead) are in place and verified where measurable.  
**The container does not currently serve the Medora app.** Treat Docker as packaging/hardening scaffolding; live runtime for this repo is Cloudflare Workers via Wrangler, not this image.
