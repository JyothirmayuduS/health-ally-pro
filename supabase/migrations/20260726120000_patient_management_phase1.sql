-- Patient Management Phase 1
-- Additive hospital-scoped patient demographics, contacts, allergies, history,
-- consents, documents, QR tokens. Worker-only PostgREST path (service_role).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.staff_has_role_in_hospital(
  target_hospital UUID,
  allowed_roles public.user_role[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.hospital_memberships hm
      WHERE hm.profile_id = auth.uid()
        AND hm.hospital_id = target_hospital
        AND hm.is_active = true
        AND hm.role = ANY (allowed_roles)
    );
$$;

-- Hospital MRN sequence (per-hospital counter)
CREATE TABLE IF NOT EXISTS public.hospital_mrn_counters (
  hospital_id UUID PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
  next_value BIGINT NOT NULL DEFAULT 100001,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.next_hospital_mrn(p_hospital_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v BIGINT;
BEGIN
  INSERT INTO public.hospital_mrn_counters (hospital_id, next_value)
  VALUES (p_hospital_id, 100001)
  ON CONFLICT (hospital_id) DO NOTHING;

  UPDATE public.hospital_mrn_counters
  SET next_value = next_value + 1,
      updated_at = now()
  WHERE hospital_id = p_hospital_id
  RETURNING next_value - 1 INTO v;

  RETURN 'MRN-' || v::text;
END;
$$;

REVOKE ALL ON FUNCTION public.next_hospital_mrn(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_hospital_mrn(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Extend patients
-- ---------------------------------------------------------------------------

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS allergies_summary TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS search_name TEXT,
  ADD COLUMN IF NOT EXISTS search_phone TEXT,
  ADD COLUMN IF NOT EXISTS legacy_id TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

UPDATE public.patients p
SET
  full_name = COALESCE(p.full_name, pr.full_name),
  phone = COALESCE(p.phone, pr.phone),
  email = COALESCE(p.email, pr.email)
FROM public.profiles pr
WHERE p.profile_id = pr.id
  AND (p.full_name IS NULL OR p.phone IS NULL OR p.email IS NULL);

UPDATE public.patients
SET search_name = lower(regexp_replace(COALESCE(full_name, ''), '\s+', ' ', 'g'))
WHERE search_name IS NULL AND full_name IS NOT NULL;

UPDATE public.patients
SET search_phone = regexp_replace(COALESCE(phone, ''), '[^0-9+]', '', 'g')
WHERE search_phone IS NULL AND phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_hospital_search_name
  ON public.patients (hospital_id, search_name);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_search_phone
  ON public.patients (hospital_id, search_phone);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_status
  ON public.patients (hospital_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_hospital_legacy
  ON public.patients (hospital_id, legacy_id) WHERE legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_id_hospital
  ON public.patients (id, hospital_id);

-- Patient ownership without LIMIT 1 ambiguity (hospital-scoped).
CREATE OR REPLACE FUNCTION public.patient_ids_for_user(target_hospital UUID DEFAULT NULL)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.patients p
  WHERE p.profile_id = auth.uid()
    AND (target_hospital IS NULL OR p.hospital_id = target_hospital)
    AND COALESCE(p.status, 'active') <> 'merged';
$$;

CREATE OR REPLACE FUNCTION public.is_patient_of(target_patient UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = target_patient
      AND p.profile_id = auth.uid()
      AND COALESCE(p.status, 'active') <> 'merged'
  );
$$;

-- ---------------------------------------------------------------------------
-- Child tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.patient_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_patient_emergency_contacts_patient
  ON public.patient_emergency_contacts (hospital_id, patient_id);

CREATE TABLE IF NOT EXISTS public.patient_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  related_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  related_name TEXT,
  relation TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_patient_relationships_patient
  ON public.patient_relationships (hospital_id, patient_id);

CREATE TABLE IF NOT EXISTS public.patient_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  grantee_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'read',
  relationship_label TEXT,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (hospital_id, patient_id, grantee_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_patient_access_grants_grantee
  ON public.patient_access_grants (grantee_profile_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  substance TEXT NOT NULL,
  reaction TEXT,
  severity TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'active',
  onset_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient
  ON public.patient_allergies (hospital_id, patient_id)
  WHERE archived_at IS NULL AND status = 'active';

CREATE TABLE IF NOT EXISTS public.patient_history_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  occurred_on DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_patient_history_patient
  ON public.patient_history_entries (hospital_id, patient_id, category);

CREATE TABLE IF NOT EXISTS public.consent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, code, version)
);

CREATE TABLE IF NOT EXISTS public.patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.consent_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signature_method TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient
  ON public.patient_consents (hospital_id, patient_id, status);

CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient
  ON public.patient_documents (hospital_id, patient_id)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS public.patient_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_patient_qr_tokens_patient
  ON public.patient_qr_tokens (hospital_id, patient_id, status);

-- Composite tenant integrity: child hospital_id must match its patient/template.
ALTER TABLE public.patient_emergency_contacts
  ADD CONSTRAINT patient_emergency_contacts_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE;
ALTER TABLE public.patient_relationships
  ADD CONSTRAINT patient_relationships_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE,
  ADD CONSTRAINT patient_relationships_related_patient_hospital_fkey
  FOREIGN KEY (related_patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id);
ALTER TABLE public.patient_access_grants
  ADD CONSTRAINT patient_access_grants_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE;
ALTER TABLE public.patient_allergies
  ADD CONSTRAINT patient_allergies_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE;
ALTER TABLE public.patient_history_entries
  ADD CONSTRAINT patient_history_entries_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_templates_id_hospital
  ON public.consent_templates (id, hospital_id);
ALTER TABLE public.patient_consents
  ADD CONSTRAINT patient_consents_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE,
  ADD CONSTRAINT patient_consents_template_hospital_fkey
  FOREIGN KEY (template_id, hospital_id)
  REFERENCES public.consent_templates (id, hospital_id);
ALTER TABLE public.patient_documents
  ADD CONSTRAINT patient_documents_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE;
ALTER TABLE public.patient_qr_tokens
  ADD CONSTRAINT patient_qr_tokens_patient_hospital_fkey
  FOREIGN KEY (patient_id, hospital_id)
  REFERENCES public.patients (id, hospital_id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.has_patient_access_grant(
  target_patient UUID,
  needed_scope TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_access_grants g
    WHERE g.patient_id = target_patient
      AND g.grantee_profile_id = auth.uid()
      AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
      AND (
        needed_scope = 'read'
        OR g.scope = 'full'
        OR g.scope = needed_scope
      )
  );
$$;

-- Helpers are internal to Worker/RLS paths; never expose them as PostgREST RPCs.
REVOKE ALL ON FUNCTION public.staff_has_role_in_hospital(UUID, public.user_role[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.patient_ids_for_user(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_patient_of(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_patient_access_grant(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_has_role_in_hospital(UUID, public.user_role[])
  TO service_role;
GRANT EXECUTE ON FUNCTION public.patient_ids_for_user(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.is_patient_of(UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.has_patient_access_grant(UUID, TEXT)
  TO service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.patient_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_history_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_mrn_counters ENABLE ROW LEVEL SECURITY;

-- Emergency contacts
DROP POLICY IF EXISTS patient_emergency_contacts_select ON public.patient_emergency_contacts;
CREATE POLICY patient_emergency_contacts_select ON public.patient_emergency_contacts
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_emergency_contacts_manage ON public.patient_emergency_contacts;
CREATE POLICY patient_emergency_contacts_manage ON public.patient_emergency_contacts
  FOR ALL USING (
    public.is_patient_of(patient_id)
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.is_patient_of(patient_id)
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  );

-- Relationships
DROP POLICY IF EXISTS patient_relationships_select ON public.patient_relationships;
CREATE POLICY patient_relationships_select ON public.patient_relationships
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_relationships_manage ON public.patient_relationships;
CREATE POLICY patient_relationships_manage ON public.patient_relationships
  FOR ALL USING (
    public.is_patient_of(patient_id)
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.is_patient_of(patient_id)
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  );

-- Access grants
DROP POLICY IF EXISTS patient_access_grants_select ON public.patient_access_grants;
CREATE POLICY patient_access_grants_select ON public.patient_access_grants
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR grantee_profile_id = auth.uid()
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  );
DROP POLICY IF EXISTS patient_access_grants_manage ON public.patient_access_grants;
CREATE POLICY patient_access_grants_manage ON public.patient_access_grants
  FOR ALL USING (
    public.is_patient_of(patient_id)
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  )
  WITH CHECK (
    public.is_patient_of(patient_id)
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  );

-- Allergies
DROP POLICY IF EXISTS patient_allergies_select ON public.patient_allergies;
CREATE POLICY patient_allergies_select ON public.patient_allergies
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_allergies_manage ON public.patient_allergies;
CREATE POLICY patient_allergies_manage ON public.patient_allergies
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse','receptionist']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','nurse','receptionist']::public.user_role[]
    )
  );

-- History
DROP POLICY IF EXISTS patient_history_select ON public.patient_history_entries;
CREATE POLICY patient_history_select ON public.patient_history_entries
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'read')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_history_manage ON public.patient_history_entries;
CREATE POLICY patient_history_manage ON public.patient_history_entries
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

-- Consent templates
DROP POLICY IF EXISTS consent_templates_select ON public.consent_templates;
CREATE POLICY consent_templates_select ON public.consent_templates
  FOR SELECT USING (public.staff_in_hospital(hospital_id));
DROP POLICY IF EXISTS consent_templates_manage ON public.consent_templates;
CREATE POLICY consent_templates_manage ON public.consent_templates
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  );

-- Patient consents
DROP POLICY IF EXISTS patient_consents_select ON public.patient_consents;
CREATE POLICY patient_consents_select ON public.patient_consents
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'consent')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_consents_manage ON public.patient_consents;
CREATE POLICY patient_consents_manage ON public.patient_consents
  FOR ALL USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'consent')
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'consent')
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  );

-- Documents
DROP POLICY IF EXISTS patient_documents_select ON public.patient_documents;
CREATE POLICY patient_documents_select ON public.patient_documents
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'documents')
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_documents_manage ON public.patient_documents;
CREATE POLICY patient_documents_manage ON public.patient_documents
  FOR ALL USING (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'documents')
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  )
  WITH CHECK (
    public.is_patient_of(patient_id)
    OR public.has_patient_access_grant(patient_id, 'documents')
    OR public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist','doctor','nurse']::public.user_role[]
    )
  );

-- QR tokens — staff resolve only; never expose hash via patient SELECT of others
DROP POLICY IF EXISTS patient_qr_tokens_select ON public.patient_qr_tokens;
CREATE POLICY patient_qr_tokens_select ON public.patient_qr_tokens
  FOR SELECT USING (
    public.is_patient_of(patient_id)
    OR public.staff_in_hospital(hospital_id)
  );
DROP POLICY IF EXISTS patient_qr_tokens_manage ON public.patient_qr_tokens;
CREATE POLICY patient_qr_tokens_manage ON public.patient_qr_tokens
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','receptionist']::public.user_role[]
    )
  );

DROP POLICY IF EXISTS hospital_mrn_counters_deny ON public.hospital_mrn_counters;
CREATE POLICY hospital_mrn_counters_deny ON public.hospital_mrn_counters
  FOR ALL USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- PostgREST lockdown — Worker service_role only
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.patient_emergency_contacts FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_relationships FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_access_grants FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_allergies FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_history_entries FROM anon, authenticated;
REVOKE ALL ON TABLE public.consent_templates FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_consents FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_documents FROM anon, authenticated;
REVOKE ALL ON TABLE public.patient_qr_tokens FROM anon, authenticated;
REVOKE ALL ON TABLE public.hospital_mrn_counters FROM anon, authenticated;

GRANT ALL ON TABLE public.patient_emergency_contacts TO service_role;
GRANT ALL ON TABLE public.patient_relationships TO service_role;
GRANT ALL ON TABLE public.patient_access_grants TO service_role;
GRANT ALL ON TABLE public.patient_allergies TO service_role;
GRANT ALL ON TABLE public.patient_history_entries TO service_role;
GRANT ALL ON TABLE public.consent_templates TO service_role;
GRANT ALL ON TABLE public.patient_consents TO service_role;
GRANT ALL ON TABLE public.patient_documents TO service_role;
GRANT ALL ON TABLE public.patient_qr_tokens TO service_role;
GRANT ALL ON TABLE public.hospital_mrn_counters TO service_role;

-- ---------------------------------------------------------------------------
-- Private storage bucket for patient documents
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-documents',
  'patient-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No allow policies for authenticated/anon on patient-documents.
-- Default-deny + private bucket; Worker uses service_role signed URLs only.

-- ---------------------------------------------------------------------------
-- Seed consent templates for Oak Haven demo hospital
-- ---------------------------------------------------------------------------

INSERT INTO public.consent_templates (hospital_id, code, title, body, version, is_active)
SELECT
  h.id,
  v.code,
  v.title,
  v.body,
  1,
  true
FROM public.hospitals h
CROSS JOIN (
  VALUES
    (
      'general_treatment',
      'General treatment consent',
      'I consent to examination and treatment by Medora clinicians at this hospital, including sharing clinical information with the care team for continuity of care.'
    ),
    (
      'privacy_notice',
      'Privacy & data processing notice',
      'I acknowledge that my health information will be processed under hospital privacy policy, with access limited by role and audited.'
    ),
    (
      'procedure',
      'Procedure consent',
      'I consent to the planned procedure after discussion of risks, benefits, and alternatives. I may withdraw consent before the procedure begins.'
    )
) AS v(code, title, body)
WHERE h.slug = 'oak-haven' OR h.id = 'a0000001-0001-4001-8001-000000000001'
ON CONFLICT (hospital_id, code, version) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed demo clinical alerts / contacts / history metadata (no real files/PHI dumps)
-- ---------------------------------------------------------------------------

INSERT INTO public.patient_emergency_contacts (
  hospital_id, patient_id, full_name, phone, relation, is_primary
)
SELECT p.hospital_id, p.id, 'Demo Emergency Contact', '+910000000000', 'Family', true
FROM public.patients p
JOIN public.hospitals h ON h.id = p.hospital_id
WHERE (h.slug = 'oak-haven' OR h.id = 'a0000001-0001-4001-8001-000000000001')
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_emergency_contacts c
    WHERE c.patient_id = p.id AND c.archived_at IS NULL
  )
LIMIT 5;

INSERT INTO public.patient_allergies (
  hospital_id, patient_id, substance, reaction, severity, status
)
SELECT p.hospital_id, p.id, 'Penicillin', 'Rash', 'moderate', 'active'
FROM public.patients p
JOIN public.hospitals h ON h.id = p.hospital_id
WHERE (h.slug = 'oak-haven' OR h.id = 'a0000001-0001-4001-8001-000000000001')
  AND COALESCE(p.allergies_summary, '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_allergies a
    WHERE a.patient_id = p.id AND a.archived_at IS NULL
  )
LIMIT 5;

INSERT INTO public.patient_history_entries (
  hospital_id, patient_id, category, title, detail
)
SELECT p.hospital_id, p.id, 'medical', 'Prior visit summary', 'Seeded history entry for Phase 1 demo — replace in production.'
FROM public.patients p
JOIN public.hospitals h ON h.id = p.hospital_id
WHERE (h.slug = 'oak-haven' OR h.id = 'a0000001-0001-4001-8001-000000000001')
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_history_entries e
    WHERE e.patient_id = p.id AND e.archived_at IS NULL
  )
LIMIT 5;

-- Document metadata only (no object bytes). Paths are placeholders for Worker signed URL flow.
INSERT INTO public.patient_documents (
  hospital_id, patient_id, title, category, mime_type, byte_size, storage_path, status
)
SELECT
  p.hospital_id,
  p.id,
  'Insurance card (metadata seed)',
  'insurance',
  'application/pdf',
  0,
  p.hospital_id::text || '/' || p.id::text || '/seed/insurance-placeholder.pdf',
  'active'
FROM public.patients p
JOIN public.hospitals h ON h.id = p.hospital_id
WHERE (h.slug = 'oak-haven' OR h.id = 'a0000001-0001-4001-8001-000000000001')
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_documents d
    WHERE d.patient_id = p.id AND d.archived_at IS NULL
  )
LIMIT 3;
