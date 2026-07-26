# Operator procedure — Supabase PITR / restore drill (non-production)

**Status:** BLOCKED — restore-to-new-project not started (no Management API token; dashboard login required).  
**Evidence:** `docs/evidence/dr-restore-executed.json`  
**Never overwrite the active production database.** Do not call in-place `restore-pitr` on `wsnpwyqypgclsclktoyf`.

## Preconditions

1. Confirm project `wsnpwyqypgclsclktoyf` (`health_ally_pro`) backup/PITR availability in Supabase Dashboard → Database → Backups.
2. Record backup / PITR timestamp (UTC).
3. Define recovery point (e.g. `T-15m` before a known good state).
4. Provision a **separate** restore target via **Restore to a New Project** (not branching; branches are data-less). No production overwrite.
5. Provide agent access via gitignored `.secrets/supabase.env` (`SUPABASE_ACCESS_TOKEN`) **or** return only the new temporary project ref after dashboard restore.

## Restore

1. Start timer (`recovery_start`).
2. Restore into the approved temporary target using Dashboard **Restore to a New Project** (PITR preferred when enabled).
3. When DB accepts connections, record `database_available`.
4. Point a **non-production** app/Worker env at the restore target only (do not copy PHI to uncontrolled machines).

## Verification checklist

- [ ] tenant / hospital row present
- [ ] staff memberships present
- [ ] patient / appointments / lab_results counts plausible vs source snapshot
- [ ] audit_logs readable
- [ ] DLQ history present; `audit_write_failures_health` → `source=database_rpc`
- [ ] RLS enabled on core PHI tables
- [ ] RPCs exist (incl. audit health)
- [ ] migration history intact
- [ ] appointments index present
- [ ] clinical + security smoke against restore env
- [ ] `application_connected`, `smoke_complete` timestamps
- [ ] compute actual RTO / achieved RPO

## Cleanup

1. Destroy or lock down the temporary restore environment.
2. Revoke temporary credentials.
3. File evidence JSON under `docs/evidence/dr-restore-executed.json` (no secrets/PHI).

## If PITR unavailable on plan

Execute the strongest approved restore method (**Restore to a New Project** from daily physical backup) and document the plan limitation honestly. Do not claim PITR success.
