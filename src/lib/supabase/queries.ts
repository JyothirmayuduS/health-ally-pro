import { supabase, isSupabaseConfigured } from "./client";
import type { AppointmentRow, AppointmentStatus, LabResultRow, StaffProfile } from "./types";
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
import { fetchPhiResource } from "@/lib/supabase/phi-api";

export async function fetchDoctors(): Promise<Doctor[]> {
  if (!isSupabaseConfigured()) return mockDoctors;

  const res = await fetchPhiResource<StaffProfile[]>("staff_profiles");
  if (!res.ok || !res.data?.length) return mockDoctors;

  return res.data.map((d) => ({
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

const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, Appointment["status"]> = {
  upcoming: "upcoming",
  in_queue: "in-queue",
  completed: "completed",
  cancelled: "cancelled",
  no_show: "cancelled",
};

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

  const res = await fetchPhiResource<AppointmentRow[]>("appointments");
  if (!res.ok || !res.data?.length) return portal.length ? portal : mockAppointments;

  return res.data.map((a) => ({
    id: a.legacy_id ?? a.id,
    doctorId: a.staff_profiles?.legacy_id ?? a.doctor_staff_id ?? "",
    date: a.scheduled_at,
    time: a.time_label ?? "",
    reason: a.reason ?? "",
    status: APPOINTMENT_STATUS_MAP[a.status] ?? "upcoming",
    queuePosition: a.queue_entries?.[0]?.position ?? undefined,
    estimatedWait: a.queue_entries?.[0]?.estimated_wait_minutes ?? undefined,
  }));
}

export async function fetchReportsForPatient(): Promise<Report[]> {
  const portal = getPortalReports();
  if (!isSupabaseConfigured()) return portal.length ? portal : mockReports;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return mockReports;

  const res = await fetchPhiResource<LabResultRow[]>("lab_results");
  if (!res.ok || !res.data?.length) return portal.length ? portal : mockReports;

  return res.data.map((r) => ({
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

  const res = await fetchPhiResource<{
    profile: { full_name: string | null; email: string | null } | null;
    patient: {
      blood_group: string | null;
      member_since: string | null;
      date_of_birth: string | null;
    } | null;
  }>("patient_profile");

  const profile = res.data?.profile;
  const patient = res.data?.patient;
  if (!res.ok) return mockPatient;

  const name = profile?.full_name ?? portal.name;
  const parts = name.split(" ");
  const initials =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2).toUpperCase();

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
