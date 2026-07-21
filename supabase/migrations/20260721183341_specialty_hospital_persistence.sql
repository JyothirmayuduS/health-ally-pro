-- Specialty desks, hospital onboarding, units, anatomy markers — selling-ready persistence

-- Extend hospitals with commercial fields
ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS bed_count INTEGER,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'evaluation',
  ADD COLUMN IF NOT EXISTS license_key_hint TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#1B3B2E',
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Specialty id on staff (canonical SpecialtyId string)
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS specialty_id TEXT,
  ADD COLUMN IF NOT EXISTS room TEXT,
  ADD COLUMN IF NOT EXISTS registration_no TEXT,
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_specialty_id ON public.staff_profiles(specialty_id);
CREATE INDEX IF NOT EXISTS idx_staff_auth_user ON public.staff_profiles(auth_user_id);

-- Hospital doctor registry (admin-assigned specialty → doctor desk)
CREATE TABLE IF NOT EXISTS public.hospital_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty_id TEXT NOT NULL,
  room TEXT,
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  phone TEXT,
  registration_no TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  demo_auth_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, doctor_code),
  UNIQUE (hospital_id, email)
);

CREATE INDEX IF NOT EXISTS idx_hospital_doctors_specialty ON public.hospital_doctors(hospital_id, specialty_id);
CREATE INDEX IF NOT EXISTS idx_hospital_doctors_auth ON public.hospital_doctors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_doctors_demo ON public.hospital_doctors(demo_auth_key);

-- Specialty clinical chart notes
CREATE TABLE IF NOT EXISTS public.specialty_chart_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.hospital_doctors(id) ON DELETE SET NULL,
  specialty_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  module_id TEXT NOT NULL,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialty_charts_hospital ON public.specialty_chart_notes(hospital_id, specialty_id);
CREATE INDEX IF NOT EXISTS idx_specialty_charts_doctor ON public.specialty_chart_notes(doctor_id);

-- Anatomy markers (specialty or vitals)
CREATE TABLE IF NOT EXISTS public.anatomy_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  specialty_id TEXT,
  doctor_id UUID REFERENCES public.hospital_doctors(id) ON DELETE SET NULL,
  region_id TEXT NOT NULL,
  label TEXT NOT NULL,
  view TEXT NOT NULL DEFAULT 'external-front',
  mesh_type TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anatomy_markers_patient ON public.anatomy_markers(patient_id);
CREATE INDEX IF NOT EXISTS idx_anatomy_markers_specialty ON public.anatomy_markers(hospital_id, specialty_id);

-- Hospital support units (blood bank, CSSD, EMS, …)
CREATE TABLE IF NOT EXISTS public.hospital_unit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  meta TEXT,
  priority TEXT DEFAULT 'routine',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unit_records_hospital ON public.hospital_unit_records(hospital_id, unit_id);

-- Commercial onboarding leads / hospital signup drafts
CREATE TABLE IF NOT EXISTS public.hospital_onboarding_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name TEXT NOT NULL,
  legal_name TEXT,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  city TEXT,
  beds INTEGER,
  plan TEXT NOT NULL DEFAULT 'professional',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  accent_color TEXT DEFAULT '#1B3B2E',
  status TEXT NOT NULL DEFAULT 'draft',
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_email ON public.hospital_onboarding_leads(admin_email);

-- SaaS subscription stubs (Stripe-ready)
CREATE TABLE IF NOT EXISTS public.hospital_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  seats INTEGER DEFAULT 25,
  current_period_end TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id)
);

-- Triggers
CREATE TRIGGER trg_hospital_doctors_updated
  BEFORE UPDATE ON public.hospital_doctors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_specialty_charts_updated
  BEFORE UPDATE ON public.specialty_chart_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_anatomy_markers_updated
  BEFORE UPDATE ON public.anatomy_markers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_unit_records_updated
  BEFORE UPDATE ON public.hospital_unit_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_onboarding_updated
  BEFORE UPDATE ON public.hospital_onboarding_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON public.hospital_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.hospital_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_chart_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anatomy_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_unit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_onboarding_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY hospital_doctors_select ON public.hospital_doctors FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY hospital_doctors_manage ON public.hospital_doctors FOR ALL USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

CREATE POLICY specialty_charts_select ON public.specialty_chart_notes FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY specialty_charts_manage ON public.specialty_chart_notes FOR ALL USING (
  public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
);

CREATE POLICY anatomy_markers_select ON public.anatomy_markers FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY anatomy_markers_manage ON public.anatomy_markers FOR ALL USING (
  public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
);

CREATE POLICY unit_records_select ON public.hospital_unit_records FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY unit_records_manage ON public.hospital_unit_records FOR ALL USING (
  public.is_staff() AND hospital_id IN (SELECT public.get_user_hospital_ids())
);

-- Onboarding: allow anon insert for sales funnel; staff can read
CREATE POLICY onboarding_insert_anon ON public.hospital_onboarding_leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY onboarding_select_staff ON public.hospital_onboarding_leads FOR SELECT USING (
  public.has_role('super_admin') OR public.has_role('hospital_admin')
);
CREATE POLICY onboarding_update_staff ON public.hospital_onboarding_leads FOR UPDATE USING (
  public.has_role('super_admin') OR public.has_role('hospital_admin')
);

CREATE POLICY subscriptions_select ON public.hospital_subscriptions FOR SELECT USING (
  public.has_role('super_admin')
  OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY subscriptions_manage ON public.hospital_subscriptions FOR ALL USING (
  public.has_role('super_admin')
  OR (
    public.has_role('hospital_admin')
    AND hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);

-- Seed demo hospital commercial fields if present
UPDATE public.hospitals
SET
  legal_name = COALESCE(legal_name, name),
  city = COALESCE(city, 'Mumbai'),
  bed_count = COALESCE(bed_count, 220),
  plan = COALESCE(NULLIF(plan, ''), 'professional'),
  onboarded_at = COALESCE(onboarded_at, now())
WHERE slug IS NOT NULL;
