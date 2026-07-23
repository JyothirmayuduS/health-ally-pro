# Medora 1.0.0 — Release Notes (enterprise hardening milestone)

**Date:** 2026-07-23  
**Git:** see current tag `v1.0.0` when published  
**Classification target:** Pilot Ready → Production Ready with limitations

## Highlights

- Remote Supabase DLQ lifecycle + appointments index migration applied  
- Docker multi-stage hardening (prod deps, tini, read-only rootfs, non-root)  
- Structured request logging + `/api/metrics`  
- Expanded GitHub Actions: lint/typecheck/tests, Gitleaks, Trivy, SBOM, gated deploy  
- Ops documentation suite under `docs/ops/`  

## Migrations

- `audit_dlq_lifecycle_appointments_index` (remote version recorded in prior evidence)

## Rollback

See `docs/ops/PRODUCTION_DEPLOYMENT_GUIDE.md` and `docs/ops/ARCHITECTURE_UPGRADE_SUPPORT.md`.

## Post-deploy checklist

- [ ] `/api/status` → `database_rpc`, `open_failures=0`  
- [ ] PHI appointments/patients/lab 200  
- [ ] 401/403 tests  
- [ ] Docker healthy (if used)  
- [ ] `PHI_AUDIT_FORCE_FAIL` unset  
