-- Scope onboarding INSERT the same way as SELECT/UPDATE (role + hospital when set).
DROP POLICY IF EXISTS onboarding_insert_staff ON public.hospital_onboarding_leads;
CREATE POLICY onboarding_insert_staff ON public.hospital_onboarding_leads
  FOR INSERT WITH CHECK (
    public.has_role('super_admin')
    OR (
      public.has_role('hospital_admin')
      AND (
        hospital_id IS NULL
        OR hospital_id IN (SELECT public.get_user_hospital_ids())
      )
    )
  );
