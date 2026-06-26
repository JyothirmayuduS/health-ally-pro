import { useCallback, useEffect, useState } from "react";
import type { Appointment } from "@/lib/mock-data";
import {
  listPatientAppointments,
  PATIENT_APPOINTMENTS_EVENT,
} from "@/lib/patient-appointments-store";
import { PATIENT_BOOKING_EVENT } from "@/lib/patient-booking-store";

export function usePatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(
    listPatientAppointments,
  );

  const sync = useCallback(() => {
    setAppointments(listPatientAppointments());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(PATIENT_APPOINTMENTS_EVENT, sync);
    window.addEventListener(PATIENT_BOOKING_EVENT, sync);
    return () => {
      window.removeEventListener(PATIENT_APPOINTMENTS_EVENT, sync);
      window.removeEventListener(PATIENT_BOOKING_EVENT, sync);
    };
  }, [sync]);

  return { appointments, sync };
}
