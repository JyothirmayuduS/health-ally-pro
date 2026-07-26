import { useEffect, useState } from "react";
import { getAuthSession, type AuthSession } from "@/lib/supabase/auth";
import type { HospitalDoctorRecord, SpecialtyDefinition, SpecialtyId } from "./types";
import { getSpecialty } from "./catalog";
import {
  findDoctorByAuthUserId,
  findDoctorByEmail,
  loadHospitalDoctors,
  subscribeHospitalDoctors,
} from "./doctor-registry";

export type DoctorSpecialtyContext = {
  session: AuthSession | null;
  doctor: HospitalDoctorRecord | null;
  specialtyId: SpecialtyId;
  specialty: SpecialtyDefinition;
  loading: boolean;
};

export function useDoctorSpecialty(): DoctorSpecialtyContext {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [doctor, setDoctor] = useState<HospitalDoctorRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const s = await getAuthSession();
      if (cancelled) return;
      setSession(s);

      const list = loadHospitalDoctors();
      let match: HospitalDoctorRecord | null = null;
      if (s?.userId) match = findDoctorByAuthUserId(s.userId);
      if (!match && s?.email) match = findDoctorByEmail(s.email);
      // Fallback: first active general medicine doctor for any doctor session
      if (!match && s?.roles.includes("doctor")) {
        match =
          list.find((d) => d.active && d.specialtyId === "general_medicine") ??
          list.find((d) => d.active) ??
          null;
      }
      setDoctor(match);
      setLoading(false);
    };

    void resolve();
    const unsub = subscribeHospitalDoctors(() => {
      void resolve();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const specialtyId: SpecialtyId = doctor?.specialtyId ?? "general_medicine";
  return {
    session,
    doctor,
    specialtyId,
    specialty: getSpecialty(specialtyId),
    loading,
  };
}
