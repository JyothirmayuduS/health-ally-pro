-- Redesign PHI read audit for PostgREST read-only transactions.
-- Evidence: pg_net.http_post also fails with
--   "cannot execute INSERT in a read-only transaction"
-- (it INSERTs into net.http_request_queue). Sync extensions.http remains the
-- only RO-safe remote write; we add modes, DLQ-via-HTTP, and monitoring.

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE TABLE IF NOT EXISTS private.phi_read_audit_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  payload JSONB NOT NULL,
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_phi_dlq_open ON private.phi_read_audit_dlq (created_at DESC)
  WHERE resolved_at IS NULL;

REVOKE ALL ON private.phi_read_audit_dlq FROM PUBLIC;
REVOKE ALL ON private.phi_read_audit_dlq FROM anon, authenticated;
GRANT ALL ON private.phi_read_audit_dlq TO service_role;

-- Mode + optional URL override (empty override = use url)
INSERT INTO private.phi_audit_config(key, value) VALUES
  ('audit_http_mode', 'active'),
  ('url_override', ''),
  ('batch_size', '1')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.phi_audit_set_mode(p_mode text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  IF p_mode NOT IN ('active', 'off', 'broken_url') THEN
    RAISE EXCEPTION 'invalid mode %', p_mode;
  END IF;
  INSERT INTO private.phi_audit_config(key, value) VALUES ('audit_http_mode', p_mode)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  IF p_mode = 'broken_url' THEN
    INSERT INTO private.phi_audit_config(key, value)
      VALUES ('url_override', 'https://127.0.0.1:9/phi-audit-broken')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  ELSE
    INSERT INTO private.phi_audit_config(key, value) VALUES ('url_override', '')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  END IF;
  RETURN p_mode;
END;
$$;
REVOKE ALL ON FUNCTION public.phi_audit_set_mode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phi_audit_set_mode(text) TO service_role;

CREATE OR REPLACE FUNCTION public.ingest_phi_read_audit_dlq(
  p_secret text,
  p_reason text,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE v_expected text;
BEGIN
  SELECT value INTO v_expected FROM private.phi_audit_config WHERE key = 'ingest_secret';
  IF v_expected IS NULL OR p_secret IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'ingest_phi_read_audit_dlq: denied';
  END IF;
  INSERT INTO private.phi_read_audit_dlq(reason, payload)
  VALUES (coalesce(p_reason, 'unknown'), coalesce(p_payload, '{}'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.ingest_phi_read_audit_dlq(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_phi_read_audit_dlq(text, text, jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.phi_read_audit_dlq_since(p_since timestamptz)
RETURNS TABLE (
  id uuid, created_at timestamptz, reason text, payload jsonb, resolved_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT d.id, d.created_at, d.reason, d.payload, d.resolved_at
  FROM private.phi_read_audit_dlq d
  WHERE d.created_at >= p_since
  ORDER BY d.created_at DESC
  LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.phi_read_audit_dlq_since(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phi_read_audit_dlq_since(timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.phi_audit_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_open int;
  v_recent int;
  v_alert boolean;
BEGIN
  SELECT count(*) INTO v_open FROM private.phi_read_audit_dlq WHERE resolved_at IS NULL;
  SELECT count(*) INTO v_recent FROM private.phi_read_audit_dlq
    WHERE created_at > now() - interval '15 minutes' AND resolved_at IS NULL;
  v_alert := v_open > 0;
  RETURN jsonb_build_object(
    'ok', NOT v_alert,
    'alert', v_alert,
    'open_dlq_rows', v_open,
    'open_dlq_last_15m', v_recent,
    'checked_at', now()
  );
END;
$$;
REVOKE ALL ON FUNCTION public.phi_audit_health_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.phi_audit_health_check() TO service_role;

CREATE OR REPLACE FUNCTION private.log_phi_row_read(
  p_table text,
  p_row_id uuid,
  p_row_hospital uuid,
  p_allowed boolean
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  v_sub uuid := auth.uid();
  v_hospitals uuid[];
  v_jwt_role text := coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), current_user);
  v_db_role text := current_setting('role', true);
  v_actor_role text;
  v_url text;
  v_anon text;
  v_secret text;
  v_mode text;
  v_override text;
  v_payload text;
  v_res extensions.http_response;
  v_status int;
BEGIN
  IF NOT coalesce(p_allowed, false) THEN
    RETURN false;
  END IF;

  IF current_setting('private.phi_audit_active', true) = '1' THEN
    RETURN true;
  END IF;

  IF v_db_role IN ('service_role', 'supabase_admin', 'postgres') AND v_sub IS NULL THEN
    RETURN true;
  END IF;

  PERFORM set_config('private.phi_audit_active', '1', true);

  SELECT coalesce(array_agg(h ORDER BY h), '{}'::uuid[])
    INTO v_hospitals
  FROM public.get_user_hospital_ids() AS h;

  SELECT m.role::text INTO v_actor_role
  FROM public.hospital_memberships m
  WHERE m.profile_id = v_sub AND m.is_active
  ORDER BY m.created_at
  LIMIT 1;

  SELECT max(value) FILTER (WHERE key = 'url'),
         max(value) FILTER (WHERE key = 'anon_key'),
         max(value) FILTER (WHERE key = 'ingest_secret'),
         max(value) FILTER (WHERE key = 'audit_http_mode'),
         max(value) FILTER (WHERE key = 'url_override')
    INTO v_url, v_anon, v_secret, v_mode, v_override
  FROM private.phi_audit_config;

  IF v_override IS NOT NULL AND length(trim(v_override)) > 0 THEN
    v_url := v_override;
  END IF;

  -- Always emit structured postgres log (infra retention still ~24h on Free)
  RAISE LOG 'PHI_READ table=% row_id=% row_hospital=% actor_sub=% actor_role=% requester_hospitals=% jwt_role=% mode=%',
    p_table, p_row_id, p_row_hospital, v_sub, v_actor_role, v_hospitals, v_jwt_role, coalesce(v_mode, 'active');

  -- Baseline mode: no HTTP (for load-test comparison). Durable table not updated.
  IF coalesce(v_mode, 'active') = 'off' THEN
    PERFORM set_config('private.phi_audit_active', '0', true);
    RETURN true;
  END IF;

  IF v_url IS NULL OR v_anon IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'PHI_AUDIT_LOST missing_config table=% row_id=%', p_table, p_row_id;
    PERFORM set_config('private.phi_audit_active', '0', true);
    RETURN true;
  END IF;

  v_payload := json_build_object(
    'p_secret', v_secret,
    'p_table', p_table,
    'p_row_id', p_row_id,
    'p_row_hospital', p_row_hospital,
    'p_actor_sub', v_sub,
    'p_actor_role', v_actor_role,
    'p_requester_hospital_ids', coalesce(v_hospitals, '{}'::uuid[]),
    'p_jwt_role', v_jwt_role
  )::text;

  BEGIN
    v_res := extensions.http((
      'POST',
      rtrim(v_url, '/') || '/rest/v1/rpc/ingest_phi_read_audit',
      ARRAY[
        extensions.http_header('apikey', v_anon),
        extensions.http_header('Authorization', 'Bearer ' || v_anon),
        extensions.http_header('Content-Type', 'application/json')
      ],
      'application/json',
      v_payload
    )::extensions.http_request);
    v_status := v_res.status;
  EXCEPTION WHEN OTHERS THEN
    v_status := 0;
    RAISE LOG 'PHI_READ_INGEST_FAIL table=% err=%', p_table, SQLERRM;
  END;

  -- Primary failed: attempt DLQ via HTTP (also RO-safe). Never fail-closed on clinical read.
  IF v_status IS NULL OR v_status < 200 OR v_status >= 300 THEN
    BEGIN
      PERFORM extensions.http((
        'POST',
        -- DLQ ingest always targets real project URL from config (not override)
        (SELECT value FROM private.phi_audit_config WHERE key = 'url') || '/rest/v1/rpc/ingest_phi_read_audit_dlq',
        ARRAY[
          extensions.http_header('apikey', v_anon),
          extensions.http_header('Authorization', 'Bearer ' || v_anon),
          extensions.http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object(
          'p_secret', v_secret,
          'p_reason', 'primary_ingest_http_status_' || coalesce(v_status::text, 'null'),
          'p_payload', v_payload::jsonb
        )::text
      )::extensions.http_request);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'PHI_AUDIT_LOST dlq_failed table=% row_id=% err=%', p_table, p_row_id, SQLERRM;
    END;
  END IF;

  PERFORM set_config('private.phi_audit_active', '0', true);
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('private.phi_audit_active', '0', true);
  -- Never block the clinical SELECT
  RAISE LOG 'PHI_READ_LOGGER_ERROR table=% err=%', p_table, SQLERRM;
  RETURN coalesce(p_allowed, false);
END;
$$;

REVOKE ALL ON FUNCTION private.log_phi_row_read(text, uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.log_phi_row_read(text, uuid, uuid, boolean) TO authenticated, anon, service_role;

-- Alert sink table (pg_cron writes here when DLQ non-empty)
CREATE TABLE IF NOT EXISTS private.phi_audit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  alert_type TEXT NOT NULL,
  detail JSONB NOT NULL
);
REVOKE ALL ON private.phi_audit_alerts FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.phi_audit_alerts TO service_role;

CREATE OR REPLACE FUNCTION private.phi_audit_cron_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE v_health jsonb;
BEGIN
  v_health := public.phi_audit_health_check();
  IF (v_health->>'alert')::boolean THEN
    INSERT INTO private.phi_audit_alerts(alert_type, detail)
    VALUES ('phi_read_audit_dlq_open', v_health);
  END IF;
END;
$$;

-- Schedule every minute if pg_cron available
DO $$
BEGIN
  PERFORM cron.schedule(
    'phi-audit-dlq-watch',
    '* * * * *',
    $cron$ SELECT private.phi_audit_cron_check(); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END $$;
