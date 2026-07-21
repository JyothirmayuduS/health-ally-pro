-- Stable client keys so localStorage IDs sync without duplicates
ALTER TABLE public.specialty_chart_notes
  ADD COLUMN IF NOT EXISTS client_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_specialty_charts_client_key
  ON public.specialty_chart_notes (hospital_id, client_key)
  WHERE client_key IS NOT NULL;

ALTER TABLE public.hospital_unit_records
  ADD COLUMN IF NOT EXISTS record_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_unit_records_key
  ON public.hospital_unit_records (hospital_id, record_key)
  WHERE record_key IS NOT NULL;
