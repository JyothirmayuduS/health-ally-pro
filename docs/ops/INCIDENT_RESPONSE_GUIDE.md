# Incident Response Guide

## Severity

| Sev | Example | Response |
|-----|---------|----------|
| SEV1 | PHI exposed cross-tenant; open_failures growing; auth bypass | Page immediately; freeze deploys |
| SEV2 | Appointments p95 > critical; Worker 5xx storm | Investigate within 15m |
| SEV3 | Optional Stripe/Turnstile down | Business hours |

## PHI / tenant isolation incident

1. Confirm via `scripts/dual-tenant-rls-check.mjs` / cross-tenant 403 tests  
2. Revoke suspect sessions in Supabase Auth  
3. Preserve `audit_logs` and `audit_write_failures` (do not truncate)  
4. Notify security owner; follow `docs/SECURITY_INCIDENT_LOG_LIMITATIONS.md`

## Audit / DLQ incident

1. Check `audit_write_failures_health()`  
2. Acknowledge with reason; fix root cause (Supabase outage, schema)  
3. Resolve when fixed; leave historical rows  

## Communication

- Internal: on-call channel + ticket  
- Customer: no PHI in status pages; use high-level outage language
