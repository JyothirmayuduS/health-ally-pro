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
  getProfileStore,
  subscribeProfileStore,
  type ProfileStoreState,
} from "@/lib/doctor-profile-store";

const ProfileStoreContext = createContext<ProfileStoreState | null>(null);

export function ProfileStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfileStoreState>(() => getProfileStore());

  const refresh = useCallback(() => {
    setState(getProfileStore());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeProfileStore(refresh);
  }, [refresh]);

  return (
    <ProfileStoreContext.Provider value={state}>{children}</ProfileStoreContext.Provider>
  );
}

export function useProfileStore() {
  const ctx = useContext(ProfileStoreContext);
  if (!ctx) {
    return getProfileStore();
  }
  return ctx;
}

export function useProfileStoreRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeProfileStore(() => setTick((t) => t + 1)), []);
}
