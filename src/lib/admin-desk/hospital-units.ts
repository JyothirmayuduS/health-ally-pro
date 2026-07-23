/** Hospital support units — blood bank, CSSD, ambulance, dialysis, mortuary, biomedical */

export type HospitalUnitId =
  | "blood_bank"
  | "cssd"
  | "ambulance"
  | "icu_board"
  | "dialysis"
  | "mortuary"
  | "biomedical"
  | "cath_lab"
  | "chemo_daycare"
  | "physio";

export type UnitRecord = {
  id: string;
  unitId: HospitalUnitId;
  title: string;
  status: string;
  detail: string;
  meta?: string;
  priority?: "routine" | "urgent" | "stat";
  updatedAt: string;
};

const STORAGE_KEY = "medora-hospital-units-v1";
const EVENT = "medora-hospital-units-updated";

export const HOSPITAL_UNITS: {
  id: HospitalUnitId;
  name: string;
  description: string;
  statuses: string[];
}[] = [
  {
    id: "blood_bank",
    name: "Blood bank",
    description: "Units, cross-match, issue & discard",
    statuses: ["Available", "Reserved", "Cross-matched", "Issued", "Discarded", "Low stock"],
  },
  {
    id: "cssd",
    name: "CSSD / Sterile supply",
    description: "Sets, sterilization cycles & OT trays",
    statuses: ["Dirty", "Washing", "Sterilizing", "Sterile", "Issued to OT", "Expired"],
  },
  {
    id: "ambulance",
    name: "Ambulance / EMS",
    description: "Fleet, trips, GPS status & handover",
    statuses: ["Available", "Dispatched", "On scene", "En route hospital", "At bay", "Maintenance"],
  },
  {
    id: "icu_board",
    name: "ICU board",
    description: "Beds, acuity, vents & isolation",
    statuses: ["Empty", "Occupied", "Reserved", "Cleaning", "Blocked"],
  },
  {
    id: "dialysis",
    name: "Dialysis unit",
    description: "Stations, sessions & access",
    statuses: ["Free", "In session", "Turnover", "Machine fault", "Isolation"],
  },
  {
    id: "mortuary",
    name: "Mortuary",
    description: "Body receipt, storage & release",
    statuses: ["Received", "In cold storage", "Autopsy pending", "Released", "Unclaimed"],
  },
  {
    id: "biomedical",
    name: "Biomedical engineering",
    description: "Equipment AMC, downtime & calibration",
    statuses: ["Operational", "Under AMC", "Breakdown", "Calibration due", "Retired"],
  },
  {
    id: "cath_lab",
    name: "Cath lab",
    description: "Angio slots, PCI & device implants",
    statuses: ["Idle", "Case running", "Turnover", "Emergency hold", "Maintenance"],
  },
  {
    id: "chemo_daycare",
    name: "Chemo day-care",
    description: "Chairs, regimens & pre-med checks",
    statuses: ["Scheduled", "Pre-med", "Infusing", "Observation", "Discharged", "Deferred"],
  },
  {
    id: "physio",
    name: "Physiotherapy",
    description: "Sessions, modalities & home plans",
    statuses: ["Booked", "In session", "Completed", "No-show", "Home program"],
  },
];

function seed(): UnitRecord[] {
  const ts = new Date().toISOString();
  return [
    {
      id: "bb1",
      unitId: "blood_bank",
      title: "PRBC O+ · 2 units",
      status: "Available",
      detail: "Bag #B-4412 · Expiry 12 days",
      meta: "Fridge A2",
      priority: "routine",
      updatedAt: ts,
    },
    {
      id: "bb2",
      unitId: "blood_bank",
      title: "Platelets AB+",
      status: "Low stock",
      detail: "1 unit left · reorder raised",
      meta: "Fridge B1",
      priority: "urgent",
      updatedAt: ts,
    },
    {
      id: "bb3",
      unitId: "blood_bank",
      title: "Cross-match · Arjun Kapoor",
      status: "Cross-matched",
      detail: "PRBC A+ · Surgery OT-2 14:00",
      priority: "stat",
      updatedAt: ts,
    },
    {
      id: "cs1",
      unitId: "cssd",
      title: "Ortho major set #12",
      status: "Sterile",
      detail: "Autoclave cycle OK · indicator pass",
      meta: "Shelf C3",
      updatedAt: ts,
    },
    {
      id: "cs2",
      unitId: "cssd",
      title: "Laparoscopy tray",
      status: "Sterilizing",
      detail: "Cycle ends 16:20",
      updatedAt: ts,
    },
    {
      id: "cs3",
      unitId: "cssd",
      title: "Delivery set",
      status: "Issued to OT",
      detail: "L&D · Midwife station",
      updatedAt: ts,
    },
    {
      id: "am1",
      unitId: "ambulance",
      title: "ALS-01 · KA-01-MX-2211",
      status: "Available",
      detail: "Driver: Ramesh · Paramedic on board",
      meta: "Bay 1",
      updatedAt: ts,
    },
    {
      id: "am2",
      unitId: "ambulance",
      title: "BLS-02 · Trip #884",
      status: "En route hospital",
      detail: "Trauma pickup · ETA 9 min",
      priority: "stat",
      updatedAt: ts,
    },
    {
      id: "icu1",
      unitId: "icu_board",
      title: "ICU-03",
      status: "Occupied",
      detail: "Vent · Norad · Isolation droplet",
      meta: "SOFA 9",
      priority: "urgent",
      updatedAt: ts,
    },
    {
      id: "icu2",
      unitId: "icu_board",
      title: "ICU-07",
      status: "Empty",
      detail: "Cleaned · ready",
      updatedAt: ts,
    },
    {
      id: "icu3",
      unitId: "icu_board",
      title: "HDU-02",
      status: "Occupied",
      detail: "Post-PCI · monitored",
      updatedAt: ts,
    },
    {
      id: "dx1",
      unitId: "dialysis",
      title: "Station 4 · Suresh N.",
      status: "In session",
      detail: "HD · 2h remaining · AVF left",
      updatedAt: ts,
    },
    {
      id: "dx2",
      unitId: "dialysis",
      title: "Station 1",
      status: "Free",
      detail: "Next: 15:00 reserved",
      updatedAt: ts,
    },
    {
      id: "mt1",
      unitId: "mortuary",
      title: "Case M-209",
      status: "In cold storage",
      detail: "MLC pending police release",
      priority: "urgent",
      updatedAt: ts,
    },
    {
      id: "bm1",
      unitId: "biomedical",
      title: "Ventilator Drager V500 #8",
      status: "Calibration due",
      detail: "ICU · due in 3 days",
      priority: "urgent",
      updatedAt: ts,
    },
    {
      id: "bm2",
      unitId: "biomedical",
      title: "C-arm Siemens",
      status: "Operational",
      detail: "OT-1 · AMC valid",
      updatedAt: ts,
    },
    {
      id: "cl1",
      unitId: "cath_lab",
      title: "Cath Lab 1",
      status: "Case running",
      detail: "Primary PCI · Door-to-balloon tracking",
      priority: "stat",
      updatedAt: ts,
    },
    {
      id: "ch1",
      unitId: "chemo_daycare",
      title: "Chair 6 · Cycle 3 FOLFOX",
      status: "Infusing",
      detail: "Pre-med given · ANC OK",
      updatedAt: ts,
    },
    {
      id: "pt1",
      unitId: "physio",
      title: "Post-TKR · Room Gym-A",
      status: "Booked",
      detail: "14:30 · ROM + gait",
      updatedAt: ts,
    },
  ];
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function loadUnitRecords(): UnitRecord[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as UnitRecord[];
  } catch {
    return seed();
  }
}

export function saveUnitRecords(records: UnitRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  emit();
  void import("@/lib/specialties/remote-sync").then(({ syncUnitsToRemote }) =>
    syncUnitsToRemote(records).catch(() => undefined),
  );
}

export function subscribeUnitRecords(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function updateUnitStatus(id: string, status: string) {
  const list = loadUnitRecords().map((r) =>
    r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r,
  );
  saveUnitRecords(list);
}

export async function hydrateUnitRecordsFromRemote() {
  const { fetchUnitsFromRemote, syncUnitsToRemote } = await import("@/lib/specialties/remote-sync");
  const remote = await fetchUnitsFromRemote();
  if (remote && remote.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    emit();
    return remote;
  }
  const local = loadUnitRecords();
  await syncUnitsToRemote(local).catch(() => undefined);
  const again = await fetchUnitsFromRemote();
  if (again && again.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(again));
    emit();
    return again;
  }
  return local;
}

export function addUnitRecord(input: Omit<UnitRecord, "id" | "updatedAt">) {
  const list = loadUnitRecords();
  const rec: UnitRecord = {
    ...input,
    id: `U-${Date.now().toString(36)}`,
    updatedAt: new Date().toISOString(),
  };
  saveUnitRecords([rec, ...list]);
  return rec;
}
