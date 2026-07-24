-- Performance: nested appointments embed joins queue_entries on appointment_id.
-- Additive index only — no RLS / business-logic change.
CREATE INDEX IF NOT EXISTS idx_queue_entries_appointment_id
  ON public.queue_entries (appointment_id);

ANALYZE public.queue_entries;
