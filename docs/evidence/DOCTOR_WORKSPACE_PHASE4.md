# Doctor Workspace Phase 4 — Evidence Narrative

## Scope
Enterprise doctor consult board: today’s appointments, live patient queue, consultation session bridged to EMR encounters, SOAP/diagnoses, prescriptions with allergy safety, lab and radiology orders, referrals, follow-ups, and clinical tasks — with Worker-mediated PHI APIs, RLS, tenant isolation, and audit logging.

## Delivered
- Migration `supabase/migrations/20260726190000_doctor_workspace_phase4.sql`
  - `doctor_consultations`, `clinical_tasks`, `clinical_referrals`, `radiology_orders`
  - Prescription/lab extensions (`allergy_checked`, `consultation_id`)
  - RLS + PostgREST revoke
- Domain `src/lib/doctor-workspace/` + server `src/server/doctor-workspace/`
- API `/api/hospital/doctor-workspace`
- UI `/doctor/workspace` (`DoctorWorkspaceScreen`) wired into primary doctor nav
- Reuses Phase 2 OPD appointments/queue and Phase 3 EMR SOAP/diagnoses/timeline
- Unit, security inventory, Playwright smoke; evidence JSON beside this narrative

## Security posture
- New PHI tables revoked from anon/authenticated; Worker service_role with hospital forcing
- Rx blocked on active allergy substance match (HTTP 409)
- Consultation start/complete audited; order mutations audited
- Single active consult per doctor (prior active marked interrupted)

## Limitations
- Follow-up booking needs a resolvable `doctor_staff_id` in the hospital
- Specialty desk and legacy Rx UI remain secondary compatibility surfaces

## Rollout
1. Migration applied to `health_ally_pro` (schema + RLS/revoke)
2. Smoke `/doctor/workspace` → start from queue → SOAP → Rx/lab → complete
3. Confirm audits and queue status transitions
