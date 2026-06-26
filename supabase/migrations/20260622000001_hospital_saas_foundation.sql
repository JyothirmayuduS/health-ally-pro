-- Medora Hospital SaaS Foundation Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'hospital_admin',
  'doctor',
  'nurse',
  'receptionist',
  'lab_technician',
  'lab_supervisor',
  'pharmacist',
  'billing_staff',
  'patient',
  'caregiver'
);

CREATE TYPE public.appointment_status AS ENUM (
  'upcoming',
  'in_queue',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE public.queue_status AS ENUM (
  'waiting',
  'called',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE public.lab_order_status AS ENUM (
  'ordered',
  'collected',
  'processing',
  'validated',
  'cancelled'
);

CREATE TYPE public.report_type AS ENUM (
  'Lab',
  'Imaging',
  'Prescription',
  'Summary'
);

CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'issued',
  'partial',
  'paid',
  'void'
);

CREATE TYPE public.payment_method AS ENUM (
  'cash',
  'card',
  'upi',
  'insurance',
  'other'
);

-- Core tenant tables
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, code)
);

CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role assignments per hospital (authorization in app_metadata + this table)
CREATE TABLE public.hospital_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  role public.user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, hospital_id, role)
);

CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID UNIQUE REFERENCES public.hospital_memberships(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  employee_id TEXT,
  specialty TEXT,
  initials TEXT,
  bio TEXT,
  rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  consultation_fee NUMERIC(10, 2) DEFAULT 0,
  next_available_slot TEXT,
  legacy_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  mrn TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  member_since TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, mrn)
);

-- Clinical & operations
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  time_label TEXT,
  reason TEXT,
  status public.appointment_status NOT NULL DEFAULT 'upcoming',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  token_number INTEGER,
  position INTEGER,
  estimated_wait_minutes INTEGER,
  status public.queue_status NOT NULL DEFAULT 'waiting',
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  chief_complaint TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  ordered_by_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  test_code TEXT,
  status public.lab_order_status NOT NULL DEFAULT 'ordered',
  priority TEXT DEFAULT 'routine',
  notes TEXT,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  lab_order_id UUID REFERENCES public.lab_orders(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type public.report_type NOT NULL DEFAULT 'Lab',
  result_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_size TEXT,
  doctor_name TEXT,
  notes TEXT,
  shared_with_staff_ids UUID[] DEFAULT '{}',
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  prescribed_by_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  is_dispensed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL,
  invoice_number TEXT,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'cash',
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_branches_hospital ON public.branches(hospital_id);
CREATE INDEX idx_departments_branch ON public.departments(branch_id);
CREATE INDEX idx_memberships_profile ON public.hospital_memberships(profile_id);
CREATE INDEX idx_memberships_hospital ON public.hospital_memberships(hospital_id);
CREATE INDEX idx_staff_department ON public.staff_profiles(department_id);
CREATE INDEX idx_patients_profile ON public.patients(profile_id);
CREATE INDEX idx_patients_hospital ON public.patients(hospital_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_staff_id);
CREATE INDEX idx_queue_patient ON public.queue_entries(patient_id);
CREATE INDEX idx_lab_results_patient ON public.lab_results(patient_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hospitals_updated BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON public.hospital_memberships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_queue_updated BEFORE UPDATE ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_encounters_updated BEFORE UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lab_orders_updated BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lab_results_updated BEFORE UPDATE ON public.lab_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_prescriptions_updated BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS helper functions (private schema pattern via security definer)
CREATE OR REPLACE FUNCTION public.get_user_hospital_ids()
RETURNS SETOF UUID AS $$
  SELECT hospital_id FROM public.hospital_memberships
  WHERE profile_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(check_role public.user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_memberships
    WHERE profile_id = auth.uid() AND role = check_role AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_any_role(roles public.user_role[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_memberships
    WHERE profile_id = auth.uid() AND role = ANY(roles) AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_memberships
    WHERE profile_id = auth.uid()
      AND role IN (
        'super_admin', 'hospital_admin', 'doctor', 'nurse', 'receptionist',
        'lab_technician', 'lab_supervisor', 'pharmacist', 'billing_staff'
      )
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_patient_id()
RETURNS UUID AS $$
  SELECT id FROM public.patients WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: own profile + staff can read hospital members
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Hospitals: staff of hospital or super_admin
CREATE POLICY hospitals_select ON public.hospitals FOR SELECT USING (
  public.has_role('super_admin') OR id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY hospitals_manage ON public.hospitals FOR ALL USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
);

-- Branches & departments
CREATE POLICY branches_select ON public.branches FOR SELECT USING (
  public.has_role('super_admin') OR hospital_id IN (SELECT public.get_user_hospital_ids())
);
CREATE POLICY branches_manage ON public.branches FOR ALL USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
  AND hospital_id IN (SELECT public.get_user_hospital_ids())
);

CREATE POLICY departments_select ON public.departments FOR SELECT USING (
  public.has_role('super_admin') OR branch_id IN (
    SELECT b.id FROM public.branches b WHERE b.hospital_id IN (SELECT public.get_user_hospital_ids())
  )
);
CREATE POLICY departments_manage ON public.departments FOR ALL USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
);

-- Memberships
CREATE POLICY memberships_select ON public.hospital_memberships FOR SELECT USING (
  profile_id = auth.uid()
  OR public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
);
CREATE POLICY memberships_manage ON public.hospital_memberships FOR ALL USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
);

-- Staff profiles: public read for doctors (patient booking), staff manage
CREATE POLICY staff_select ON public.staff_profiles FOR SELECT USING (true);
CREATE POLICY staff_manage ON public.staff_profiles FOR ALL USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
);

-- Patients
CREATE POLICY patients_select ON public.patients FOR SELECT USING (
  profile_id = auth.uid()
  OR public.is_staff()
);
CREATE POLICY patients_insert ON public.patients FOR INSERT WITH CHECK (
  public.has_any_role(ARRAY['receptionist', 'hospital_admin', 'super_admin']::public.user_role[])
  OR profile_id = auth.uid()
);
CREATE POLICY patients_update ON public.patients FOR UPDATE USING (
  profile_id = auth.uid() OR public.is_staff()
);

-- Appointments
CREATE POLICY appointments_select ON public.appointments FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);
CREATE POLICY appointments_insert ON public.appointments FOR INSERT WITH CHECK (
  patient_id = public.get_patient_id() OR public.has_any_role(ARRAY['receptionist', 'doctor', 'hospital_admin']::public.user_role[])
);
CREATE POLICY appointments_update ON public.appointments FOR UPDATE USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);

-- Queue
CREATE POLICY queue_select ON public.queue_entries FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);
CREATE POLICY queue_manage ON public.queue_entries FOR ALL USING (public.is_staff());

-- Encounters
CREATE POLICY encounters_select ON public.encounters FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);
CREATE POLICY encounters_manage ON public.encounters FOR ALL USING (
  public.has_any_role(ARRAY['doctor', 'nurse', 'hospital_admin', 'super_admin']::public.user_role[])
);

-- Lab orders & results
CREATE POLICY lab_orders_select ON public.lab_orders FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin', 'super_admin']::public.user_role[])
);
CREATE POLICY lab_orders_manage ON public.lab_orders FOR ALL USING (
  public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin']::public.user_role[])
);

CREATE POLICY lab_results_select ON public.lab_results FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);
CREATE POLICY lab_results_manage ON public.lab_results FOR ALL USING (
  public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin']::public.user_role[])
);

-- Prescriptions
CREATE POLICY prescriptions_select ON public.prescriptions FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);
CREATE POLICY prescriptions_manage ON public.prescriptions FOR ALL USING (
  public.has_any_role(ARRAY['doctor', 'pharmacist', 'hospital_admin']::public.user_role[])
);

-- Billing
CREATE POLICY invoices_select ON public.invoices FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'receptionist']::public.user_role[])
);
CREATE POLICY invoices_manage ON public.invoices FOR ALL USING (
  public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
);

CREATE POLICY invoice_items_select ON public.invoice_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM public.invoices WHERE patient_id = public.get_patient_id())
  OR public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
);
CREATE POLICY invoice_items_manage ON public.invoice_items FOR ALL USING (
  public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
);

CREATE POLICY payments_select ON public.payments FOR SELECT USING (
  public.has_any_role(ARRAY['billing_staff', 'hospital_admin', 'patient']::public.user_role[])
  OR invoice_id IN (SELECT id FROM public.invoices WHERE patient_id = public.get_patient_id())
);
CREATE POLICY payments_manage ON public.payments FOR ALL USING (
  public.has_any_role(ARRAY['billing_staff', 'hospital_admin']::public.user_role[])
);

-- Audit & notifications
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (
  public.has_any_role(ARRAY['super_admin', 'hospital_admin']::public.user_role[])
);
CREATE POLICY audit_insert ON public.audit_logs FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (public.is_staff() OR profile_id = auth.uid());
