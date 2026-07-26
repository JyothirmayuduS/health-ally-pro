import { supabase, isSupabaseConfigured } from "./supabase";
import {
  appointments as mockAppointments,
  doctors as mockDoctors,
  patient as mockPatient,
} from "./mock-data";

const DOCTOR_NAMES: Record<string, string> = {
  ET: "Dr. Eleanor Thorne",
  AV: "Dr. Aris Vance",
  MO: "Dr. Mira Okafor",
  HV: "Dr. Henrik Vogel",
  SR: "Dr. Saanvi Reddy",
  LP: "Dr. Lucien Park",
};

const API_BASE = (process.env.EXPO_PUBLIC_MEDORA_API_URL || "").replace(/\/$/, "");

async function fetchPhi<T>(resource: string): Promise<T | null> {
  if (!API_BASE) return null;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/hospital/phi?resource=${resource}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchMobileDashboard() {
  const useDemoHome = process.env.EXPO_PUBLIC_DEMO_HOME !== "false";
  if (!isSupabaseConfigured() || useDemoHome) {
    return {
      patient: mockPatient,
      appointments: mockAppointments,
      doctors: mockDoctors,
      connected: false,
    };
  }

  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    let patient = mockPatient;
    if (user) {
      const profileBundle = await fetchPhi<{
        profile: { full_name: string | null; email: string | null } | null;
      }>("patient_profile");
      const profile = profileBundle?.profile;
      if (profile?.full_name) {
        const parts = profile.full_name.split(" ");
        patient = {
          ...mockPatient,
          name: profile.full_name,
          email: profile.email ?? mockPatient.email,
          initials:
            parts.length >= 2
              ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
              : profile.full_name.slice(0, 2).toUpperCase(),
        };
      }
    }

    type StaffRow = {
      id: string;
      legacy_id: string | null;
      specialty: string | null;
      initials: string | null;
      bio: string | null;
      rating: number | null;
      review_count: number | null;
      experience_years: number | null;
      consultation_fee: number | null;
      next_available_slot: string | null;
    };
    const staff = (await fetchPhi<StaffRow[]>("staff_profiles")) ?? [];

    const doctors =
      staff.map((d) => ({
        id: d.legacy_id ?? d.id,
        name: DOCTOR_NAMES[d.initials ?? ""] ?? `Dr. ${d.specialty}`,
        specialty: d.specialty ?? "General",
        hospital: "Oakhaven Medical Group",
        rating: Number(d.rating ?? 0),
        reviews: d.review_count ?? 0,
        experience: d.experience_years ?? 0,
        fee: Number(d.consultation_fee ?? 0),
        nextSlot: d.next_available_slot ?? "Contact clinic",
        initials: d.initials ?? "DR",
        bio: d.bio ?? "",
      })) ?? mockDoctors;

    let appointments = mockAppointments;
    if (user) {
      type ApptRow = {
        id: string;
        legacy_id: string | null;
        scheduled_at: string;
        time_label: string | null;
        reason: string | null;
        status: string;
        staff_profiles?: { legacy_id: string | null } | null;
        queue_entries?: Array<{ position: number; estimated_wait_minutes: number }> | null;
      };
      const rows = await fetchPhi<ApptRow[]>("appointments");
      if (rows?.length) {
        appointments = rows.map((a) => ({
          id: a.legacy_id ?? a.id,
          doctorId: a.staff_profiles?.legacy_id ?? "",
          date: a.scheduled_at,
          time: a.time_label ?? "",
          reason: a.reason ?? "",
          status: a.status,
          queuePosition: a.queue_entries?.[0]?.position ?? undefined,
          estimatedWait: a.queue_entries?.[0]?.estimated_wait_minutes ?? undefined,
        }));
      }
    }

    return {
      patient,
      appointments,
      doctors: doctors.length ? doctors : mockDoctors,
      connected: true,
    };
  } catch {
    return {
      patient: mockPatient,
      appointments: mockAppointments,
      doctors: mockDoctors,
      connected: false,
    };
  }
}
