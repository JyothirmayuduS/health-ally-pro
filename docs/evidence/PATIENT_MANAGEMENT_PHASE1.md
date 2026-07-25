# Patient Management Phase 1 — Evidence Narrative

## Scope
Hospital-scoped Patient Management with Postgres as the canonical store (when Supabase admin is available), Worker-mediated PHI APIs, private document storage, auditable QR identity, and role-appropriate staff/patient UIs. Local patient registry remains a compatibility fallback.

## Delivered
- Additive migration `supabase/migrations/20260726120000_patient_management_phase1.sql` (MRN counter, demographics, contacts, relationships, grants, allergies, history, consents, documents, QR tokens, private `patient-documents` bucket, RLS, PostgREST revokes).
- Domain contracts + compatibility adapter under `src/lib/patient-management/`.
- Worker APIs: `/api/hospital/patients` and `/api/hospital/patients/$patientId` with RBAC, PHI audit hooks, multipart uploads, signed downloads, QR issue/resolve.
- Reception multi-step registration + search/profile workspace; doctor chart and nursing embeds; patient self-service at `/profile/health-record`.
- Allergy resolution prefers structured rows with legacy string fallback for prescriptions.
- Unit, security inventory, and Playwright smoke tests; machine-readable evidence at `docs/evidence/patient-management-phase1.json`.

## Security posture
- QR payloads carry only opaque tokens (hashed at rest). Cross-tenant resolve returns uniform 404.
- Document MIME/size allowlists; object paths `hospital_id/patient_id/...`; anon/authenticated Storage access denied.
- New PHI tables revoked from PostgREST; Worker uses service role with hospital forcing.

## Limitations
- Migration was applied to `health_ally_pro` on 2026-07-26 and its schema/security inventory was verified.
- Full authenticated hospital A/B API probes still require dedicated cross-tenant test identities.
- Evidence contains no PHI, tokens, signed URLs, or file contents.

## Rollout
1. Migration applied; monitor Worker API/audit behavior.
2. Run authenticated cross-tenant and upload/download smoke tests.
3. Pilot staff registration → clinical embeds → patient portal.
4. Confirm appointment/queue/Rx/vaccination/lab/billing IDs still resolve via MRN compatibility.
