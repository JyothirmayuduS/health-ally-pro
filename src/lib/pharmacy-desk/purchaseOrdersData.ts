export interface POItem {
  drug_id: string;
  drug_name: string;
  qty_ordered: number;
  unit_cost: number;
}

export type POStatus =
  | "draft"
  | "submitted"
  | "partially-received"
  | "received"
  | "cancelled";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string;
  items: POItem[];
  notes?: string;
  status: POStatus;
  total_value: number;
}

export interface GRNItem {
  drug_id: string;
  drug_name: string;
  qty_ordered: number;
  qty_received: number;
  qty_damaged: number;
  condition: "Good" | "Damaged" | "Short expiry";
  batch_number: string;
  expiry_date: string;
}

export type GRNStatus = "complete" | "partial" | "discrepancy";

export interface GRN {
  id: string;
  grn_number: string;
  po_id: string;
  po_number: string;
  supplier_name: string;
  received_date: string;
  received_by: string;
  items: GRNItem[];
  status: GRNStatus;
}

export const SUPPLIERS = [
  "MedLine Pharma",
  "Sun Pharma Distributors",
  "Cipla Direct",
  "Apollo Pharmacy Wholesale",
  "Generic India Ltd",
];

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1",
    po_number: "PO-2025-001",
    supplier_name: "Sun Pharma Distributors",
    order_date: daysAgo(10),
    expected_delivery_date: daysAgo(5),
    notes: "Restock cardiovascular and metabolic drugs",
    status: "received",
    total_value: 360.0,
    items: [
      { drug_id: "drug-aml5", drug_name: "Amlodipine 5 mg", qty_ordered: 500, unit_cost: 0.12 },
      { drug_id: "drug-ato40", drug_name: "Atorvastatin 40 mg", qty_ordered: 1000, unit_cost: 0.30 },
    ],
  },
  {
    id: "po-2",
    po_number: "PO-2025-002",
    supplier_name: "Cipla Direct",
    order_date: daysAgo(6),
    expected_delivery_date: daysAgo(1),
    notes: "Urgent antibiotics replenishment",
    status: "partially-received",
    total_value: 290.0,
    items: [
      { drug_id: "drug-amx500", drug_name: "Amoxicillin 500 mg", qty_ordered: 500, unit_cost: 0.22 },
      { drug_id: "drug-azt250", drug_name: "Azithromycin 250 mg/5 mL", qty_ordered: 150, unit_cost: 1.20 },
    ],
  },
  {
    id: "po-3",
    po_number: "PO-2025-003",
    supplier_name: "MedLine Pharma",
    order_date: daysAgo(2),
    expected_delivery_date: daysAgo(-3),
    notes: "Routine cold chain and general stock replenishment",
    status: "submitted",
    total_value: 843.0,
    items: [
      { drug_id: "drug-ins100", drug_name: "Insulin Glargine 100 U/mL", qty_ordered: 25, unit_cost: 25.00 },
      { drug_id: "drug-par500", drug_name: "Paracetamol 500 mg", qty_ordered: 2000, unit_cost: 0.05 },
      { drug_id: "drug-ome20", drug_name: "Omeprazole 20 mg", qty_ordered: 300, unit_cost: 0.40 },
    ],
  },
];

export const SEED_GRNS: GRN[] = [
  {
    id: "grn-1",
    grn_number: "GRN-2025-001",
    po_id: "po-1",
    po_number: "PO-2025-001",
    supplier_name: "Sun Pharma Distributors",
    received_date: daysAgo(5),
    received_by: "Riley Chen",
    status: "complete",
    items: [
      {
        drug_id: "drug-aml5",
        drug_name: "Amlodipine 5 mg",
        qty_ordered: 500,
        qty_received: 500,
        qty_damaged: 0,
        condition: "Good",
        batch_number: "LOT-901",
        expiry_date: "2026-09-15",
      },
      {
        drug_id: "drug-ato40",
        drug_name: "Atorvastatin 40 mg",
        qty_ordered: 1000,
        qty_received: 1000,
        qty_damaged: 0,
        condition: "Good",
        batch_number: "LOT-445",
        expiry_date: "2026-11-20",
      },
    ],
  },
  {
    id: "grn-2",
    grn_number: "GRN-2025-002",
    po_id: "po-2",
    po_number: "PO-2025-002",
    supplier_name: "Cipla Direct",
    received_date: daysAgo(1),
    received_by: "Riley Chen",
    status: "discrepancy",
    items: [
      {
        drug_id: "drug-amx500",
        drug_name: "Amoxicillin 500 mg",
        qty_ordered: 500,
        qty_received: 480,
        qty_damaged: 20,
        condition: "Damaged",
        batch_number: "LOT-881B",
        expiry_date: "2026-03-15",
      },
      {
        drug_id: "drug-azt250",
        drug_name: "Azithromycin 250 mg/5 mL",
        qty_ordered: 150,
        qty_received: 150,
        qty_damaged: 0,
        condition: "Good",
        batch_number: "LOT-220B",
        expiry_date: "2026-05-12",
      },
    ],
  },
];
