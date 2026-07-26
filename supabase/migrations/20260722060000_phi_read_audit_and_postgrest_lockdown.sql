-- PHI read audit at DB layer (PostgREST SELECT path) + PostgREST lockdown.
--
-- Why not INSERT-inside-SELECT-policy?
--   PostgREST runs GET in a read-only transaction, so a direct INSERT from the
--   RLS helper fails with: "cannot execute INSERT in a read-only transaction".
-- Workaround: extensions.http POST to public.ingest_phi_read_audit (new txn).
-- Also RAISE LOG 'PHI_READ ...' for infra postgres logs (24h on Free plan).
--
-- Config (NOT stored in git — apply once per environment):
--   INSERT INTO private.phi_audit_config(key,value) VALUES
--     ('url', 'https://<ref>.supabase.co'),
--     ('anon_key', '<anon jwt>'),
--     ('ingest_secret', '<random secret>');
--
-- Applied remotely as several MCP migrations; this file is the canonical source.

CREATE SCHEMA IF NOT EXISTS private;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgaudit WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS private.phi_read_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  table_name TEXT NOT NULL,
  row_id UUID,
  row_hospital_id UUID,
  actor_sub UUID,
  actor_role TEXT,
  requester_hospital_ids UUID[] NOT NULL DEFAULT '{}',
  jwt_role TEXT,
  cross_hospital BOOLEAN GENERATED ALWAYS AS (
    row_hospital_id IS NOT NULL
    AND cardinality(requester_hospital_ids) > 0
    AND NOT (row_hospital_id = ANY (requester_hospital_ids))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_phi_read_audit_created ON private.phi_read_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_read_audit_table ON private.phi_read_audit (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_read_audit_cross ON private.phi_read_audit (cross_hospital) WHERE cross_hospital;

ALTER TABLE private.phi_read_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phi_read_audit_select ON private.phi_read_audit;
CREATE POLICY phi_read_audit_select ON private.phi_read_audit FOR SELECT USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND (
      row_hospital_id IS NULL
      OR row_hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

REVOKE ALL ON private.phi_read_audit FROM PUBLIC;
REVOKE ALL ON private.phi_read_audit FROM anon, authenticated;
GRANT SELECT ON private.phi_read_audit TO authenticated;
GRANT ALL ON private.phi_read_audit TO service_role;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS private.phi_audit_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
REVOKE ALL ON private.phi_audit_config FROM PUBLIC;
REVOKE ALL ON private.phi_audit_config FROM anon, authenticated;
GRANT ALL ON private.phi_audit_config TO service_role;

CREATE OR REPLACE FUNCTION public.ingest_phi_read_audit(
  p_secret text,
  p_table text,
  p_row_id uuid,
  p_row_hospital uuid,
  p_actor_sub uuid,
  p_actor_role text,
  p_requester_hospital_ids uuid[],
  p_jwt_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_expected text;
BEGIN
  SELECT value INTO v_expected FROM private.phi_audit_config WHERE key = 'ingest_secret';
  IF v_expected IS NULL OR p_secret IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'ingest_phi_read_audit: denied';
  END IF;

  INSERT INTO private.phi_read_audit (
    table_name, row_id, row_hospital_id, actor_sub, actor_role,
    requester_hospital_ids, jwt_role
  ) VALUES (
    p_table, p_row_id, p_row_hospital, p_actor_sub, p_actor_role,
    coalesce(p_requester_hospital_ids, '{}'::uuid[]), p_jwt_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_phi_read_audit(text, text, uuid, uuid, uuid, text, uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_phi_read_audit(text, text, uuid, uuid, uuid, text, uuid[], text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.log_phi_row_read(
  p_table text,
  p_row_id uuid,
  p_row_hospital uuid,
  p_allowed boolean
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  v_sub uuid := auth.uid();
  v_hospitals uuid[];
  v_jwt_role text := coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), current_user);
  v_db_role text := current_setting('role', true);
  v_actor_role text;
  v_url text;
  v_anon text;
  v_secret text;
  v_payload text;
  v_res extensions.http_response;
BEGIN
  IF NOT coalesce(p_allowed, false) THEN
    RETURN false;
  END IF;

  IF current_setting('private.phi_audit_active', true) = '1' THEN
    RETURN true;
  END IF;

  IF v_db_role IN ('service_role', 'supabase_admin', 'postgres') AND v_sub IS NULL THEN
    RETURN true;
  END IF;

  PERFORM set_config('private.phi_audit_active', '1', true);

  SELECT coalesce(array_agg(h ORDER BY h), '{}'::uuid[])
    INTO v_hospitals
  FROM public.get_user_hospital_ids() AS h;

  SELECT m.role::text INTO v_actor_role
  FROM public.hospital_memberships m
  WHERE m.profile_id = v_sub AND m.is_active
  ORDER BY m.created_at
  LIMIT 1;

  SELECT max(value) FILTER (WHERE key = 'url'),
         max(value) FILTER (WHERE key = 'anon_key'),
         max(value) FILTER (WHERE key = 'ingest_secret')
    INTO v_url, v_anon, v_secret
  FROM private.phi_audit_config;

  RAISE LOG 'PHI_READ table=% row_id=% row_hospital=% actor_sub=% actor_role=% requester_hospitals=% jwt_role=%',
    p_table, p_row_id, p_row_hospital, v_sub, v_actor_role, v_hospitals, v_jwt_role;

  IF v_url IS NOT NULL AND v_anon IS NOT NULL AND v_secret IS NOT NULL THEN
    v_payload := json_build_object(
      'p_secret', v_secret,
      'p_table', p_table,
      'p_row_id', p_row_id,
      'p_row_hospital', p_row_hospital,
      'p_actor_sub', v_sub,
      'p_actor_role', v_actor_role,
      'p_requester_hospital_ids', coalesce(v_hospitals, '{}'::uuid[]),
      'p_jwt_role', v_jwt_role
    )::text;

    BEGIN
      v_res := extensions.http((
        'POST',
        v_url || '/rest/v1/rpc/ingest_phi_read_audit',
        ARRAY[
          extensions.http_header('apikey', v_anon),
          extensions.http_header('Authorization', 'Bearer ' || v_anon),
          extensions.http_header('Content-Type', 'application/json')
        ],
        'application/json',
        v_payload
      )::extensions.http_request);
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'PHI_READ_INGEST_FAIL table=% err=%', p_table, SQLERRM;
    END;
  END IF;

  PERFORM set_config('private.phi_audit_active', '0', true);
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('private.phi_audit_active', '0', true);
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION private.log_phi_row_read(text, uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.log_phi_row_read(text, uuid, uuid, boolean) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.phi_read_audit_since(
  p_since timestamptz,
  p_table text DEFAULT NULL,
  p_actor uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  table_name text,
  row_id uuid,
  row_hospital_id uuid,
  actor_sub uuid,
  actor_role text,
  requester_hospital_ids uuid[],
  jwt_role text,
  cross_hospital boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT a.id, a.created_at, a.table_name, a.row_id, a.row_hospital_id,
         a.actor_sub, a.actor_role, a.requester_hospital_ids, a.jwt_role, a.cross_hospital
  FROM private.phi_read_audit a
  WHERE a.created_at >= p_since
    AND (p_table IS NULL OR a.table_name = p_table)
    AND (p_actor IS NULL OR a.actor_sub = p_actor)
  ORDER BY a.created_at DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.phi_read_audit_since(timestamptz, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phi_read_audit_since(timestamptz, text, uuid) TO service_role;

-- SELECT policies wrapped with log_phi_row_read (all 22 hospital_id tables)
DROP POLICY IF EXISTS patients_select ON public.patients;
CREATE POLICY patients_select ON public.patients FOR SELECT USING (
  private.log_phi_row_read(
    'patients', id, hospital_id,
    (profile_id = auth.uid() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS appointments_select ON public.appointments;
CREATE POLICY appointments_select ON public.appointments FOR SELECT USING (
  private.log_phi_row_read(
    'appointments', id, hospital_id,
    (patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS queue_select ON public.queue_entries;
CREATE POLICY queue_select ON public.queue_entries FOR SELECT USING (
  private.log_phi_row_read(
    'queue_entries', id, hospital_id,
    (patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS encounters_select ON public.encounters;
CREATE POLICY encounters_select ON public.encounters FOR SELECT USING (
  private.log_phi_row_read(
    'encounters', id, hospital_id,
    (patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS lab_orders_select ON public.lab_orders;
CREATE POLICY lab_orders_select ON public.lab_orders FOR SELECT USING (
  private.log_phi_row_read(
    'lab_orders', id, hospital_id,
    (
      patient_id = public.get_patient_id()
      OR (
        public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin', 'super_admin']::public.user_role[])
        AND (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
      )
    )
  )
);

DROP POLICY IF EXISTS lab_results_select ON public.lab_results;
CREATE POLICY lab_results_select ON public.lab_results FOR SELECT USING (
  private.log_phi_row_read(
    'lab_results', id, hospital_id,
    (patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS prescriptions_select ON public.prescriptions;
CREATE POLICY prescriptions_select ON public.prescriptions FOR SELECT USING (
  private.log_phi_row_read(
    'prescriptions', id, hospital_id,
    (patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS patient_medications_select ON public.patient_medications;
CREATE POLICY patient_medications_select ON public.patient_medications FOR SELECT USING (
  private.log_phi_row_read(
    'patient_medications', id, hospital_id,
    (patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id))
  )
);

DROP POLICY IF EXISTS invoices_select ON public.invoices;
CREATE POLICY invoices_select ON public.invoices FOR SELECT USING (
  private.log_phi_row_read(
    'invoices', id, hospital_id,
    (
      patient_id = public.get_patient_id()
      OR (
        public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'receptionist']::public.user_role[])
        AND (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
      )
    )
  )
);

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT USING (
  private.log_phi_row_read(
    'payments', id, hospital_id,
    (
      invoice_id IN (SELECT id FROM public.invoices WHERE patient_id = public.get_patient_id())
      OR (
        public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'patient']::public.user_role[])
        AND (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
      )
    )
  )
);

DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (
  private.log_phi_row_read(
    'audit_logs', id, hospital_id,
    (
      public.has_role('super_admin')
      OR (public.has_role('hospital_admin') AND hospital_id IN (SELECT public.get_user_hospital_ids()))
    )
  )
);

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  private.log_phi_row_read('notifications', id, hospital_id, (profile_id = auth.uid()))
);

DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches FOR SELECT USING (
  private.log_phi_row_read(
    'branches', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS memberships_select ON public.hospital_memberships;
CREATE POLICY memberships_select ON public.hospital_memberships FOR SELECT USING (
  private.log_phi_row_read(
    'hospital_memberships', id, hospital_id,
    (
      profile_id = auth.uid()
      OR public.has_role('super_admin')
      OR (public.has_role('hospital_admin') AND hospital_id IN (SELECT public.get_user_hospital_ids()))
    )
  )
);

DROP POLICY IF EXISTS staff_select ON public.staff_profiles;
CREATE POLICY staff_select ON public.staff_profiles FOR SELECT USING (
  private.log_phi_row_read(
    'staff_profiles', id, hospital_id,
    (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
      OR hospital_id IN (SELECT p.hospital_id FROM public.patients p WHERE p.profile_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS specialty_charts_select ON public.specialty_chart_notes;
CREATE POLICY specialty_charts_select ON public.specialty_chart_notes FOR SELECT USING (
  private.log_phi_row_read(
    'specialty_chart_notes', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS anatomy_markers_select ON public.anatomy_markers;
CREATE POLICY anatomy_markers_select ON public.anatomy_markers FOR SELECT USING (
  private.log_phi_row_read(
    'anatomy_markers', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS unit_records_select ON public.hospital_unit_records;
CREATE POLICY unit_records_select ON public.hospital_unit_records FOR SELECT USING (
  private.log_phi_row_read(
    'hospital_unit_records', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS desk_records_select ON public.hospital_desk_records;
CREATE POLICY desk_records_select ON public.hospital_desk_records FOR SELECT USING (
  private.log_phi_row_read(
    'hospital_desk_records', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS hospital_doctors_select ON public.hospital_doctors;
CREATE POLICY hospital_doctors_select ON public.hospital_doctors FOR SELECT USING (
  private.log_phi_row_read(
    'hospital_doctors', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS subscriptions_select ON public.hospital_subscriptions;
CREATE POLICY subscriptions_select ON public.hospital_subscriptions FOR SELECT USING (
  private.log_phi_row_read(
    'hospital_subscriptions', id, hospital_id,
    (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS onboarding_select_staff ON public.hospital_onboarding_leads;
CREATE POLICY onboarding_select_staff ON public.hospital_onboarding_leads FOR SELECT USING (
  private.log_phi_row_read(
    'hospital_onboarding_leads', id, hospital_id,
    (
      public.has_role('super_admin')
      OR (
        public.has_role('hospital_admin')
        AND (hospital_id IS NULL OR hospital_id IN (SELECT public.get_user_hospital_ids()))
      )
    )
  )
);

-- Layer 2: revoke direct PostgREST on Worker-only tables
REVOKE ALL ON TABLE public.specialty_chart_notes FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_desk_records FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_doctors FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_unit_records FROM anon, authenticated;
REVOKE ALL ON TABLE public.anatomy_markers FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_subscriptions FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_onboarding_leads FROM anon, authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;

GRANT ALL ON TABLE public.specialty_chart_notes TO service_role;
GRANT ALL ON TABLE public.hospital_desk_records TO service_role;
GRANT ALL ON TABLE public.hospital_doctors TO service_role;
GRANT ALL ON TABLE public.hospital_unit_records TO service_role;
GRANT ALL ON TABLE public.anatomy_markers TO service_role;
GRANT ALL ON TABLE public.hospital_subscriptions TO service_role;
GRANT ALL ON TABLE public.hospital_onboarding_leads TO service_role;
GRANT ALL ON TABLE public.audit_logs TO service_role;

COMMENT ON TABLE private.phi_read_audit IS
  'Per-row SELECT audit for PostgREST/authenticated reads via HTTP ingest (RO-tx safe). service_role Worker path bypasses RLS — use public.audit_logs for app-mediated access.';
