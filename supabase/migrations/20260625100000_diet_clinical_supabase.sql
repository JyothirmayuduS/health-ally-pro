-- Diet meal media cache (survives server restarts) + clinical data for personalization

CREATE TYPE public.lab_analyte_status AS ENUM (
  'Normal', 'Borderline', 'Optimal', 'High', 'Low'
);

-- Line-item lab values linked to lab_results reports
CREATE TABLE public.lab_result_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_result_id UUID NOT NULL REFERENCES public.lab_results(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  status public.lab_analyte_status NOT NULL DEFAULT 'Normal',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_result_items_report ON public.lab_result_items(lab_result_id);

-- Active patient medications (diet / adherence personalization)
CREATE TABLE public.patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  medication_time TEXT,
  frequency TEXT,
  reason TEXT,
  clinical_reason TEXT,
  instruction_tag TEXT,
  best_way_to_take TEXT,
  side_effects JSONB NOT NULL DEFAULT '[]',
  interactions JSONB NOT NULL DEFAULT '[]',
  alternatives JSONB NOT NULL DEFAULT '[]',
  pills_remaining INTEGER,
  total_pills INTEGER,
  prescribed_by TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past')),
  legacy_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_medications_patient ON public.patient_medications(patient_id);
CREATE UNIQUE INDEX idx_patient_medications_legacy ON public.patient_medications(patient_id, legacy_id)
  WHERE legacy_id IS NOT NULL;

-- Resolved meal images + videos (keyed by meal fingerprint, not patient-specific)
CREATE TABLE public.diet_meal_media_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('bundle', 'videos', 'image')),
  language TEXT,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cache_key, cache_type, language)
);

CREATE INDEX idx_diet_media_cache_lookup ON public.diet_meal_media_cache(cache_key, cache_type, language);
CREATE INDEX idx_diet_media_cache_expires ON public.diet_meal_media_cache(expires_at);

CREATE TRIGGER trg_patient_medications_updated
  BEFORE UPDATE ON public.patient_medications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_diet_meal_media_cache_updated
  BEFORE UPDATE ON public.diet_meal_media_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lab_result_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meal_media_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY lab_result_items_select ON public.lab_result_items FOR SELECT USING (
  lab_result_id IN (SELECT id FROM public.lab_results WHERE patient_id = public.get_patient_id())
  OR public.is_staff()
);

CREATE POLICY lab_result_items_manage ON public.lab_result_items FOR ALL USING (
  public.has_any_role(ARRAY['lab_technician', 'lab_supervisor', 'doctor', 'hospital_admin', 'super_admin']::public.user_role[])
);

CREATE POLICY patient_medications_select ON public.patient_medications FOR SELECT USING (
  patient_id = public.get_patient_id() OR public.is_staff()
);

CREATE POLICY patient_medications_manage ON public.patient_medications FOR ALL USING (
  public.has_any_role(ARRAY['doctor', 'hospital_admin', 'receptionist', 'nurse', 'super_admin']::public.user_role[])
);

-- Global read for cached public recipe media; writes via service role only
CREATE POLICY diet_media_cache_select ON public.diet_meal_media_cache FOR SELECT USING (true);

-- Demo patient medications (Clara Whitfield)
INSERT INTO public.patient_medications (
  id, patient_id, hospital_id, name, dosage, medication_time, frequency,
  reason, clinical_reason, instruction_tag, best_way_to_take,
  side_effects, interactions, alternatives, pills_remaining, total_pills,
  prescribed_by, status, legacy_id
) VALUES
  (
    'd0000001-0001-4001-8001-000000000001',
    'c0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'Levothyroxine', '50mcg', '8:00 AM', 'Daily',
    'Empty stomach', 'Hypothyroidism management', 'Empty stomach',
    'Take on a strictly empty stomach, at least 30 to 60 minutes before breakfast.',
    '["Palpitations (if dose exceeds need)", "Heat sensitivity"]',
    '["Calcium, Iron, and Magnesium supplements", "Coffee (reduces absorption by 20%)"]',
    '["Liothyronine (T3)", "Desiccated Thyroid Extract (DTE)"]',
    4, 30, 'Dr. Lucien Park', 'active', 'm1'
  ),
  (
    'd0000001-0001-4001-8001-000000000002',
    'c0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'Vitamin D3 (Cholecalciferol)', '2000 IU', '8:00 AM', 'Daily',
    'With food', 'Vitamin D deficiency', 'With food',
    'Take alongside a meal containing healthy fats for best absorption.',
    '["Nausea at excessive doses"]',
    '["Thiazide diuretics", "Steroids (prednisone)"]',
    '["Increased sunlight exposure", "Fatty fish (Salmon)"]',
    45, 60, 'Dr. Saanvi Reddy', 'active', 'm2'
  ),
  (
    'd0000001-0001-4001-8001-000000000003',
    'c0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'Magnesium Glycinate', '200mg', '9:00 PM', 'Daily',
    'Before bed', 'Sleep & muscle recovery', 'Before bed',
    'Take 1 to 2 hours before bedtime. Gentle on the stomach.',
    '["Mild GI upset (rare with glycinate)"]',
    '["Antibiotics", "Bisphosphonates"]',
    '["Magnesium Citrate", "Magnesium L-Threonate"]',
    18, 30, 'Dr. Saanvi Reddy', 'active', 'm3'
  ),
  (
    'd0000001-0001-4001-8001-000000000004',
    'c0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'Metformin ER', '500mg', 'Dinner', 'Daily',
    'Insulin resistance management', 'Insulin resistance management', NULL,
    NULL, '[]', '[]', '[]', NULL, NULL, 'Dr. Eleanor Thorne', 'past', 'm4'
  ),
  (
    'd0000001-0001-4001-8001-000000000005',
    'c0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'Selenium (Selenomethionine)', '200mcg', 'Morning', 'Daily',
    'Antibody reduction (TPO)', 'Antibody reduction (TPO) and cellular antioxidant defense.', NULL,
    NULL, '[]', '[]', '[]', NULL, NULL, 'Dr. Saanvi Reddy', 'past', 'm5'
  )
ON CONFLICT DO NOTHING;

-- Demo lab line items (legacy report ids r1, r3, r5)
INSERT INTO public.lab_result_items (lab_result_id, name, value, status, sort_order) VALUES
  ('a0000001-0001-4001-8001-000000000101', 'Glucose', '92 mg/dL', 'Normal', 1),
  ('a0000001-0001-4001-8001-000000000101', 'HbA1c', '5.4 %', 'Normal', 2),
  ('a0000001-0001-4001-8001-000000000101', 'Cholesterol', '186 mg/dL', 'Normal', 3),
  ('a0000001-0001-4001-8001-000000000101', 'LDL', '118 mg/dL', 'Borderline', 4),
  ('a0000001-0001-4001-8001-000000000101', 'HDL', '61 mg/dL', 'Optimal', 5),
  ('a0000001-0001-4001-8001-000000000103', 'Total cholesterol', '186 mg/dL', 'Normal', 1),
  ('a0000001-0001-4001-8001-000000000103', 'Triglycerides', '98 mg/dL', 'Normal', 2),
  ('a0000001-0001-4001-8001-000000000103', 'LDL', '118 mg/dL', 'Borderline', 3),
  ('a0000001-0001-4001-8001-000000000103', 'HDL', '61 mg/dL', 'Optimal', 4),
  ('a0000001-0001-4001-8001-000000000105', 'TSH', '6.8 mIU/L', 'High', 1),
  ('a0000001-0001-4001-8001-000000000105', 'Free T4', '0.9 ng/dL', 'Low', 2),
  ('a0000001-0001-4001-8001-000000000105', 'Vitamin D', '28 ng/mL', 'Borderline', 3),
  ('a0000001-0001-4001-8001-000000000105', 'Vitamin B12', '412 pg/mL', 'Normal', 4)
ON CONFLICT DO NOTHING;
