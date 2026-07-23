/**
 * Unified localStorage + hospital_desk_records dual-write for all clinical desks.
 */
import {
  fetchDeskRecords,
  syncDeskRecords,
  shouldPreferRemoteDeskStore,
} from "@/lib/licensed-desk-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { DeskId } from "@/server/hospital-persistence";

export type PersistDesk = DeskId;

/** True when remote Supabase desk sync should run (dev + configured, or licensed prod). */
export function remotePersistenceEnabled(): boolean {
  if (!isSupabaseConfigured()) return false;
  if (shouldPreferRemoteDeskStore()) return true;
  return import.meta.env.DEV;
}

export function loadPersistedJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function savePersistedJson<T>(
  key: string,
  desk: PersistDesk,
  value: T,
  recordKey = key,
) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    /* quota / SSR */
  }
  if (remotePersistenceEnabled()) {
    void syncDeskRecords(desk, [
      { recordKey, payload: { value, savedAt: new Date().toISOString() } },
    ]);
  }
}

export async function hydratePersistedJson<T>(
  key: string,
  desk: PersistDesk,
  fallback: T,
  recordKey = key,
): Promise<T> {
  if (!remotePersistenceEnabled()) {
    return loadPersistedJson(key, fallback);
  }
  const remote = await fetchDeskRecords(desk);
  const hit = remote?.data?.find((r) => r.record_key === recordKey);
  if (hit?.payload && "value" in hit.payload) {
    const val = hit.payload.value as T;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(val));
    }
    return val;
  }
  return loadPersistedJson(key, fallback);
}

const ALL_DESKS: PersistDesk[] = [
  "reception",
  "lab",
  "pharmacy",
  "billing",
  "nursing",
  "admin",
  "doctor",
  "patient",
];

/** Pull all remote desk blobs into localStorage (call once after staff login). */
export async function hydrateAllDeskRecords(): Promise<{ hydrated: number }> {
  if (!remotePersistenceEnabled() || typeof window === "undefined") {
    return { hydrated: 0 };
  }
  let hydrated = 0;
  for (const desk of ALL_DESKS) {
    const remote = await fetchDeskRecords(desk);
    if (!remote?.data?.length) continue;
    for (const row of remote.data) {
      if (row.payload && "value" in row.payload) {
        localStorage.setItem(row.record_key, JSON.stringify(row.payload.value));
        hydrated += 1;
      }
    }
  }
  return { hydrated };
}

/** Desk assignment for shared store keys. */
export const STORE_DESK: Record<string, PersistDesk> = {
  "medora-encounters-v1": "billing",
  "medora-billing-ledger-invoices-v1": "billing",
  "medora-billing-ledger-payments-v1": "billing",
  "medora-shared-vitals-v1": "nursing",
  "medora-nursing-vitals-v1": "nursing",
  "medora-lab-results-v1": "lab",
  "medora-lab-catalog-v1": "lab",
  "medora-lab-desk-state-v1": "lab",
  "medora-clinic-queue-v1": "reception",
  "medora-patient-registry-v1": "reception",
  "medora-reception-appointments-v1": "reception",
  "medora-reception-preauths-v1": "reception",
  "medora-reception-beds-v1": "reception",
  "medora-reception-admissions-v1": "reception",
  "medora-announcements-v1": "reception",
  "medora-consult-fees-v1": "reception",
  "medora-clinical-event-log-v1": "reception",
  "medora-shared-leave-v1": "reception",
  "medora-pharmacy-desk-state-v1": "pharmacy",
  "medora-admin-hospital-v1": "admin",
  "medora-admin-branches-v1": "admin",
  "medora-admin-departments-v1": "admin",
  "medora-master-icd-v1": "admin",
  "medora-master-investigations-v1": "admin",
  "medora-master-referring-doctors-v1": "admin",
  "medora-master-vaccine-schedule-v1": "admin",
  "medora-master-advise-v1": "admin",
  "medora-master-address-book-v1": "admin",
  "medora-master-patient-reminders-v1": "admin",
  "medora-master-comms-templates-v1": "admin",
  "medora-doctor-sent-rx-v1": "doctor",
  "medora-doctor-rx-templates-v1": "doctor",
  "medora-doctor-rx-drafts-v1": "doctor",
  "medora-patient-notifications-v1": "patient",
  "medora_patient_prescriptions_v1": "patient",
};

export function deskForKey(key: string, fallback: PersistDesk = "reception"): PersistDesk {
  return STORE_DESK[key] ?? fallback;
}
