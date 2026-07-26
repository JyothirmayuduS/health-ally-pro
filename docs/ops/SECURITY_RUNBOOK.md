# Security Runbook

## Guarantees (do not weaken)

- Worker/service_role only for core PHI tables  
- Record-level read audit via `waitUntil`  
- DLQ on audit write failure  
- RLS + hospital scope checks  
- Cross-tenant → 403  

## Secrets

| Location | Allowed |
|----------|---------|
| Git | Never (`.env*`, `.dev.vars` gitignored) |
| Docker image | Never |
| Runtime | Compose `env_file`, Wrangler secrets, GH Actions secrets |
| Rotation | Rotate service_role + license keys quarterly; update Wrangler/compose |

## Scans

- CI: Gitleaks, npm audit artifact, Trivy (CRITICAL/HIGH fail), CycloneDX SBOM  
- Local: `npm audit`, `docker scout` / `trivy image medora-app:<tag>`  

## Forced-fail flag

Must be empty in production. Status check `force_fail_off` must be ok.
