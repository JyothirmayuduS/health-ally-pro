# Appointments and OPD Phase 2

## Delivered

- Postgres-backed doctor availability, availability exceptions, daily token counters,
  appointment lifecycle extensions, and a notification-ready OPD outbox.
- Dedicated Worker APIs for booking, walk-ins, check-in, rescheduling, cancellation,
  availability, queue listing, calling, consultation start, completion, and cancellation.
- Server-forced hospital scope, role-specific actions, conflict responses, PHI mutation
  audits, and service-role-only direct database access.
- Reception store dual-write with its existing desk fallback preserved.
- Doctor live queue synchronized from `queue_entries`; schedule publishing persists
  availability rules.
- Compatibility mapping keeps MRN, legacy appointment IDs, doctor IDs, routes, and
  existing prescription/vaccination/lab/billing links stable.

## Security

- New tables have RLS and are revoked from `anon` and `authenticated`.
- `next_doctor_token` validates the doctor belongs to the forced hospital and is
  executable only by `service_role`.
- Active appointments have a database conflict index on hospital, doctor, and time.
- Cross-tenant lookup failures do not return patient or appointment details.

## Verification

- Unit coverage: contracts, status mapping, compatibility, and RBAC.
- Security inventory coverage: RLS, PostgREST revokes, conflict index, and token RPC.
- Playwright coverage: booking/check-in/queue/token/doctor queue surfaces and preserved
  patient links.
- Machine-readable evidence:
  `docs/evidence/appointments-opd-phase2.json`.

## Operational limitation

The outbox is notification-ready but does not itself deliver push/SMS messages. A
provider worker can consume `opd_notification_events` later without changing the OPD
lifecycle.
