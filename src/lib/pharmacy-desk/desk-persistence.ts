import {
  hydratePersistedJson,
  loadPersistedJson,
  savePersistedJson,
} from "@/lib/shared/persisted-store";
import { invoiceFromRx, type PharmacyInvoice } from "./billing";
import { loadFormulary } from "./formulary";
import {
  PATIENTS,
  SEED_CONTROLLED,
  SEED_MOVEMENTS,
  SEED_PRESCRIPTIONS,
  SEED_REFILLS,
  SEED_WARD_ORDERS,
  SEED_ALERTS,
  STOCK_BATCHES,
  SEED_RETURNS,
  type Prescription,
  type RefillRequest,
  type StockBatch,
  type StockMovement,
  type ControlledEntry,
  type WardOrder,
  type PharmacyAlert,
  type WalkInItem,
  type WardReturn,
} from "./mockData";
import { SEED_PURCHASE_ORDERS, SEED_GRNS, type PurchaseOrder, type GRN } from "./purchaseOrdersData";
import { getPatient } from "./utils";

export const PHARMACY_DESK_STATE_KEY = "medora-pharmacy-desk-state-v1";

export interface DDIOverrideEntry {
  id: string;
  drugA: string;
  drugB: string;
  severity: "major" | "moderate" | "minor";
  pharmacistId: string;
  timestamp: string;
  rxRef: string;
  reason: string;
}

export interface WastageEntry {
  id: string;
  drugName: string;
  drugCategory: string;
  batchId: string;
  qty: number;
  reason: string;
  disposalMethod: "Incineration" | "Pharmacy bin" | "Return to supplier";
  processedBy: string;
  processedAt: string;
  cost: number;
}

export interface ControlledSubstanceReconciliation {
  drugName: string;
  openingBalance: number;
  totalDispensed: number;
  closingBalance: number;
  expectedBalance: number;
  variance: number;
}

export interface ShiftReport {
  id: string;
  signedAt: string;
  pharmacistName: string;
  supervisorName: string;
  notes: string;
  rxCount: number;
  priorityBreakdown: { stat: number; urgent: number; routine: number };
  lineItemsCount: number;
  avgDispenseTime: string;
  reconciliation: ControlledSubstanceReconciliation[];
  otcTotal: number;
  otcBreakdown: { cash: number; card: number; upi: number };
  ddiOverridesCount: number;
  nearExpiryActioned: number;
  coldChainBreaches: number;
  wastageValue: number;
  wardReturnsCount: number;
}

export interface ColdChainBreachEntry {
  id: string;
  loggedAt: string;
  loggedBy: string;
  unit: string;
  tempReading: string;
  expectedRange: string;
  acknowledgedBy: string;
  correctiveAction: string;
  affectedBatchIds: string[];
  status: "open" | "resolved";
  resolvedAt?: string;
}

export type PharmacyDeskSnapshot = {
  batches: StockBatch[];
  prescriptions: Prescription[];
  refills: RefillRequest[];
  movements: StockMovement[];
  controlled: ControlledEntry[];
  wardOrders: WardOrder[];
  alerts: PharmacyAlert[];
  walkInSales: WalkInItem[];
  invoices: PharmacyInvoice[];
  ddiOverrides: DDIOverrideEntry[];
  returns: WardReturn[];
  wastage: WastageEntry[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  shiftReports: ShiftReport[];
  coldChainBreachesList: ColdChainBreachEntry[];
};

function buildSeedInvoices(): PharmacyInvoice[] {
  const drugs = loadFormulary();
  return SEED_PRESCRIPTIONS.map((rx, i) => {
    const p = getPatient(rx, PATIENTS);
    return invoiceFromRx(rx, p?.name ?? "Unknown", p?.mrn ?? "—", 10040 + i, drugs);
  });
}

const SEED_SHIFT_REPORTS: ShiftReport[] = [
  {
    id: "rep-1",
    signedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    pharmacistName: "Riley Chen",
    supervisorName: "Dr. Elena Vasquez",
    notes: "Everything ran smoothly during the morning shift. Controlled counts reconciled perfectly.",
    rxCount: 14,
    priorityBreakdown: { stat: 2, urgent: 4, routine: 8 },
    lineItemsCount: 22,
    avgDispenseTime: "4.8 mins",
    reconciliation: [
      {
        drugName: "Oxycodone 5 mg",
        openingBalance: 40,
        totalDispensed: 12,
        closingBalance: 28,
        expectedBalance: 28,
        variance: 0,
      },
    ],
    otcTotal: 145.5,
    otcBreakdown: { cash: 60, card: 85.5, upi: 0 },
    ddiOverridesCount: 1,
    nearExpiryActioned: 3,
    coldChainBreaches: 0,
    wastageValue: 24.5,
    wardReturnsCount: 2,
  },
];

const SEED_COLD_CHAIN: ColdChainBreachEntry[] = [
  {
    id: "ccb-1",
    loggedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    loggedBy: "Riley Chen",
    unit: "FRIDGE-1",
    tempReading: "11°C",
    expectedRange: "2–8°C",
    acknowledgedBy: "Riley Chen",
    correctiveAction:
      "Technician called. Door seal replaced. Affected stock moved to FRIDGE-2 during repair.",
    affectedBatchIds: ["b4", "b8"],
    status: "resolved",
    resolvedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

export function defaultPharmacyDeskSnapshot(): PharmacyDeskSnapshot {
  return {
    batches: STOCK_BATCHES,
    prescriptions: SEED_PRESCRIPTIONS,
    refills: SEED_REFILLS,
    movements: SEED_MOVEMENTS,
    controlled: SEED_CONTROLLED,
    wardOrders: SEED_WARD_ORDERS,
    alerts: SEED_ALERTS,
    walkInSales: [],
    invoices: buildSeedInvoices(),
    ddiOverrides: [],
    returns: SEED_RETURNS,
    wastage: [],
    purchaseOrders: SEED_PURCHASE_ORDERS,
    grns: SEED_GRNS,
    shiftReports: SEED_SHIFT_REPORTS,
    coldChainBreachesList: SEED_COLD_CHAIN,
  };
}

export function loadPharmacyDeskSnapshot(): PharmacyDeskSnapshot {
  return loadPersistedJson(PHARMACY_DESK_STATE_KEY, defaultPharmacyDeskSnapshot());
}

export function savePharmacyDeskSnapshot(snapshot: PharmacyDeskSnapshot) {
  savePersistedJson(PHARMACY_DESK_STATE_KEY, "pharmacy", snapshot);
}

export async function hydratePharmacyDeskSnapshot(): Promise<PharmacyDeskSnapshot> {
  return hydratePersistedJson(PHARMACY_DESK_STATE_KEY, "pharmacy", defaultPharmacyDeskSnapshot());
}
