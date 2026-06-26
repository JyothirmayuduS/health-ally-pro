import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  initialQueue,
  receptionAppointments,
  receptionPatients,
  type QueueEntry,
  type QueueStatus,
  type ReceptionAppointment,
  type ReceptionPatient,
} from "./reception-mock-data";

type ReceptionStore = {
  queue: QueueEntry[];
  patients: ReceptionPatient[];
  appointments: ReceptionAppointment[];
  callNext: (doctorId: string) => void;
  updateQueueStatus: (queueId: string, status: QueueStatus) => void;
  addPatient: (
    patient: Omit<
      ReceptionPatient,
      "id" | "initials" | "avatarColor" | "registeredAt" | "visitStatus" | "photoUrl"
    >,
  ) => ReceptionPatient;
  bookAppointment: (
    appointment: Omit<ReceptionAppointment, "id" | "status">,
  ) => ReceptionAppointment;
  checkInPatient: (appointmentId: string) => QueueEntry | null;
};

const ReceptionContext = createContext<ReceptionStore | null>(null);

const avatarColors = [
  "#E8B4B8",
  "#B4C8E8",
  "#C8E8B4",
  "#E8D4B4",
  "#D4B4E8",
  "#B4E8E8",
  "#E8C4B4",
  "#B4D4E8",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ReceptionProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueEntry[]>(initialQueue);
  const [patients, setPatients] = useState<ReceptionPatient[]>(receptionPatients);
  const [appointments, setAppointments] = useState<ReceptionAppointment[]>(receptionAppointments);

  const callNext = useCallback((doctorId: string) => {
    setQueue((prev) => {
      const waiting = prev
        .filter((q) => q.doctorId === doctorId && q.status === "waiting")
        .sort((a, b) => a.tokenNumber - b.tokenNumber);
      if (waiting.length === 0) return prev;

      const nextId = waiting[0].id;
      return prev.map((q) => {
        if (q.doctorId === doctorId && q.status === "in-consultation") {
          return { ...q, status: "completed" as QueueStatus };
        }
        if (q.id === nextId) {
          return { ...q, status: "in-consultation" as QueueStatus, waitMinutes: 0 };
        }
        return q;
      });
    });
  }, []);

  const updateQueueStatus = useCallback((queueId: string, status: QueueStatus) => {
    setQueue((prev) => prev.map((q) => (q.id === queueId ? { ...q, status } : q)));
  }, []);

  const addPatient = useCallback(
    (
      data: Omit<
        ReceptionPatient,
        "id" | "initials" | "avatarColor" | "registeredAt" | "visitStatus" | "photoUrl"
      >,
    ) => {
      const id = `p${Date.now()}`;
      const initials = getInitials(data.name);
      const patient: ReceptionPatient = {
        ...data,
        id,
        initials,
        avatarColor: avatarColors[patients.length % avatarColors.length],
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=E0E7EB&color=1e293b&size=128`,
        registeredAt: new Date().toISOString().slice(0, 10),
        visitStatus: "waiting",
      };
      setPatients((prev) => [patient, ...prev]);
      return patient;
    },
    [patients.length],
  );

  const bookAppointment = useCallback((data: Omit<ReceptionAppointment, "id" | "status">) => {
    const appointment: ReceptionAppointment = {
      ...data,
      id: `a${Date.now()}`,
      status: "scheduled",
    };
    setAppointments((prev) => [...prev, appointment]);
    return appointment;
  }, []);

  const checkInPatient = useCallback(
    (appointmentId: string) => {
      const appointment = appointments.find((a) => a.id === appointmentId);
      if (!appointment) return null;

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "checked-in" } : a)),
      );

      const maxToken = queue.reduce((max, q) => Math.max(max, q.tokenNumber), 100);
      const entry: QueueEntry = {
        id: `q${Date.now()}`,
        tokenNumber: maxToken + 1,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        status: "waiting",
        checkInTime: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        waitMinutes: 0,
        appointmentId,
      };
      setQueue((prev) => [...prev, entry]);
      return entry;
    },
    [appointments, queue],
  );

  const value = useMemo(
    () => ({
      queue,
      patients,
      appointments,
      callNext,
      updateQueueStatus,
      addPatient,
      bookAppointment,
      checkInPatient,
    }),
    [
      queue,
      patients,
      appointments,
      callNext,
      updateQueueStatus,
      addPatient,
      bookAppointment,
      checkInPatient,
    ],
  );

  return <ReceptionContext.Provider value={value}>{children}</ReceptionContext.Provider>;
}

export function useReceptionStore() {
  const ctx = useContext(ReceptionContext);
  if (!ctx) throw new Error("useReceptionStore must be used within ReceptionProvider");
  return ctx;
}
