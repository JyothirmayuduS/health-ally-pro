-- Close remaining unscoped staff/admin policies found in live pg_policies audit.
-- Tables already hospital-scoped via staff_in_hospital / get_user_hospital_ids are unchanged.

-- Profiles: staff must not read every profile across tenants
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (
  id = auth.uid()
  OR public.has_role('super_admin')
  OR id IN (
    SELECT m.profile_id
    FROM public.hospital_memberships m
    WHERE m.is_active = true
      AND m.hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- Hospitals manage: hospital_admin only for their own hospital row
DROP POLICY IF EXISTS hospitals_manage ON public.hospitals;
CREATE POLICY hospitals_manage ON public.hospitals FOR ALL USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND id IN (SELECT public.get_user_hospital_ids())
  )
);

-- Departments manage: via branch → hospital
DROP POLICY IF EXISTS departments_manage ON public.departments;
CREATE POLICY departments_manage ON public.departments FOR ALL USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND branch_id IN (
      SELECT b.id FROM public.branches b
      WHERE b.hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

-- Onboarding leads: hospital-scoped when hospital_id set; staff insert still allowed for new leads
DROP POLICY IF EXISTS onboarding_select_staff ON public.hospital_onboarding_leads;
CREATE POLICY onboarding_select_staff ON public.hospital_onboarding_leads FOR SELECT USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND (
      hospital_id IS NULL
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

DROP POLICY IF EXISTS onboarding_update_staff ON public.hospital_onboarding_leads;
CREATE POLICY onboarding_update_staff ON public.hospital_onboarding_leads FOR UPDATE USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND (
      hospital_id IS NULL
      OR hospital_id IN (SELECT public.get_user_hospital_ids())
    )
  )
);

-- Keep insert_staff as role gate (leads often pre-hospital); do not open to all staff
DROP POLICY IF EXISTS onboarding_insert_staff ON public.hospital_onboarding_leads;
CREATE POLICY onboarding_insert_staff ON public.hospital_onboarding_leads
  FOR INSERT WITH CHECK (
    public.has_role('super_admin') OR public.has_role('hospital_admin')
  );
