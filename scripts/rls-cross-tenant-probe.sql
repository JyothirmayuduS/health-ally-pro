-- RLS cross-tenant probe (Supabase SQL editor).
-- Uses SET ROLE authenticated + JWT claims — NOT service_role.
-- Requires migration 20260722030000_tighten_hospital_rls_cross_tenant.
--
-- 1) Seed hospital B rows as postgres, then run the BEGIN…ROLLBACK block.
-- 2) Expect all *_b counts = 0 for Oak Haven doctor/admin; own-hospital counts > 0.
-- 3) DELETE hospital B when done (cascade).

INSERT INTO public.hospitals (id, name, slug)
VALUES (
  'c0000001-0001-4001-8001-000000000099',
  'RLS Probe Hospital B',
  'rls-probe-hospital-b'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.specialty_chart_notes (
  id, hospital_id, specialty_id, patient_name, module_id, values
) VALUES (
  'c0000001-0001-4001-8001-0000000000aa',
  'c0000001-0001-4001-8001-000000000099',
  'cardiology', 'SHOULD_NOT_SEE', 'chief-complaint', '{"probe":true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hospital_desk_records (
  id, hospital_id, desk, record_key, payload
) VALUES (
  'c0000001-0001-4001-8001-0000000000bb',
  'c0000001-0001-4001-8001-000000000099',
  'reception', 'probe-appointments', '{"probe":true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patients (id, hospital_id, mrn)
VALUES (
  'c0000001-0001-4001-8001-0000000000ff',
  'c0000001-0001-4001-8001-000000000099',
  'PROBE-MRN-B'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hospital_subscriptions (hospital_id, status, plan, meta)
VALUES (
  'c0000001-0001-4001-8001-000000000099', 'active', 'probe', '{}'::jsonb
) ON CONFLICT (hospital_id) DO UPDATE SET status = 'active';

INSERT INTO public.audit_logs (hospital_id, action, resource, metadata)
VALUES (
  'c0000001-0001-4001-8001-000000000099', 'rls_probe', 'test', '{}'::jsonb
);

-- Doctor (Oak Haven) — all foreign counts must be 0
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'b0000001-0001-4001-8001-000000000004', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"b0000001-0001-4001-8001-000000000004","role":"authenticated"}',
  true
);
SELECT
  (SELECT count(*)::int FROM patients WHERE hospital_id = 'c0000001-0001-4001-8001-000000000099') AS patients_b,
  (SELECT count(*)::int FROM specialty_chart_notes WHERE hospital_id = 'c0000001-0001-4001-8001-000000000099') AS charts_b,
  (SELECT count(*)::int FROM hospital_desk_records WHERE hospital_id = 'c0000001-0001-4001-8001-000000000099') AS desk_b,
  (SELECT count(*)::int FROM specialty_chart_notes WHERE hospital_id = 'a0000001-0001-4001-8001-000000000001') AS charts_oak;
ROLLBACK;

-- Admin (Oak Haven) — foreign audit/patients must be 0
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'b0000001-0001-4001-8001-000000000002', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"b0000001-0001-4001-8001-000000000002","role":"authenticated"}',
  true
);
SELECT
  (SELECT count(*)::int FROM patients WHERE hospital_id = 'c0000001-0001-4001-8001-000000000099') AS patients_b,
  (SELECT count(*)::int FROM audit_logs WHERE hospital_id = 'c0000001-0001-4001-8001-000000000099') AS audit_b,
  (SELECT count(*)::int FROM hospital_subscriptions WHERE hospital_id = 'c0000001-0001-4001-8001-000000000099') AS subs_b;
ROLLBACK;

-- Cleanup
-- DELETE FROM public.hospitals WHERE id = 'c0000001-0001-4001-8001-000000000099';
