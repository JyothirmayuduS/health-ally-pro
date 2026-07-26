-- Tighten RLS so staff cannot read/write other tenants' rows.
-- Prior policies used bare is_staff() / role checks without hospital_id scope,
-- which allowed cross-tenant SELECT (confirmed via JWT SET ROLE probe).

-- Helper: staff of this hospital (or super_admin)
CREATE OR REPLACE FUNCTION public.staff_in_hospital(target_hospital UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('super_admin')
    OR (
      public.is_staff()
      AND target_hospital IN (SELECT public.get_user_hospital_ids())
    );
$$;

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS memberships_select ON public.hospital_memberships;
CREATE POLICY memberships_select ON public.hospital_memberships FOR SELECT USING (
  profile_id = auth.uid()
  OR public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS memberships_manage ON public.hospital_memberships;
CREATE POLICY memberships_manage ON public.hospital_memberships FOR ALL USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- ---------------------------------------------------------------------------
-- Staff profiles (was USING (true) — full directory leak)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS staff_select ON public.staff_profiles;
CREATE POLICY staff_select ON public.staff_profiles FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
  OR hospital_id IN (
    SELECT p.hospital_id FROM public.patients p WHERE p.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS staff_manage ON public.staff_profiles;
CREATE POLICY staff_manage ON public.staff_profiles FOR ALL USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS patients_select ON public.patients;
CREATE POLICY patients_select ON public.patients FOR SELECT USING (
  profile_id = auth.uid()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS patients_insert ON public.patients;
CREATE POLICY patients_insert ON public.patients FOR INSERT WITH CHECK (
  profile_id = auth.uid()
  OR (
    public.has_any_role(ARRAY['receptionist', 'hospital_admin', 'super_admin']::public.user_role[])
    AND (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

DROP POLICY IF EXISTS patients_update ON public.patients;
CREATE POLICY patients_update ON public.patients FOR UPDATE USING (
  profile_id = auth.uid()
  OR public.staff_in_hospital(hospital_id)
);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS appointments_select ON public.appointments;
CREATE POLICY appointments_select ON public.appointments FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS appointments_insert ON public.appointments;
CREATE POLICY appointments_insert ON public.appointments FOR INSERT WITH CHECK (
  patient_id = public.get_patient_id()
  OR (
    public.has_any_role(ARRAY['receptionist', 'doctor', 'hospital_admin']::public.user_role[])
    AND (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

DROP POLICY IF EXISTS appointments_update ON public.appointments;
CREATE POLICY appointments_update ON public.appointments FOR UPDATE USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

-- ---------------------------------------------------------------------------
-- Queue
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS queue_select ON public.queue_entries;
CREATE POLICY queue_select ON public.queue_entries FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS queue_manage ON public.queue_entries;
CREATE POLICY queue_manage ON public.queue_entries FOR ALL USING (
  public.staff_in_hospital(hospital_id)
);

-- ---------------------------------------------------------------------------
-- Encounters
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS encounters_select ON public.encounters;
CREATE POLICY encounters_select ON public.encounters FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS encounters_manage ON public.encounters;
CREATE POLICY encounters_manage ON public.encounters FOR ALL USING (
  public.has_any_role(ARRAY['doctor', 'nurse', 'hospital_admin', 'super_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- ---------------------------------------------------------------------------
-- Lab orders / results
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lab_orders_select ON public.lab_orders;
CREATE POLICY lab_orders_select ON public.lab_orders FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR (
    public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin', 'super_admin']::public.user_role[])
    AND (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

DROP POLICY IF EXISTS lab_orders_manage ON public.lab_orders;
CREATE POLICY lab_orders_manage ON public.lab_orders FOR ALL USING (
  public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS lab_results_select ON public.lab_results;
CREATE POLICY lab_results_select ON public.lab_results FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS lab_results_manage ON public.lab_results;
CREATE POLICY lab_results_manage ON public.lab_results FOR ALL USING (
  public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS lab_result_items_select ON public.lab_result_items;
CREATE POLICY lab_result_items_select ON public.lab_result_items FOR SELECT USING (
  lab_result_id IN (
    SELECT lr.id FROM public.lab_results lr
    WHERE lr.patient_id = public.get_patient_id()
       OR public.staff_in_hospital(lr.hospital_id)
  )
);

DROP POLICY IF EXISTS lab_result_items_manage ON public.lab_result_items;
CREATE POLICY lab_result_items_manage ON public.lab_result_items FOR ALL USING (
  lab_result_id IN (
    SELECT lr.id FROM public.lab_results lr
    WHERE public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin', 'super_admin']::public.user_role[])
      AND (
        public.has_role('super_admin')
        OR lr.hospital_id IN (SELECT public.get_user_hospital_ids())
      )
  )
);

-- ---------------------------------------------------------------------------
-- Prescriptions / medications
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS prescriptions_select ON public.prescriptions;
CREATE POLICY prescriptions_select ON public.prescriptions FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS prescriptions_manage ON public.prescriptions;
CREATE POLICY prescriptions_manage ON public.prescriptions FOR ALL USING (
  public.has_any_role(ARRAY['doctor', 'pharmacist', 'hospital_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS patient_medications_select ON public.patient_medications;
CREATE POLICY patient_medications_select ON public.patient_medications FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR public.staff_in_hospital(hospital_id)
);

DROP POLICY IF EXISTS patient_medications_manage ON public.patient_medications;
CREATE POLICY patient_medications_manage ON public.patient_medications FOR ALL USING (
  public.has_any_role(ARRAY['doctor', 'hospital_admin', 'receptionist', 'nurse', 'super_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS invoices_select ON public.invoices;
CREATE POLICY invoices_select ON public.invoices FOR SELECT USING (
  patient_id = public.get_patient_id()
  OR (
    public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'receptionist']::public.user_role[])
    AND (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

DROP POLICY IF EXISTS invoices_manage ON public.invoices;
CREATE POLICY invoices_manage ON public.invoices FOR ALL USING (
  public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS invoice_items_select ON public.invoice_items;
CREATE POLICY invoice_items_select ON public.invoice_items FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    WHERE i.patient_id = public.get_patient_id()
       OR (
         public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
         AND (
           public.has_role('super_admin')
           OR i.hospital_id IN (SELECT public.get_user_hospital_ids())
         )
       )
  )
);

DROP POLICY IF EXISTS invoice_items_manage ON public.invoice_items;
CREATE POLICY invoice_items_manage ON public.invoice_items FOR ALL USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    WHERE public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
      AND (
        public.has_role('super_admin')
        OR i.hospital_id IN (SELECT public.get_user_hospital_ids())
      )
  )
);

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT USING (
  invoice_id IN (SELECT id FROM public.invoices WHERE patient_id = public.get_patient_id())
  OR (
    public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'patient']::public.user_role[])
    AND (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

DROP POLICY IF EXISTS payments_manage ON public.payments;
CREATE POLICY payments_manage ON public.payments FOR ALL USING (
  public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- ---------------------------------------------------------------------------
-- Audit / notifications
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS audit_insert ON public.audit_logs;
CREATE POLICY audit_insert ON public.audit_logs FOR INSERT WITH CHECK (
  public.is_staff()
  AND (
    public.has_role('super_admin')
    OR hospital_id IS NULL
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (
  profile_id = auth.uid()
  OR (
    public.is_staff()
    AND (
      public.has_role('super_admin')
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

-- ---------------------------------------------------------------------------
-- Branches (already hospital-scoped; ensure manage path is tight)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
);

DROP POLICY IF EXISTS branches_manage ON public.branches;
CREATE POLICY branches_manage ON public.branches FOR ALL USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
  AND (
    public.has_role('super_admin')
    OR hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);
