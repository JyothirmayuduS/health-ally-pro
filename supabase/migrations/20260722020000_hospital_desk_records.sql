-- Generic desk persistence (reception / lab / pharmacy / billing / nursing)
CREATE TABLE IF NOT EXISTS public.hospital_desk_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  desk TEXT NOT NULL CHECK (desk IN ('reception','lab','pharmacy','billing','nursing')),
  record_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, desk, record_key)
);

CREATE INDEX IF NOT EXISTS idx_desk_records_hospital_desk
  ON public.hospital_desk_records (hospital_id, desk);

ALTER TABLE public.hospital_desk_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS desk_records_select ON public.hospital_desk_records;
CREATE POLICY desk_records_select ON public.hospital_desk_records FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
DROP POLICY IF EXISTS desk_records_manage ON public.hospital_desk_records;
CREATE POLICY desk_records_manage ON public.hospital_desk_records FOR ALL USING (
  public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
);

CREATE TRIGGER trg_desk_records_updated
  BEFORE UPDATE ON public.hospital_desk_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
