-- DLQ lifecycle + appointments hospital read index
-- Lifecycle: open → acknowledged → resolved | test_artifact
-- Health alert: only status='open' (acknowledged is non-alerting but still unresolved work)

ALTER TABLE public.audit_write_failures
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolution JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.audit_write_failures
  DROP CONSTRAINT IF EXISTS audit_write_failures_status_check;
ALTER TABLE public.audit_write_failures
  ADD CONSTRAINT audit_write_failures_status_check
  CHECK (status IN ('open', 'acknowledged', 'resolved', 'test_artifact'));

-- Backfill from resolved_at / payload.resolution (idempotent, non-destructive).
-- Rows with resolved_at IS NULL stay open unless already acknowledged in payload.
UPDATE public.audit_write_failures
SET
  resolution = CASE
    WHEN resolution IS NULL OR resolution = '{}'::jsonb
      THEN coalesce(payload->'resolution', '{}'::jsonb)
    ELSE resolution || coalesce(payload->'resolution', '{}'::jsonb)
  END
WHERE true;

UPDATE public.audit_write_failures
SET status = CASE
  WHEN coalesce(resolution->>'status', payload #>> '{resolution,status}', '') = 'test_artifact'
    THEN 'test_artifact'
  WHEN coalesce(resolution->>'status', payload #>> '{resolution,status}', '') = 'acknowledged'
    AND resolved_at IS NULL
    THEN 'acknowledged'
  WHEN resolved_at IS NOT NULL
    THEN 'resolved'
  ELSE 'open'
END
WHERE true;

CREATE INDEX IF NOT EXISTS idx_audit_write_failures_status_open
  ON public.audit_write_failures (created_at DESC)
  WHERE status = 'open' AND resolved_at IS NULL;

CREATE OR REPLACE FUNCTION public.audit_write_failures_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open int;
  v_acked int;
  v_done int;
BEGIN
  -- Alert only on genuinely open incidents (acknowledged is tracked, non-alerting)
  SELECT count(*) INTO v_open
  FROM public.audit_write_failures
  WHERE status = 'open'
    AND resolved_at IS NULL;

  SELECT count(*) INTO v_acked
  FROM public.audit_write_failures
  WHERE status = 'acknowledged'
    AND resolved_at IS NULL;

  SELECT count(*) INTO v_done
  FROM public.audit_write_failures
  WHERE status IN ('resolved', 'test_artifact');

  RETURN jsonb_build_object(
    'ok', v_open = 0,
    'alert', v_open > 0,
    'open_failures', v_open,
    'acknowledged_failures', v_acked,
    'resolved_or_artifact', v_done,
    'checked_at', now(),
    'source', 'database_rpc'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_audit_write_failure(
  p_id UUID,
  p_status TEXT,
  p_resolved_by TEXT,
  p_reason TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.audit_write_failures%ROWTYPE;
  v_resolution jsonb;
  v_now timestamptz := now();
BEGIN
  IF p_status NOT IN ('acknowledged', 'resolved', 'test_artifact') THEN
    RAISE EXCEPTION 'invalid status %', p_status;
  END IF;

  SELECT * INTO v_row FROM public.audit_write_failures WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  v_resolution := coalesce(v_row.resolution, '{}'::jsonb) || jsonb_build_object(
    'status', p_status,
    'reason', p_reason,
    'resolution_reason', p_reason,
    'previous_status', v_row.status,
    'original_error_message', v_row.error_message,
    'original_created_at', v_row.created_at
  );

  IF p_status = 'acknowledged' THEN
    v_resolution := v_resolution || jsonb_build_object(
      'acknowledged_at', v_now,
      'acknowledged_by', p_resolved_by,
      'resolved_at', NULL
    );
  ELSE
    v_resolution := v_resolution || jsonb_build_object(
      'resolved_at', v_now,
      'resolved_by', p_resolved_by
    );
  END IF;

  UPDATE public.audit_write_failures
  SET
    status = p_status,
    resolution = v_resolution,
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('resolution', v_resolution),
    resolved_at = CASE
      WHEN p_status IN ('resolved', 'test_artifact') THEN v_now
      ELSE NULL
    END
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'status', v_row.status,
    'resolved_at', v_row.resolved_at,
    'resolution', v_row.resolution
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_audit_write_failure(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_audit_write_failure(UUID, TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_write_failures_health() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_write_failures_health() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_audit_write_failure(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.audit_write_failures_health() TO service_role;

-- Appointments list path: filter hospital_id + order scheduled_at
CREATE INDEX IF NOT EXISTS idx_appointments_hospital_scheduled
  ON public.appointments (hospital_id, scheduled_at);
