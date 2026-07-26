import {
  hydratePersistedJson,
  loadPersistedJson,
  savePersistedJson,
} from "@/lib/shared/persisted-store";
import { SEED_ORDERS, type LabOrder } from "./mockData";
import { SEED_QC_RUNS, type QCRun } from "./qcData";
import { SEED_REAGENTS, type Reagent } from "./reagentData";
import type { LabInvoice } from "./billing";

export const LAB_DESK_STATE_KEY = "medora-lab-desk-state-v1";

export interface CriticalValueNotification {
  id: string;
  orderId: string;
  patientId: string;
  doctorId: string;
  parameters: {
    parameterName: string;
    value: string;
    unit: string;
    threshold: string;
    direction: "low" | "high";
  }[];
  notifiedBy: string;
  notifiedPerson: string;
  method: string;
  notes?: string;
  notifiedAt: string;
  acknowledgedAt: string | null;
  status: "pending_ack" | "acknowledged";
}

export interface Aliquot {
  id: string;
  parentAccession: string;
  volume: number;
  containerType: string;
  destination: string;
  createdAt: string;
  status: "active" | "disposed";
}

export interface LabShiftReport {
  id: string;
  date: string;
  shift: "morning" | "afternoon" | "night";
  technicianName: string;
  supervisorName?: string;
  handoverNotes?: string;
  throughput: {
    received: number;
    stat: number;
    urgent: number;
    routine: number;
    completed: number;
    pending: number;
    tatComplianceRate: number;
  };
  quality: {
    qcPass: number;
    qcWarning: number;
    qcFail: number;
    criticalAlertsCount: number;
    deltaFailuresCount: number;
  };
  integrity: {
    rejectedCollection: number;
    rejectedReception: number;
    storedCount: number;
  };
  reagents: {
    lowOrExpiredCount: number;
    blockedTestsCount: number;
  };
  status: "draft" | "signed";
  signedAt?: string;
}

export type LabDeskSnapshot = {
  orders: LabOrder[];
  invoices: LabInvoice[];
  criticalNotifications: CriticalValueNotification[];
  qcRuns: QCRun[];
  qcLocks: string[];
  reagents: Reagent[];
  aliquots: Aliquot[];
  labShiftReports: LabShiftReport[];
};

const SEED_CRITICAL: CriticalValueNotification[] = [
  {
    id: "CRIT-001",
    orderId: "ORD-101",
    patientId: "P-101",
    doctorId: "DOC-202",
    parameters: [
      {
        parameterName: "Potassium",
        value: "6.8",
        unit: "mmol/L",
        threshold: ">= 6.5",
        direction: "high",
      },
    ],
    notifiedBy: "Dr. Rajan",
    notifiedPerson: "Dr. Mehta",
    method: "Phone",
    notifiedAt: new Date().toISOString(),
    acknowledgedAt: null,
    status: "pending_ack",
  },
];

const SEED_ALIQUOTS: Aliquot[] = [
  {
    id: "ALQ-001",
    parentAccession: "ACC-2025-001",
    volume: 2.5,
    containerType: "Microtube",
    destination: "Storage Rack A",
    createdAt: new Date().toISOString(),
    status: "active",
  },
];

const SEED_SHIFT_REPORTS: LabShiftReport[] = [
  {
    id: "LSR-001",
    date: new Date().toISOString().slice(0, 10),
    shift: "morning",
    technicianName: "J. Mensah",
    supervisorName: "Dr. Rajan",
    throughput: {
      received: 12,
      stat: 2,
      urgent: 4,
      routine: 6,
      completed: 8,
      pending: 4,
      tatComplianceRate: 92,
    },
    quality: { qcPass: 3, qcWarning: 0, qcFail: 0, criticalAlertsCount: 1, deltaFailuresCount: 0 },
    integrity: { rejectedCollection: 0, rejectedReception: 0, storedCount: 5 },
    reagents: { lowOrExpiredCount: 1, blockedTestsCount: 0 },
    status: "draft",
  },
];

export function defaultLabDeskSnapshot(): LabDeskSnapshot {
  return {
    orders: SEED_ORDERS,
    invoices: [],
    criticalNotifications: SEED_CRITICAL,
    qcRuns: SEED_QC_RUNS,
    qcLocks: [],
    reagents: SEED_REAGENTS,
    aliquots: SEED_ALIQUOTS,
    labShiftReports: SEED_SHIFT_REPORTS,
  };
}

export function loadLabDeskSnapshot(): LabDeskSnapshot {
  return loadPersistedJson(LAB_DESK_STATE_KEY, defaultLabDeskSnapshot());
}

export function saveLabDeskSnapshot(snapshot: LabDeskSnapshot) {
  savePersistedJson(LAB_DESK_STATE_KEY, "lab", snapshot);
}

export async function hydrateLabDeskSnapshot(): Promise<LabDeskSnapshot> {
  return hydratePersistedJson(LAB_DESK_STATE_KEY, "lab", defaultLabDeskSnapshot());
}

export const LAB_DESK_HYDRATED_EVENT = "medora-desk-hydrated";
