-- Remove sync-HTTP-in-RLS audit (too slow: +3.2s/80 rows).
-- service_role (Worker) bypasses RLS so that path never logged via log_phi_row_read.
-- Plain INSERT from RLS also fails under PostgREST READ ONLY.
-- Remaining client-reachable hospital_id tables are revoked (no app client uses them).
-- Worker /api/hospital/phi owns app-layer audit_logs writes.

-- ---------------------------------------------------------------------------
-- Restore plain SELECT policies (no log_phi_row_read)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS patients_select ON public.patients;
CREATE POLICY patients_select ON public.patients FOR SELECT USING (
  profile_id = auth.uid() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS appointments_select ON public.appointments;
CREATE POLICY appointments_select ON public.appointments FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS queue_select ON public.queue_entries;
CREATE POLICY queue_select ON public.queue_entries FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS encounters_select ON public.encounters;
CREATE POLICY encounters_select ON public.encounters FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS lab_orders_select ON public.lab_orders;
CREATE POLICY lab_orders_select ON public.lab_orders FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR (
    public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin', 'super_admin']::public.user_role[])
    AND (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS lab_results_select ON public.lab_results;
CREATE POLICY lab_results_select ON public.lab_results FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS prescriptions_select ON public.prescriptions;
CREATE POLICY prescriptions_select ON public.prescriptions FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS patient_medications_select ON public.patient_medications;
CREATE POLICY patient_medications_select ON public.patient_medications FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS invoices_select ON public.invoices;
CREATE POLICY invoices_select ON public.invoices FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR (
    public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'receptionist']::public.user_role[])
    AND (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT USING (
  invoice_id IN (SELECT id FROM public.invoices WHERE patient_id = public.get_patient_id())
  OR (
    public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'patient']::public.user_role[])
    AND (public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  profile_id = auth.uid()
);

DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS memberships_select ON public.hospital_memberships;
CREATE POLICY memberships_select ON public.hospital_memberships FOR SELECT USING (
  profile_id = auth.uid()
  OR public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS staff_select ON public.staff_profiles;
CREATE POLICY staff_select ON public.staff_profiles FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
  OR hospital_id IN (
    SELECT p.hospital_id FROM public.patients p WHERE p.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS specialty_charts_select ON public.specialty_chart_notes;
CREATE POLICY specialty_charts_select ON public.specialty_chart_notes FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS anatomy_markers_select ON public.anatomy_markers;
CREATE POLICY anatomy_markers_select ON public.anatomy_markers FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS unit_records_select ON public.hospital_unit_records;
CREATE POLICY unit_records_select ON public.hospital_unit_records FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS desk_records_select ON public.hospital_desk_records;
CREATE POLICY desk_records_select ON public.hospital_desk_records FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS hospital_doctors_select ON public.hospital_doctors;
CREATE POLICY hospital_doctors_select ON public.hospital_doctors FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS subscriptions_select ON public.hospital_subscriptions;
CREATE POLICY subscriptions_select ON public.hospital_subscriptions FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS onboarding_select_staff ON public.hospital_onboarding_leads;
CREATE POLICY onboarding_select_staff ON public.hospital_onboarding_leads FOR SELECT USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND (hospital_id IS NULL OR hospital_id IN (SELECT public.get_user_hospital_ids()))
  )
);

-- ---------------------------------------------------------------------------
-- Revoke remaining PostgREST-reachable hospital_id tables (no client callers)
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE public.branches FROM anon, authenticated;
REVOKE ALL ON TABLE public.encounters FROM anon, authenticated;
REVOKE ALL ON TABLE public.invoices FROM anon, authenticated;
REVOKE ALL ON TABLE public.lab_orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
REVOKE ALL ON TABLE public.payments FROM anon, authenticated;
REVOKE ALL ON TABLE public.prescriptions FROM anon, authenticated;

GRANT ALL ON TABLE public.branches TO service_role;
GRANT ALL ON TABLE public.encounters TO service_role;
GRANT ALL ON TABLE public.invoices TO service_role;
GRANT ALL ON TABLE public.lab_orders TO service_role;
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT ALL ON TABLE public.payments TO service_role;
GRANT ALL ON TABLE public.prescriptions TO service_role;

-- Disable HTTP audit modes (logger unused by policies; keep functions for history)
INSERT INTO private.phi_audit_config(key, value) VALUES ('audit_http_mode', 'off')
ON CONFLICT (key) DO UPDATE SET value = 'off';

COMMENT ON FUNCTION private.log_phi_row_read(text, uuid, uuid, boolean) IS
  'DEPRECATED: sync HTTP-in-RLS removed 2026-07-21 (latency). Worker uses public.audit_logs.';
