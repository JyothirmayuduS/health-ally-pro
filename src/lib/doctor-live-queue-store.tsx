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
  addPatientToQueue,
  approveBookingRequest,
  callNextPatient,
  callPatient,
  completeServing,
  dismissBookingRequest,
  getLiveQueueState,
  LIVE_QUEUE_EVENT,
  refreshWaitTimes,
  setAccepting,
  type LiveQueueState,
} from "@/lib/doctor-live-queue";
import { listOpdQueue, transitionOpdQueue } from "@/lib/opd/client";
import { doctorPatientIdFromMrn, DOCTOR_PORTAL_STAFF_ID } from "@/lib/shared/clinic-queue";

type LiveQueueStore = LiveQueueState & {
  refresh: () => void;
  toggleAccepting: () => void;
  approveBooking: (id: string) => number | null;
  dismissBooking: (id: string) => void;
  callNext: () => void;
  callWaiting: (entryId: string) => void;
  markDone: () => void;
  addToQueue: (input: {
    patientId: string;
    reason: string;
    mode?: "In-person" | "Video" | "Walk-in";
    slot?: string;
  }) => { token: number | null; alreadyInQueue: boolean };
};

const LiveQueueContext = createContext<LiveQueueStore | null>(null);

export function LiveQueueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveQueueState>(() => getLiveQueueState());

  const refresh = useCallback(() => {
    setState(getLiveQueueState());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(LIVE_QUEUE_EVENT, refresh);

    const tick = () => setState(refreshWaitTimes());
    tick();
    const interval = window.setInterval(tick, 15_000);

    return () => {
      window.removeEventListener(LIVE_QUEUE_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    const syncCanonical = async () => {
      const result = await listOpdQueue(DOCTOR_PORTAL_STAFF_ID);
      if (!result.ok || result.data.length === 0) return;
      setState((current) => ({
        ...current,
        entries: result.data.map((entry) => ({
          id: entry.id,
          token: entry.tokenNumber ?? 0,
          patientId: doctorPatientIdFromMrn(entry.patientLegacyId ?? entry.patientId),
          reason: "OPD consultation",
          mode: "In-person",
          status:
            entry.status === "in_progress" || entry.status === "called"
              ? "serving"
              : entry.status === "completed"
                ? "completed"
                : "waiting",
          waitMinutes: entry.estimatedWaitMinutes ?? 0,
          checkInTime: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          calledAt: entry.calledAt ?? undefined,
          completedAt: entry.completedAt ?? undefined,
          appointmentId: entry.appointmentId ?? undefined,
          canonicalPatientId: entry.patientId,
          canonicalDoctorId: entry.doctorId ?? undefined,
        })),
      }));
    };
    void syncCanonical();
    const interval = window.setInterval(() => void syncCanonical(), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const toggleAccepting = useCallback(() => {
    setState(setAccepting(!state.accepting));
  }, [state.accepting]);

  const approveBooking = useCallback((id: string) => {
    const { state: next, token } = approveBookingRequest(id);
    setState(next);
    return token;
  }, []);

  const dismissBooking = useCallback((id: string) => {
    setState(dismissBookingRequest(id));
  }, []);

  const callNext = useCallback(() => {
    const next = state.entries
      .filter((entry) => entry.status === "waiting")
      .sort((a, b) => a.token - b.token)[0];
    if (next) {
      void transitionOpdQueue(next.id, "call").then((result) => {
        if (result.ok) void transitionOpdQueue(next.id, "start");
      });
    }
    setState(callNextPatient());
  }, [state.entries]);

  const callWaiting = useCallback((entryId: string) => {
    void transitionOpdQueue(entryId, "call").then((result) => {
      if (result.ok) void transitionOpdQueue(entryId, "start");
    });
    setState(callPatient(entryId));
  }, []);

  const markDone = useCallback(() => {
    const serving = state.entries.find((entry) => entry.status === "serving");
    if (serving) void transitionOpdQueue(serving.id, "complete");
    setState(completeServing());
  }, [state.entries]);

  const addToQueue = useCallback(
    (input: {
      patientId: string;
      reason: string;
      mode?: "In-person" | "Video" | "Walk-in";
      slot?: string;
    }) => {
      const result = addPatientToQueue(input);
      setState(result.state);
      return { token: result.token, alreadyInQueue: result.alreadyInQueue };
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      toggleAccepting,
      approveBooking,
      dismissBooking,
      callNext,
      callWaiting,
      markDone,
      addToQueue,
    }),
    [
      state,
      refresh,
      toggleAccepting,
      approveBooking,
      dismissBooking,
      callNext,
      callWaiting,
      markDone,
      addToQueue,
    ],
  );

  return <LiveQueueContext.Provider value={value}>{children}</LiveQueueContext.Provider>;
}

export function useLiveQueue() {
  const ctx = useContext(LiveQueueContext);
  if (!ctx) throw new Error("useLiveQueue must be used within LiveQueueProvider");
  return ctx;
}
