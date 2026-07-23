-- Revoke direct PostgREST on core PHI tables after Worker /api/hospital/phi cutover.
REVOKE ALL ON TABLE public.patients FROM anon, authenticated;
REVOKE ALL ON TABLE public.appointments FROM anon, authenticated;
REVOKE ALL ON TABLE public.lab_results FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_medications FROM anon, authenticated;
REVOKE ALL ON TABLE public.staff_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_memberships FROM anon, authenticated;
REVOKE ALL ON TABLE public.queue_entries FROM anon, authenticated;

GRANT ALL ON TABLE public.patients TO service_role;
GRANT ALL ON TABLE public.appointments TO service_role;
GRANT ALL ON TABLE public.lab_results TO service_role;
GRANT ALL ON TABLE public.patient_medications TO service_role;
GRANT ALL ON TABLE public.staff_profiles TO service_role;
GRANT ALL ON TABLE public.hospital_memberships TO service_role;
GRANT ALL ON TABLE public.queue_entries TO service_role;
