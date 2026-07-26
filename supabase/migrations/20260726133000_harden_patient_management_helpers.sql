-- Keep Patient Management SECURITY DEFINER helpers off PostgREST RPC.
-- The Worker uses service_role; direct PHI table access remains revoked.

REVOKE ALL ON FUNCTION public.staff_has_role_in_hospital(UUID, public.user_role[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.patient_ids_for_user(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_patient_of(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_patient_access_grant(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.staff_has_role_in_hospital(UUID, public.user_role[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.patient_ids_for_user(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.is_patient_of(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.has_patient_access_grant(UUID, TEXT)
  TO service_role;
