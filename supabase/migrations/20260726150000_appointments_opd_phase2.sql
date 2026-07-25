-- Appointments & OPD Phase 2
-- Canonical availability, conflict-safe booking, daily tokens, queue and event outbox.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_type TEXT NOT NULL DEFAULT 'consultation',
  ADD COLUMN IF NOT EXISTS visit_mode TEXT NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS token_number INTEGER,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS rescheduled_from_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_of_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_visit_mode_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_visit_mode_check
  CHECK (visit_mode IN ('scheduled', 'walk_in'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_doctor_slot
  ON public.appointments (hospital_id, doctor_staff_id, scheduled_at)
  WHERE doctor_staff_id IS NOT NULL
    AND status NOT IN ('cancelled'::public.appointment_status, 'no_show'::public.appointment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_scheduled
  ON public.appointments (hospital_id, patient_id, scheduled_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_entries_unique_appointment
  ON public.queue_entries (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.doctor_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_minutes SMALLINT NOT NULL DEFAULT 15 CHECK (slot_minutes BETWEEN 5 AND 240),
  capacity SMALLINT NOT NULL DEFAULT 1 CHECK (capacity BETWEEN 1 AND 20),
  effective_from DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CHECK (end_time > start_time),
  UNIQUE (hospital_id, doctor_staff_id, weekday, start_time, effective_from)
);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_rules_lookup
  ON public.doctor_availability_rules (hospital_id, doctor_staff_id, weekday)
  WHERE is_active;

CREATE TABLE IF NOT EXISTS public.doctor_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('blocked', 'override')),
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CHECK (
    (kind = 'blocked' AND start_time IS NULL AND end_time IS NULL)
    OR
    (kind = 'override' AND start_time IS NOT NULL AND end_time > start_time)
  ),
  UNIQUE (hospital_id, doctor_staff_id, exception_date, kind)
);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_exceptions_lookup
  ON public.doctor_availability_exceptions (hospital_id, doctor_staff_id, exception_date);

CREATE TABLE IF NOT EXISTS public.hospital_doctor_token_counters (
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  next_token INTEGER NOT NULL DEFAULT 101 CHECK (next_token > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (hospital_id, doctor_staff_id, day_date)
);

CREATE OR REPLACE FUNCTION public.next_doctor_token(
  p_hospital_id UUID,
  p_doctor_staff_id UUID,
  p_day_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_profiles s
    WHERE s.id = p_doctor_staff_id AND s.hospital_id = p_hospital_id
  ) THEN
    RAISE EXCEPTION 'doctor_not_in_hospital';
  END IF;

  INSERT INTO public.hospital_doctor_token_counters (
    hospital_id, doctor_staff_id, day_date, next_token
  )
  VALUES (p_hospital_id, p_doctor_staff_id, p_day_date, 102)
  ON CONFLICT (hospital_id, doctor_staff_id, day_date)
  DO UPDATE SET
    next_token = public.hospital_doctor_token_counters.next_token + 1,
    updated_at = now()
  RETURNING next_token - 1 INTO v_token;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.next_doctor_token(UUID, UUID, DATE)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_doctor_token(UUID, UUID, DATE)
  TO service_role;

CREATE TABLE IF NOT EXISTS public.opd_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_opd_notification_events_pending
  ON public.opd_notification_events (hospital_id, status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.doctor_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_doctor_token_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opd_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY doctor_availability_rules_select ON public.doctor_availability_rules
  FOR SELECT USING (public.staff_in_hospital(hospital_id));
CREATE POLICY doctor_availability_rules_manage ON public.doctor_availability_rules
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','receptionist']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','receptionist']::public.user_role[]
    )
  );

CREATE POLICY doctor_availability_exceptions_select ON public.doctor_availability_exceptions
  FOR SELECT USING (public.staff_in_hospital(hospital_id));
CREATE POLICY doctor_availability_exceptions_manage ON public.doctor_availability_exceptions
  FOR ALL USING (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','receptionist']::public.user_role[]
    )
  )
  WITH CHECK (
    public.staff_has_role_in_hospital(
      hospital_id,
      ARRAY['super_admin','hospital_admin','doctor','receptionist']::public.user_role[]
    )
  );

CREATE POLICY hospital_doctor_token_counters_deny
  ON public.hospital_doctor_token_counters
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY opd_notification_events_deny
  ON public.opd_notification_events
  FOR ALL USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE
  public.doctor_availability_rules,
  public.doctor_availability_exceptions,
  public.hospital_doctor_token_counters,
  public.opd_notification_events
FROM anon, authenticated;

GRANT ALL ON TABLE
  public.doctor_availability_rules,
  public.doctor_availability_exceptions,
  public.hospital_doctor_token_counters,
  public.opd_notification_events
TO service_role;

-- Oak Haven default OPD availability, additive and synthetic.
INSERT INTO public.doctor_availability_rules (
  hospital_id, doctor_staff_id, weekday, start_time, end_time, slot_minutes, capacity
)
SELECT s.hospital_id, s.id, d.weekday, '09:00'::time, '17:00'::time, 15, 1
FROM public.staff_profiles s
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6)) AS d(weekday)
JOIN public.hospitals h ON h.id = s.hospital_id
WHERE s.is_active = true
  AND s.specialty IS NOT NULL
  AND (h.slug = 'oak-haven' OR h.id = 'a0000001-0001-4001-8001-000000000001')
ON CONFLICT (hospital_id, doctor_staff_id, weekday, start_time, effective_from)
DO NOTHING;
