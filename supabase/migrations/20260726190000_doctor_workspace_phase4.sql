-- Doctor Workspace Phase 4
-- Consultation sessions, clinical tasks, referrals, radiology orders,
-- and prescription/lab order extensions for fast enterprise consult workflow.
-- Worker-only PostgREST path (service_role).

-- ---------------------------------------------------------------------------
-- Active consultation session (queue ↔ encounter bridge)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.doctor_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  queue_entry_id UUID REFERENCES public.queue_entries(id) ON DELETE SET NULL,
  encounter_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  chief_complaint TEXT,
  room_label TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doctor_consultations_doctor_active
  ON public.doctor_consultations (hospital_id, doctor_staff_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_consultations_patient
  ON public.doctor_consultations (hospital_id, patient_id, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_consultations_active_queue
  ON public.doctor_consultations (hospital_id, queue_entry_id)
  WHERE queue_entry_id IS NOT NULL AND status = 'active';

-- ---------------------------------------------------------------------------
-- Clinical tasks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clinical_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.doctor_consultations(id) ON DELETE SET NULL,
  encounter_id UUID,
  title TEXT NOT NULL,
  detail TEXT,
  task_type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clinical_tasks_doctor_open
  ON public.clinical_tasks (hospital_id, doctor_staff_id, status, due_at)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clinical_tasks_patient
  ON public.clinical_tasks (hospital_id, patient_id, status)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Referrals (canonical)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clinical_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.doctor_consultations(id) ON DELETE SET NULL,
  encounter_id UUID,
  referred_by_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  to_specialty TEXT NOT NULL,
  to_doctor_name TEXT,
  to_facility TEXT,
  reason TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'routine',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clinical_referrals_patient
  ON public.clinical_referrals (hospital_id, patient_id, created_at DESC)
  WHERE archived_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_referrals_hospital_legacy
  ON public.clinical_referrals (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Radiology / imaging orders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.radiology_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.doctor_consultations(id) ON DELETE SET NULL,
  encounter_id UUID,
  ordered_by_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
  modality TEXT NOT NULL DEFAULT 'xray',
  study_name TEXT NOT NULL,
  study_code TEXT,
  body_site TEXT,
  priority TEXT NOT NULL DEFAULT 'routine',
  clinical_indication TEXT,
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_radiology_orders_patient
  ON public.radiology_orders (hospital_id, patient_id, ordered_at DESC)
  WHERE archived_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_radiology_orders_hospital_legacy
  ON public.radiology_orders (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Extend prescriptions for workspace safety
-- ---------------------------------------------------------------------------

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS allergy_checked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consultation_id UUID,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS quantity TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prescriptions_hospital_legacy
  ON public.prescriptions (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation
  ON public.prescriptions (hospital_id, consultation_id)
  WHERE consultation_id IS NOT NULL;

ALTER TABLE public.lab_orders
  ADD COLUMN IF NOT EXISTS consultation_id UUID,
  ADD COLUMN IF NOT EXISTS modality TEXT DEFAULT 'lab',
  ADD COLUMN IF NOT EXISTS clinical_indication TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_lab_orders_consultation
  ON public.lab_orders (hospital_id, consultation_id)
  WHERE consultation_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.doctor_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiology_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_consultations_select ON public.doctor_consultations;
CREATE POLICY doctor_consultations_select ON public.doctor_consultations
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS doctor_consultations_manage ON public.doctor_consultations;
CREATE POLICY doctor_consultations_manage ON public.doctor_consultations
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS clinical_tasks_select ON public.clinical_tasks;
CREATE POLICY clinical_tasks_select ON public.clinical_tasks
  FOR SELECT USING (
    (patient_id IS NOT NULL AND (
      public.is_patient_of(patient_id)
      OR public.has_patient_access_grant(patient_id, 'read')
    ))
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS clinical_tasks_manage ON public.clinical_tasks;
CREATE POLICY clinical_tasks_manage ON public.clinical_tasks
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS clinical_referrals_select ON public.clinical_referrals;
CREATE POLICY clinical_referrals_select ON public.clinical_referrals
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS clinical_referrals_manage ON public.clinical_referrals;
CREATE POLICY clinical_referrals_manage ON public.clinical_referrals
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS radiology_orders_select ON public.radiology_orders;
CREATE POLICY radiology_orders_select ON public.radiology_orders
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS radiology_orders_manage ON public.radiology_orders;
CREATE POLICY radiology_orders_manage ON public.radiology_orders
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  );

-- ---------------------------------------------------------------------------
-- PostgREST lockdown
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.doctor_consultations FROM anon, authenticated;
REVOKE ALL ON TABLE public.clinical_tasks FROM anon, authenticated;
REVOKE ALL ON TABLE public.clinical_referrals FROM anon, authenticated;
REVOKE ALL ON TABLE public.radiology_orders FROM anon, authenticated;

GRANT ALL ON TABLE public.doctor_consultations TO service_role;
GRANT ALL ON TABLE public.clinical_tasks TO service_role;
GRANT ALL ON TABLE public.clinical_referrals TO service_role;
GRANT ALL ON TABLE public.radiology_orders TO service_role;
