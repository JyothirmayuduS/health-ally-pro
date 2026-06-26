-- Demo seed data for Oakhaven Medical Group (matches mock-data.ts)

CREATE OR REPLACE FUNCTION public.seed_demo_user(
  p_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role public.user_role,
  p_hospital_id UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    p_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p_role::text, 'hospital_id', p_hospital_id::text),
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    p_id,
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (p_id, p_full_name, p_email)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  INSERT INTO public.hospital_memberships (profile_id, hospital_id, role)
  VALUES (p_id, p_hospital_id, p_role)
  ON CONFLICT (profile_id, hospital_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

INSERT INTO public.hospitals (id, name, slug, phone, email, address)
VALUES (
  'a0000001-0001-4001-8001-000000000001',
  'Oakhaven Medical Group',
  'oakhaven-medical',
  '+1 (415) 555-0142',
  'hello@oakhaven.demo',
  '1200 Wellness Blvd, San Francisco, CA'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, hospital_id, name, code, address) VALUES
  ('a0000001-0001-4001-8001-000000000011', 'a0000001-0001-4001-8001-000000000001', 'Oakhaven Medical', 'OAK', '1200 Wellness Blvd'),
  ('a0000001-0001-4001-8001-000000000012', 'a0000001-0001-4001-8001-000000000001', 'Riverbend Clinic', 'RIV', '88 Riverbend Ave'),
  ('a0000001-0001-4001-8001-000000000013', 'a0000001-0001-4001-8001-000000000001', 'Sage Wellness', 'SAG', '42 Sage Park')
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (id, branch_id, name, code) VALUES
  ('a0000001-0001-4001-8001-000000000021', 'a0000001-0001-4001-8001-000000000011', 'Cardiology', 'CARD'),
  ('a0000001-0001-4001-8001-000000000022', 'a0000001-0001-4001-8001-000000000012', 'Neurology', 'NEUR'),
  ('a0000001-0001-4001-8001-000000000023', 'a0000001-0001-4001-8001-000000000013', 'Dermatology', 'DERM'),
  ('a0000001-0001-4001-8001-000000000024', 'a0000001-0001-4001-8001-000000000011', 'Orthopedics', 'ORTH'),
  ('a0000001-0001-4001-8001-000000000025', 'a0000001-0001-4001-8001-000000000013', 'General Medicine', 'GEN'),
  ('a0000001-0001-4001-8001-000000000026', 'a0000001-0001-4001-8001-000000000012', 'Endocrinology', 'ENDO')
ON CONFLICT DO NOTHING;

SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000001', 'clara.w@medora.health', 'Demo1234!', 'Clara Whitfield', 'patient', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000002', 'admin@oakhaven.demo', 'Demo1234!', 'Alex Morgan', 'hospital_admin', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000003', 'reception@oakhaven.demo', 'Demo1234!', 'Jordan Lee', 'receptionist', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000004', 'doctor@oakhaven.demo', 'Demo1234!', 'Dr. Eleanor Thorne', 'doctor', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000005', 'lab@oakhaven.demo', 'Demo1234!', 'Sam Patel', 'lab_technician', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000009', 'lab.supervisor@oakhaven.demo', 'Demo1234!', 'Dr. Meera Nair', 'lab_supervisor', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000006', 'pharmacy@oakhaven.demo', 'Demo1234!', 'Riley Chen', 'pharmacist', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000007', 'billing@oakhaven.demo', 'Demo1234!', 'Taylor Brooks', 'billing_staff', 'a0000001-0001-4001-8001-000000000001');
SELECT public.seed_demo_user('b0000001-0001-4001-8001-000000000008', 'nurse@oakhaven.demo', 'Demo1234!', 'Morgan Hayes', 'nurse', 'a0000001-0001-4001-8001-000000000001');

INSERT INTO public.patients (id, profile_id, hospital_id, mrn, date_of_birth, blood_group, member_since)
VALUES (
  'c0000001-0001-4001-8001-000000000001',
  'b0000001-0001-4001-8001-000000000001',
  'a0000001-0001-4001-8001-000000000001',
  'MRN-10042',
  '1991-03-15',
  'O+',
  '2022'
) ON CONFLICT DO NOTHING;

-- Doctor staff profiles (catalog + linked auth for Eleanor)
INSERT INTO public.staff_profiles (id, membership_id, hospital_id, department_id, specialty, initials, bio, rating, review_count, experience_years, consultation_fee, next_available_slot, legacy_id) VALUES
  (
    'e0000001-0001-4001-8001-000000000001',
    (SELECT id FROM public.hospital_memberships WHERE profile_id = 'b0000001-0001-4001-8001-000000000004' AND role = 'doctor'),
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000021',
    'Cardiology', 'ET',
    'Interventional cardiologist focused on preventive heart health and post-operative care.',
    4.9, 312, 14, 120, 'Today, 2:30 PM', 'd1'
  ),
  (
    'e0000001-0001-4001-8001-000000000003', NULL,
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000022',
    'Neurology', 'AV',
    'Specialist in headache disorders, sleep medicine, and cognitive wellness.',
    4.8, 188, 11, 140, 'Tomorrow, 10:00 AM', 'd2'
  ),
  (
    'e0000001-0001-4001-8001-000000000004', NULL,
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000023',
    'Dermatology', 'MO',
    'Cosmetic and medical dermatology with an integrative skin-health approach.',
    4.95, 421, 9, 95, 'Today, 5:15 PM', 'd3'
  ),
  (
    'e0000001-0001-4001-8001-000000000005', NULL,
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000024',
    'Orthopedics', 'HV',
    'Joint reconstruction and sports medicine specialist.',
    4.7, 156, 18, 160, 'Fri, 11:30 AM', 'd4'
  ),
  (
    'e0000001-0001-4001-8001-000000000006', NULL,
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000025',
    'General Physician', 'SR',
    'Primary care with focus on preventive medicine and chronic care.',
    4.85, 502, 7, 60, 'Today, 3:00 PM', 'd5'
  ),
  (
    'e0000001-0001-4001-8001-000000000007', NULL,
    'a0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000026',
    'Endocrinology', 'LP',
    'Diabetes, thyroid, and hormonal health specialist.',
    4.75, 97, 13, 130, 'Mon, 9:45 AM', 'd6'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.appointments (id, hospital_id, branch_id, patient_id, doctor_staff_id, scheduled_at, time_label, reason, status, legacy_id) VALUES
  ('f0000001-0001-4001-8001-000000000001', 'a0000001-0001-4001-8001-000000000001', 'a0000001-0001-4001-8001-000000000011', 'c0000001-0001-4001-8001-000000000001', 'e0000001-0001-4001-8001-000000000001', now(), '2:30 PM', 'Follow-up consultation', 'in_queue', 'a1'),
  ('f0000001-0001-4001-8001-000000000002', 'a0000001-0001-4001-8001-000000000001', 'a0000001-0001-4001-8001-000000000013', 'c0000001-0001-4001-8001-000000000001', 'e0000001-0001-4001-8001-000000000004', now() + interval '3 days', '5:15 PM', 'Annual skin screening', 'upcoming', 'a2'),
  ('f0000001-0001-4001-8001-000000000003', 'a0000001-0001-4001-8001-000000000001', 'a0000001-0001-4001-8001-000000000013', 'c0000001-0001-4001-8001-000000000001', 'e0000001-0001-4001-8001-000000000006', now() - interval '12 days', '11:00 AM', 'General check-up', 'completed', 'a3')
ON CONFLICT DO NOTHING;

INSERT INTO public.queue_entries (id, hospital_id, branch_id, appointment_id, patient_id, doctor_staff_id, token_number, position, estimated_wait_minutes, status)
VALUES (
  'f0000001-0001-4001-8001-000000000010',
  'a0000001-0001-4001-8001-000000000001',
  'a0000001-0001-4001-8001-000000000011',
  'f0000001-0001-4001-8001-000000000001',
  'c0000001-0001-4001-8001-000000000001',
  'e0000001-0001-4001-8001-000000000001',
  42, 2, 14, 'waiting'
) ON CONFLICT DO NOTHING;

INSERT INTO public.lab_results (id, hospital_id, patient_id, title, report_type, result_date, file_size, doctor_name, legacy_id) VALUES
  ('a0000001-0001-4001-8001-000000000101', 'a0000001-0001-4001-8001-000000000001', 'c0000001-0001-4001-8001-000000000001', 'Comprehensive Metabolic Panel', 'Lab', '2024-10-08', '2.4 MB', 'Dr. Saanvi Reddy', 'r1'),
  ('a0000001-0001-4001-8001-000000000102', 'a0000001-0001-4001-8001-000000000001', 'c0000001-0001-4001-8001-000000000001', 'Cardiac MRI Summary', 'Imaging', '2024-09-12', '18.1 MB', 'Dr. Eleanor Thorne', 'r2'),
  ('a0000001-0001-4001-8001-000000000103', 'a0000001-0001-4001-8001-000000000001', 'c0000001-0001-4001-8001-000000000001', 'Lipid Profile Analysis', 'Lab', '2024-08-02', '1.1 MB', 'Dr. Saanvi Reddy', 'r3'),
  ('a0000001-0001-4001-8001-000000000104', 'a0000001-0001-4001-8001-000000000001', 'c0000001-0001-4001-8001-000000000001', 'Dermoscopy Imaging', 'Imaging', '2024-07-19', '12.6 MB', 'Dr. Mira Okafor', 'r4'),
  ('a0000001-0001-4001-8001-000000000105', 'a0000001-0001-4001-8001-000000000001', 'c0000001-0001-4001-8001-000000000001', 'Vitamin D & B12 Panel', 'Lab', '2024-06-04', '0.8 MB', 'Dr. Saanvi Reddy', 'r5')
ON CONFLICT DO NOTHING;

DROP FUNCTION IF EXISTS public.seed_demo_user(UUID, TEXT, TEXT, TEXT, public.user_role, UUID);
