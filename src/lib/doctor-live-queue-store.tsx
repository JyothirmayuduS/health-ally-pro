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
    setState(callNextPatient());
  }, []);

  const callWaiting = useCallback((entryId: string) => {
    setState(callPatient(entryId));
  }, []);

  const markDone = useCallback(() => {
    setState(completeServing());
  }, []);

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
