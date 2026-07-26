-- Extend desk persistence + clinical entity payload columns for Worker sync

-- Widen desk types (admin, doctor, patient portals)
ALTER TABLE public.hospital_desk_records DROP CONSTRAINT IF EXISTS hospital_desk_records_desk_check;
ALTER TABLE public.hospital_desk_records ADD CONSTRAINT hospital_desk_records_desk_check
  CHECK (desk IN ('reception','lab','pharmacy','billing','nursing','admin','doctor','patient'));

-- Legacy client IDs + rich JSON payloads on foundation clinical tables
ALTER TABLE public.encounters
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_hospital_legacy
  ON public.encounters (hospital_id, legacy_id);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_hospital_legacy
  ON public.invoices (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_hospital_legacy
  ON public.payments (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE public.lab_orders
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_orders_hospital_legacy
  ON public.lab_orders (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_prescriptions_hospital_legacy
  ON public.prescriptions (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_hospital_legacy
  ON public.notifications (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_hospital_legacy
  ON public.branches (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

-- Nursing / IPD / OT
CREATE TABLE IF NOT EXISTS public.vitals_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  legacy_id TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vitals_hospital_legacy
  ON public.vitals_readings (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  legacy_id TEXT,
  ward TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_beds_hospital_legacy
  ON public.beds (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  legacy_id TEXT,
  status TEXT DEFAULT 'active',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  admitted_at TIMESTAMPTZ DEFAULT now(),
  discharged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admissions_hospital_legacy
  ON public.admissions (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ot_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  legacy_id TEXT,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ot_rooms_hospital_legacy
  ON public.ot_rooms (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.ot_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  ot_room_id UUID REFERENCES public.ot_rooms(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  legacy_id TEXT,
  status TEXT DEFAULT 'scheduled',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ot_cases_hospital_legacy
  ON public.ot_cases (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

ALTER TABLE public.vitals_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ot_cases ENABLE ROW LEVEL SECURITY;

-- Staff read/write within hospital (service_role used by Worker)
DO $$ BEGIN
  CREATE POLICY vitals_select ON public.vitals_readings FOR SELECT USING (
    public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY vitals_manage ON public.vitals_readings FOR ALL USING (
    public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY beds_select ON public.beds FOR SELECT USING (
    public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY beds_manage ON public.beds FOR ALL USING (
    public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY admissions_select ON public.admissions FOR SELECT USING (
    public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY admissions_manage ON public.admissions FOR ALL USING (
    public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY ot_rooms_select ON public.ot_rooms FOR SELECT USING (
    public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY ot_rooms_manage ON public.ot_rooms FOR ALL USING (
    public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY ot_cases_select ON public.ot_cases FOR SELECT USING (
    public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY ot_cases_manage ON public.ot_cases FOR ALL USING (
    public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Revoke direct PostgREST access (Worker-only reads/writes)
REVOKE ALL ON public.vitals_readings FROM anon, authenticated;
REVOKE ALL ON public.beds FROM anon, authenticated;
REVOKE ALL ON public.admissions FROM anon, authenticated;
REVOKE ALL ON public.ot_rooms FROM anon, authenticated;
REVOKE ALL ON public.ot_cases FROM anon, authenticated;

GRANT ALL ON public.vitals_readings TO service_role;
GRANT ALL ON public.beds TO service_role;
GRANT ALL ON public.admissions TO service_role;
GRANT ALL ON public.ot_rooms TO service_role;
GRANT ALL ON public.ot_cases TO service_role;
