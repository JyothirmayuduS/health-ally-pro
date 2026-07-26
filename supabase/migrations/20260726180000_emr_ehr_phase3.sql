-- EMR/EHR Phase 3
-- Canonical clinical chart: diagnoses (ICD-10), procedures, structured vitals,
-- immunizations, clinical attachments, immutable SOAP note versions, and
-- record-level clinical audit. Worker-only PostgREST path (service_role).

-- ---------------------------------------------------------------------------
-- Extend encounters for signed note metadata
-- ---------------------------------------------------------------------------

ALTER TABLE public.encounters
  ADD COLUMN IF NOT EXISTS soap_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS soap_signed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS soap_version INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS note_status TEXT NOT NULL DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_encounters_hospital_patient_started
  ON public.encounters (hospital_id, patient_id, started_at DESC);

-- Composite tenant integrity for encounter children
CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_id_hospital
  ON public.encounters (id, hospital_id);

-- ---------------------------------------------------------------------------
-- Immutable SOAP / clinical note version history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clinical_note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  note_status TEXT NOT NULL DEFAULT 'draft',
  chief_complaint TEXT,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  notes TEXT,
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  authored_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (encounter_id, version_number),
  FOREIGN KEY (encounter_id, hospital_id)
    REFERENCES public.encounters (id, hospital_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clinical_note_versions_patient
  ON public.clinical_note_versions (hospital_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_note_versions_encounter
  ON public.clinical_note_versions (hospital_id, encounter_id, version_number DESC);

-- Prevent mutation of clinical note history (immutable)
CREATE OR REPLACE FUNCTION public.forbid_clinical_note_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'clinical_note_versions is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_note_versions_no_update ON public.clinical_note_versions;
CREATE TRIGGER trg_clinical_note_versions_no_update
  BEFORE UPDATE ON public.clinical_note_versions
  FOR EACH ROW EXECUTE FUNCTION public.forbid_clinical_note_version_mutation();

DROP TRIGGER IF EXISTS trg_clinical_note_versions_no_delete ON public.clinical_note_versions;
CREATE TRIGGER trg_clinical_note_versions_no_delete
  BEFORE DELETE ON public.clinical_note_versions
  FOR EACH ROW EXECUTE FUNCTION public.forbid_clinical_note_version_mutation();

-- ---------------------------------------------------------------------------
-- Diagnoses / ICD-10 problem list
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.patient_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID,
  icd10_code TEXT NOT NULL,
  icd10_display TEXT NOT NULL,
  clinical_status TEXT NOT NULL DEFAULT 'active',
  verification_status TEXT NOT NULL DEFAULT 'confirmed',
  onset_date DATE,
  resolved_date DATE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient
  ON public.patient_diagnoses (hospital_id, patient_id)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_icd
  ON public.patient_diagnoses (hospital_id, icd10_code);

-- ---------------------------------------------------------------------------
-- Procedures
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.patient_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID,
  code TEXT,
  display TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  performed_at TIMESTAMPTZ,
  performer_name TEXT,
  body_site TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patient_procedures_patient
  ON public.patient_procedures (hospital_id, patient_id)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Structured vitals (extend existing payload table)
-- ---------------------------------------------------------------------------

ALTER TABLE public.vitals_readings
  ADD COLUMN IF NOT EXISTS encounter_id UUID,
  ADD COLUMN IF NOT EXISTS bp_systolic INTEGER,
  ADD COLUMN IF NOT EXISTS bp_diastolic INTEGER,
  ADD COLUMN IF NOT EXISTS heart_rate INTEGER,
  ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER,
  ADD COLUMN IF NOT EXISTS temperature_c NUMERIC(4, 1),
  ADD COLUMN IF NOT EXISTS spo2 INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6, 1),
  ADD COLUMN IF NOT EXISTS bmi NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS pain_score INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vitals_readings_patient_recorded
  ON public.vitals_readings (hospital_id, patient_id, recorded_at DESC)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Immunizations (Postgres canonical)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.patient_immunizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID,
  vaccine_code TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  dose_number INTEGER,
  status TEXT NOT NULL DEFAULT 'completed',
  administered_at TIMESTAMPTZ,
  lot_number TEXT,
  site TEXT,
  route TEXT,
  manufacturer TEXT,
  aefi_notes TEXT,
  deferral_reason TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_immunizations_hospital_legacy
  ON public.patient_immunizations (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patient_immunizations_patient
  ON public.patient_immunizations (hospital_id, patient_id, administered_at DESC)
  WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- Clinical attachments (encounter/note linked; private storage)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clinical_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  encounter_id UUID,
  note_version_id UUID REFERENCES public.clinical_note_versions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'clinical',
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clinical_attachments_patient
  ON public.clinical_attachments (hospital_id, patient_id)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clinical_attachments_encounter
  ON public.clinical_attachments (hospital_id, encounter_id)
  WHERE encounter_id IS NOT NULL AND archived_at IS NULL;

-- Ensure private clinical-attachments bucket (reuse patient-documents if already present)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-attachments',
  'clinical-attachments',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/dicom'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS clinical_attachments_storage_deny_anon ON storage.objects;
CREATE POLICY clinical_attachments_storage_deny_anon ON storage.objects
  AS RESTRICTIVE FOR ALL TO anon
  USING (bucket_id <> 'clinical-attachments')
  WITH CHECK (bucket_id <> 'clinical-attachments');

DROP POLICY IF EXISTS clinical_attachments_storage_deny_auth ON storage.objects;
CREATE POLICY clinical_attachments_storage_deny_auth ON storage.objects
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'clinical-attachments')
  WITH CHECK (bucket_id <> 'clinical-attachments');

-- ---------------------------------------------------------------------------
-- Record-level clinical audit (immutable append-only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.emr_record_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (patient_id, hospital_id)
    REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emr_record_audit_patient
  ON public.emr_record_audit (hospital_id, patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emr_record_audit_resource
  ON public.emr_record_audit (hospital_id, resource_type, resource_id);

CREATE OR REPLACE FUNCTION public.forbid_emr_record_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'emr_record_audit is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_emr_record_audit_no_update ON public.emr_record_audit;
CREATE TRIGGER trg_emr_record_audit_no_update
  BEFORE UPDATE ON public.emr_record_audit
  FOR EACH ROW EXECUTE FUNCTION public.forbid_emr_record_audit_mutation();

DROP TRIGGER IF EXISTS trg_emr_record_audit_no_delete ON public.emr_record_audit;
CREATE TRIGGER trg_emr_record_audit_no_delete
  BEFORE DELETE ON public.emr_record_audit
  FOR EACH ROW EXECUTE FUNCTION public.forbid_emr_record_audit_mutation();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.clinical_note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emr_record_audit ENABLE ROW LEVEL SECURITY;

-- Note versions: staff + patient read; only clinical staff insert; no update/delete via policies
DROP POLICY IF EXISTS clinical_note_versions_select ON public.clinical_note_versions;
CREATE POLICY clinical_note_versions_select ON public.clinical_note_versions
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS clinical_note_versions_insert ON public.clinical_note_versions;
CREATE POLICY clinical_note_versions_insert ON public.clinical_note_versions
  FOR INSERT WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS patient_diagnoses_select ON public.patient_diagnoses;
CREATE POLICY patient_diagnoses_select ON public.patient_diagnoses
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_diagnoses_manage ON public.patient_diagnoses;
CREATE POLICY patient_diagnoses_manage ON public.patient_diagnoses
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

DROP POLICY IF EXISTS patient_procedures_select ON public.patient_procedures;
CREATE POLICY patient_procedures_select ON public.patient_procedures
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_procedures_manage ON public.patient_procedures;
CREATE POLICY patient_procedures_manage ON public.patient_procedures
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

DROP POLICY IF EXISTS patient_immunizations_select ON public.patient_immunizations;
CREATE POLICY patient_immunizations_select ON public.patient_immunizations
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_immunizations_manage ON public.patient_immunizations;
CREATE POLICY patient_immunizations_manage ON public.patient_immunizations
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

DROP POLICY IF EXISTS clinical_attachments_select ON public.clinical_attachments;
CREATE POLICY clinical_attachments_select ON public.clinical_attachments
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS clinical_attachments_manage ON public.clinical_attachments;
CREATE POLICY clinical_attachments_manage ON public.clinical_attachments
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse','receptionist']::public.user_role[]
    )
    OR public.is_patient_of(patient_id)
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse','receptionist']::public.user_role[]
    )
    OR public.is_patient_of(patient_id)
  );

DROP POLICY IF EXISTS emr_record_audit_select ON public.emr_record_audit;
CREATE POLICY emr_record_audit_select ON public.emr_record_audit
  FOR SELECT USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor']::public.user_role[]
    )
  );
DROP POLICY IF EXISTS emr_record_audit_insert ON public.emr_record_audit;
CREATE POLICY emr_record_audit_insert ON public.emr_record_audit
  FOR INSERT WITH CHECK (
    public.staff_in_hospital(hospital_id)
  );

-- ---------------------------------------------------------------------------
-- PostgREST lockdown — Worker service_role only
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.clinical_note_versions FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_diagnoses FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_procedures FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_immunizations FROM anon, authenticated;
REVOKE ALL ON TABLE public.clinical_attachments FROM anon, authenticated;
REVOKE ALL ON TABLE public.emr_record_audit FROM anon, authenticated;

GRANT ALL ON TABLE public.clinical_note_versions TO service_role;
GRANT ALL ON TABLE public.patient_diagnoses TO service_role;
GRANT ALL ON TABLE public.patient_procedures TO service_role;
GRANT ALL ON TABLE public.patient_immunizations TO service_role;
GRANT ALL ON TABLE public.clinical_attachments TO service_role;
GRANT ALL ON TABLE public.emr_record_audit TO service_role;
