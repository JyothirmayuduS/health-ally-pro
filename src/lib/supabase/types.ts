export type UserRole =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "lab_technician"
  | "lab_supervisor"
  | "pharmacist"
  | "billing_staff"
  | "patient"
  | "caregiver";

export type AppointmentStatus = "upcoming" | "in_queue" | "completed" | "cancelled" | "no_show";
export type ReportType = "Lab" | "Imaging" | "Prescription" | "Summary";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type HospitalMembership = {
  id: string;
  profile_id: string;
  hospital_id: string;
  branch_id: string | null;
  role: UserRole;
  is_active: boolean;
};

export type StaffProfile = {
  id: string;
  membership_id: string | null;
  hospital_id: string;
  department_id: string | null;
  specialty: string | null;
  initials: string | null;
  bio: string | null;
  rating: number | null;
  review_count: number | null;
  experience_years: number | null;
  consultation_fee: number | null;
  next_available_slot: string | null;
  legacy_id: string | null;
  departments?: { name: string; branches?: { name: string } | null } | null;
};

export type PatientRecord = {
  id: string;
  profile_id: string | null;
  hospital_id: string;
  mrn: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  member_since: string | null;
  profiles?: Profile | null;
};

export type AppointmentRow = {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_staff_id: string | null;
  scheduled_at: string;
  time_label: string | null;
  reason: string | null;
  status: AppointmentStatus;
  legacy_id: string | null;
  staff_profiles?: StaffProfile | null;
  queue_entries?: Array<{
    position: number | null;
    estimated_wait_minutes: number | null;
    status: string;
  }> | null;
};

export type LabResultRow = {
  id: string;
  title: string;
  report_type: ReportType;
  result_date: string;
  file_size: string | null;
  doctor_name: string | null;
  legacy_id: string | null;
  shared_with_staff_ids: string[] | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile };
      hospital_memberships: { Row: HospitalMembership };
      staff_profiles: { Row: StaffProfile };
      patients: { Row: PatientRecord };
      appointments: { Row: AppointmentRow };
      lab_results: { Row: LabResultRow };
      lab_result_items: {
        Row: {
          id: string;
          lab_result_id: string;
          name: string;
          value: string;
          status: "Normal" | "Borderline" | "Optimal" | "High" | "Low";
          sort_order: number;
        };
      };
      patient_medications: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          dosage: string | null;
          medication_time: string | null;
          status: string;
          legacy_id: string | null;
        };
      };
      diet_meal_media_cache: {
        Row: {
          id: string;
          cache_key: string;
          cache_type: string;
          language: string | null;
          payload: unknown;
          expires_at: string;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          position: number | null;
          estimated_wait_minutes: number | null;
          status: string;
        };
      };
      branches: { Row: { id: string; name: string } };
    };
  };
};
