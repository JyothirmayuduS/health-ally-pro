import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  doctorAppointments,
  type DoctorAppointment,
  type QueueItem,
} from "./doctor-mock-data";
import {
  CLINIC_QUEUE_EVENT,
  DOCTOR_PORTAL_STAFF_ID,
  doctorPatientIdFromMrn,
  listClinicQueue,
  updateQueueEntry,
  updateQueueByAppointment,
} from "@/lib/shared/clinic-queue";
import { closeEncounter } from "@/lib/shared/encounters";

type DoctorStore = {
  queue: QueueItem[];
  appointments: DoctorAppointment[];
  callNext: () => void;
  completeConsult: (queueId: string) => void;
  refreshQueue: () => void;
};

const DoctorContext = createContext<DoctorStore | null>(null);

function mapEntry(e: ReturnType<typeof listClinicQueue>[number]): QueueItem {
  return {
    id: e.id,
    tokenNumber: e.tokenNumber,
    patientId: doctorPatientIdFromMrn(e.patientId),
    status: e.status,
    checkInTime: e.checkInTime,
    waitMinutes: e.waitMinutes,
  };
}

export function DoctorProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    listClinicQueue(DOCTOR_PORTAL_STAFF_ID).map(mapEntry),
  );
  const [appointments, setAppointments] = useState(doctorAppointments);

  const refreshQueue = useCallback(() => {
    setQueue(listClinicQueue(DOCTOR_PORTAL_STAFF_ID).map(mapEntry));
  }, []);

  useEffect(() => {
    refreshQueue();
    window.addEventListener(CLINIC_QUEUE_EVENT, refreshQueue);
    return () => window.removeEventListener(CLINIC_QUEUE_EVENT, refreshQueue);
  }, [refreshQueue]);

  const callNext = useCallback(() => {
    const entries = listClinicQueue(DOCTOR_PORTAL_STAFF_ID);
    const waiting = entries
      .filter((e) => e.status === "waiting")
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
    if (!waiting.length) return;
    const inConsult = entries.find((e) => e.status === "in-consultation");
    if (inConsult) {
      updateQueueEntry(inConsult.id, { status: "completed" });
      updateQueueByAppointment(inConsult.appointmentId, { status: "completed" });
      if (inConsult.encounterId) closeEncounter(inConsult.encounterId);
    }
    const next = waiting[0];
    updateQueueEntry(next.id, { status: "in-consultation", waitMinutes: 0 });
    updateQueueByAppointment(next.appointmentId, { status: "in-consultation" });
    refreshQueue();
    setAppointments((prev) =>
      prev.map((a) =>
        a.patientId === doctorPatientIdFromMrn(next.patientId)
          ? { ...a, status: "in-progress" }
          : a.status === "in-progress"
            ? { ...a, status: "completed" }
            : a,
      ),
    );
  }, [refreshQueue]);

  const completeConsult = useCallback(
    (queueId: string) => {
      const entry = listClinicQueue(DOCTOR_PORTAL_STAFF_ID).find((e) => e.id === queueId);
      if (entry) {
        updateQueueEntry(queueId, { status: "completed" });
        updateQueueByAppointment(entry.appointmentId, { status: "completed" });
        if (entry.encounterId) closeEncounter(entry.encounterId);
      }
      refreshQueue();
      setAppointments((prev) =>
        prev.map((a) => (a.status === "in-progress" ? { ...a, status: "completed" } : a)),
      );
    },
    [refreshQueue],
  );

  const value = useMemo(
    () => ({ queue, appointments, callNext, completeConsult, refreshQueue }),
    [queue, appointments, callNext, completeConsult, refreshQueue],
  );

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}

export function useDoctorStore() {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error("useDoctorStore must be used within DoctorProvider");
  return ctx;
}
