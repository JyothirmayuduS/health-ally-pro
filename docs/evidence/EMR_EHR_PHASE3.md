# EMR/EHR Phase 3 — Evidence Narrative

## Scope
Hospital-scoped electronic medical record with Worker-mediated PHI APIs: patient timeline, structured vitals, ICD-10 diagnoses, SOAP notes with immutable version history, procedures, allergies, immunizations, medical history, clinical attachments, and record-level audit.

## Delivered
- Additive migration `supabase/migrations/20260726180000_emr_ehr_phase3.sql`
  - `clinical_note_versions` (immutable via triggers)
  - `patient_diagnoses`, `patient_procedures`, `patient_immunizations`, `clinical_attachments`
  - `emr_record_audit` (append-only)
  - Structured columns on `vitals_readings`
  - Private `clinical-attachments` storage bucket
  - RLS + PostgREST revoke for all new PHI tables
- Harden migration `supabase/migrations/20260726183000_harden_emr_ehr_phase3.sql` (idempotent policy/revoke parity)
- Applied remotely to `health_ally_pro` as `emr_ehr_phase3`, `emr_ehr_phase3_complete`, and `harden_emr_ehr_phase3`
- Domain contracts + client under `src/lib/emr/`
- Worker API `/api/hospital/emr/$patientId` with RBAC and PHI audit hooks
- UI: `EmrWorkspace`, `/doctor/emr/$patientId`, embedded on doctor patient chart
- Unit, security inventory, Playwright smoke tests; evidence at `docs/evidence/emr-ehr-phase3.json`

## Security posture
- Clinical note versions and EMR record audit cannot be updated or deleted.
- Direct browser PostgREST access revoked; Worker uses service role with hospital forcing.
- Attachment paths must be `hospital_id/patient_id/...`; signed downloads are short-lived.
- Cross-tenant patient resolution returns uniform 404.

## Limitations
- Authenticated cross-tenant API probes still require dedicated hospital A/B identities.
- Local immunization desk store remains a compatibility fallback alongside Postgres rows.
- Evidence contains no PHI, tokens, signed URLs, or file contents.

## Rollout
1. Apply migration to `health_ally_pro`.
2. Smoke doctor chart → EMR timeline → SOAP save/sign → ICD diagnosis → vitals.
3. Confirm note versions remain immutable and audits appear in `emr_record_audit` / `audit_logs`.
