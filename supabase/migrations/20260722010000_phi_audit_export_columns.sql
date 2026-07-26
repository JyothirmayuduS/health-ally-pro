-- Enrich audit_logs for PHI access export
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS resource TEXT,
  ADD COLUMN IF NOT EXISTS ip TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS actor_email TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_created
  ON public.audit_logs (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON public.audit_logs (resource, created_at DESC);
