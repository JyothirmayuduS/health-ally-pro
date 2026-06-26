import { useCallback, useEffect, useState } from "react";
import {
  DEPENDENTS_CHANGED,
  listDependents,
  refreshDependentsFromStorage,
} from "@/lib/dependents-store";
import type { Dependent } from "@/lib/patient-profile-data";

export function useDependents(): Dependent[] {
  const [deps, setDeps] = useState(listDependents);

  const sync = useCallback(() => {
    refreshDependentsFromStorage();
    setDeps(listDependents());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(DEPENDENTS_CHANGED, sync);
    return () => window.removeEventListener(DEPENDENTS_CHANGED, sync);
  }, [sync]);

  return deps;
}
