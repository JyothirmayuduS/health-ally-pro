-- Local migration mirror of remote audit_write_dlq
CREATE TABLE IF NOT EXISTS public.audit_write_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL,
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_audit_write_failures_open
  ON public.audit_write_failures (created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.audit_write_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_write_failures FROM PUBLIC;
REVOKE ALL ON public.audit_write_failures FROM anon, authenticated;
GRANT ALL ON public.audit_write_failures TO service_role;

CREATE OR REPLACE FUNCTION public.audit_write_failures_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open int;
BEGIN
  SELECT count(*) INTO v_open FROM public.audit_write_failures WHERE resolved_at IS NULL;
  RETURN jsonb_build_object(
    'ok', v_open = 0,
    'alert', v_open > 0,
    'open_failures', v_open,
    'checked_at', now()
  );
END;
$$;
REVOKE ALL ON FUNCTION public.audit_write_failures_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_write_failures_health() TO service_role;
