-- Harden EMR Phase 3 policies/revokes if a remote apply was truncated.
-- Idempotent: safe to re-run.

DROP POLICY IF EXISTS patient_procedures_select ON public.patient_procedures;
CREATE POLICY patient_procedures_select ON public.patient_procedures
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_procedures_manage ON public.patient_procedures;
CREATE POLICY patient_procedures_manage ON public.patient_procedures
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS patient_immunizations_select ON public.patient_immunizations;
CREATE POLICY patient_immunizations_select ON public.patient_immunizations
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_immunizations_manage ON public.patient_immunizations;
CREATE POLICY patient_immunizations_manage ON public.patient_immunizations
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS clinical_attachments_select ON public.clinical_attachments;
CREATE POLICY clinical_attachments_select ON public.clinical_attachments
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS clinical_attachments_manage ON public.clinical_attachments;
CREATE POLICY clinical_attachments_manage ON public.clinical_attachments
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse','receptionist']::public.user_role[]
    )
    OR public.is_patient_of(patient_id)
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse','receptionist']::public.user_role[]
    )
    OR public.is_patient_of(patient_id)
  );

DROP POLICY IF EXISTS emr_record_audit_select ON public.emr_record_audit;
CREATE POLICY emr_record_audit_select ON public.emr_record_audit
  FOR SELECT USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor']::public.user_role[]
    )
  );
DROP POLICY IF EXISTS emr_record_audit_insert ON public.emr_record_audit;
CREATE POLICY emr_record_audit_insert ON public.emr_record_audit
  FOR INSERT WITH CHECK (
    public.staff_in_hospital(hospital_id)
  );

REVOKE ALL ON TABLE public.clinical_note_versions FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_diagnoses FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_procedures FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_immunizations FROM anon, authenticated;
REVOKE ALL ON TABLE public.clinical_attachments FROM anon, authenticated;
REVOKE ALL ON TABLE public.emr_record_audit FROM anon, authenticated;

GRANT ALL ON TABLE public.clinical_note_versions TO service_role;
GRANT ALL ON TABLE public.patient_diagnoses TO service_role;
GRANT ALL ON TABLE public.patient_procedures TO service_role;
GRANT ALL ON TABLE public.patient_immunizations TO service_role;
GRANT ALL ON TABLE public.clinical_attachments TO service_role;
GRANT ALL ON TABLE public.emr_record_audit TO service_role;
