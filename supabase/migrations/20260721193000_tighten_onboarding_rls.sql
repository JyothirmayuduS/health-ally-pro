-- Remove open anon insert on sales leads; inserts go through authenticated API + service role
DROP POLICY IF EXISTS onboarding_insert_anon ON public.hospital_onboarding_leads;

CREATE POLICY onboarding_insert_staff ON public.hospital_onboarding_leads
  FOR INSERT WITH CHECK (
    public.has_role('super_admin') OR public.has_role('hospital_admin')
  );
