import { supabase, isSupabaseConfigured } from "./client";
import type { AppointmentRow, LabResultRow, StaffProfile } from "./types";
import {
  appointments as mockAppointments,
  doctors as mockDoctors,
  reports as mockReports,
  patient as mockPatient,
  type Appointment,
  type Doctor,
  type Report,
} from "@/lib/mock-data";
import {
  getPortalAppointments,
  getPortalPatientProfile,
  getPortalReports,
} from "@/lib/shared/patient-portal";

export async function fetchDoctors(): Promise<Doctor[]> {
  if (!isSupabaseConfigured()) return mockDoctors;

  const { data, error } = await supabase
    .from("staff_profiles")
    .select(
      "id, legacy_id, specialty, initials, bio, rating, review_count, experience_years, consultation_fee, next_available_slot, hospital_id",
    )
    .eq("is_active", true)
    .not("specialty", "is", null)
    .order("rating", { ascending: false });

  if (error || !data?.length) return mockDoctors;

  return (data as StaffProfile[]).map((d) => ({
    id: d.legacy_id ?? d.id,
    name: doctorNameFromInitials(d.initials, d.specialty),
    specialty: d.specialty ?? "General",
    hospital: "Oakhaven Medical Group",
    rating: Number(d.rating ?? 0),
    reviews: d.review_count ?? 0,
    experience: d.experience_years ?? 0,
    fee: Number(d.consultation_fee ?? 0),
    nextSlot: d.next_available_slot ?? "Contact clinic",
    initials: d.initials ?? "DR",
    bio: d.bio ?? "",
  }));
}

function doctorNameFromInitials(initials: string | null, specialty: string | null) {
  const map: Record<string, string> = {
    ET: "Dr. Eleanor Thorne",
    AV: "Dr. Aris Vance",
    MO: "Dr. Mira Okafor",
    HV: "Dr. Henrik Vogel",
    SR: "Dr. Saanvi Reddy",
    LP: "Dr. Lucien Park",
  };
  return map[initials ?? ""] ?? `Dr. ${specialty ?? "Specialist"}`;
}

export async function fetchAppointmentsForPatient(): Promise<Appointment[]> {
  const portal = getPortalAppointments();
  if (!isSupabaseConfigured()) return portal.length ? portal : mockAppointments;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return mockAppointments;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  if (!patient) return mockAppointments;

  const { data, error } = await supabase
    .from("appointments")
    .select("id, legacy_id, scheduled_at, time_label, reason, status, doctor_staff_id, staff_profiles(legacy_id, initials, specialty), queue_entries(position, estimated_wait_minutes)")
    .eq("patient_id", patient.id)
    .order("scheduled_at", { ascending: true });

  if (error || !data?.length) return portal.length ? portal : mockAppointments;

  return (data as AppointmentRow[]).map((a) => ({
    id: a.legacy_id ?? a.id,
    doctorId: a.staff_profiles?.legacy_id ?? a.doctor_staff_id ?? "",
    date: a.scheduled_at,
    time: a.time_label ?? "",
    reason: a.reason ?? "",
    status: a.status,
    queuePosition: a.queue_entries?.[0]?.position ?? undefined,
    estimatedWait: a.queue_entries?.[0]?.estimated_wait_minutes ?? undefined,
  }));
}

export async function fetchReportsForPatient(): Promise<Report[]> {
  const portal = getPortalReports();
  if (!isSupabaseConfigured()) return portal.length ? portal : mockReports;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return mockReports;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  if (!patient) return mockReports;

  const { data, error } = await supabase
    .from("lab_results")
    .select("id, legacy_id, title, report_type, result_date, file_size, doctor_name, shared_with_staff_ids")
    .eq("patient_id", patient.id)
    .order("result_date", { ascending: false });

  if (error || !data?.length) return portal.length ? portal : mockReports;

  return (data as LabResultRow[]).map((r) => ({
    id: r.legacy_id ?? r.id,
    title: r.title,
    type: r.report_type,
    date: r.result_date,
    size: r.file_size ?? "",
    doctor: r.doctor_name ?? "",
    shared: r.shared_with_staff_ids ?? [],
  }));
}

export async function fetchPatientProfile() {
  const portal = getPortalPatientProfile();
  if (!isSupabaseConfigured()) return portal;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return mockPatient;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userData.user.id)
    .maybeSingle();

  const { data: patient } = await supabase
    .from("patients")
    .select("blood_group, member_since, date_of_birth")
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  const name = profile?.full_name ?? portal.name;
  const parts = name.split(" ");
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2).toUpperCase();

  return {
    name,
    initials: initials.toUpperCase(),
    email: profile?.email ?? userData.user.email ?? portal.email,
    memberSince: patient?.member_since ?? portal.memberSince,
    age: patient?.date_of_birth
      ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 86400000))
      : portal.age,
    bloodGroup: patient?.blood_group ?? portal.bloodGroup,
  };
}

export async function fetchPublicDoctors() {
  return fetchDoctors();
}
