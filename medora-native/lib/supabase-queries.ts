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
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
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

    const { data: staff } = await supabase
      .from("staff_profiles")
      .select(
        "id, legacy_id, specialty, initials, bio, rating, review_count, experience_years, consultation_fee, next_available_slot",
      )
      .eq("is_active", true)
      .not("specialty", "is", null);

    const doctors =
      staff?.map((d) => ({
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
      const { data: patientRow } = await supabase
        .from("patients")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (patientRow) {
        const { data: rows } = await supabase
          .from("appointments")
          .select(
            "id, legacy_id, scheduled_at, time_label, reason, status, staff_profiles(legacy_id), queue_entries(position, estimated_wait_minutes)",
          )
          .eq("patient_id", patientRow.id)
          .order("scheduled_at", { ascending: true });

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
    }

    return { patient, appointments, doctors, connected: true };
  } catch {
    return {
      patient: mockPatient,
      appointments: mockAppointments,
      doctors: mockDoctors,
      connected: false,
    };
  }
}
