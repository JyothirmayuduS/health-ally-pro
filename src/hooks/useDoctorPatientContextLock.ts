import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { resolveDoctorPatient } from "@/lib/doctor-patient-context";

function patientIdFromSearchString(search: string): string | undefined {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return undefined;
  const value = new URLSearchParams(raw).get("patientId");
  return value?.trim() || undefined;
}

/** Reads ?patientId= from the active route to freeze clinical module pickers. */
export function useDoctorPatientContextLock(explicitPatientId?: string) {
  const location = useLocation();

  const routePatientId = useMemo(() => {
    const fromSearchObj =
      typeof location.search === "object" &&
      location.search !== null &&
      "patientId" in location.search &&
      typeof (location.search as { patientId?: string }).patientId === "string"
        ? (location.search as { patientId: string }).patientId
        : undefined;

    if (fromSearchObj) return fromSearchObj;

    const href = typeof location.href === "string" ? location.href : "";
    const qIndex = href.indexOf("?");
    if (qIndex >= 0) {
      return patientIdFromSearchString(href.slice(qIndex));
    }

    return patientIdFromSearchString(location.searchStr ?? "");
  }, [location.href, location.search, location.searchStr]);

  const lockedPatientId = explicitPatientId ?? routePatientId;
  const lockedPatient = lockedPatientId
    ? resolveDoctorPatient(lockedPatientId)
    : null;

  return {
    lockedPatientId,
    lockedPatientName: lockedPatient?.name,
    isLocked: Boolean(lockedPatientId),
  };
}
