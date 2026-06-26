import type { Drug, StockBatch } from "./mockData";
import { DRUGS } from "./mockData";

export type GstRate = 0 | 5 | 12 | 18;

export const GST_OPTIONS: { value: GstRate; label: string }[] = [
  { value: 0, label: "0% (exempt)" },
  { value: 5, label: "5%" },
  { value: 12, label: "12%" },
  { value: 18, label: "18%" },
];

export type DrugPricingPatch = Partial<
  Pick<
    Drug,
    | "unit_price"
    | "purchase_cost"
    | "pack_size"
    | "pack_mrp"
    | "gst_rate"
    | "reorder_level"
    | "generic_name"
    | "strength"
    | "form"
    | "sku"
    | "barcode"
    | "brand_names"
    | "counseling"
  >
>;

export type ReceiveStockOptions = {
  purchaseCostPerUnit?: number;
  vendor?: string;
  poReference?: string;
};

const STORAGE_KEY = "medora-pharmacy-formulary-v1";

function defaultPackSize(form: string) {
  if (form === "Tablet" || form === "Capsule") return 10;
  if (form === "Injection") return 1;
  if (form === "Suspension") return 1;
  return 1;
}

function defaultGst(form: string, controlled?: string): GstRate {
  if (controlled) return 12;
  if (form === "Injection") return 5;
  return 5;
}

/** Ensure every drug has pricing + pack fields for formulary UI. */
export function normalizeDrug(drug: Drug): Drug {
  const pack_size = drug.pack_size ?? defaultPackSize(drug.form);
  const unit_price = drug.unit_price;
  const purchase_cost =
    drug.purchase_cost ?? Math.round(unit_price * 0.62 * 100) / 100;
  const pack_mrp = drug.pack_mrp ?? Math.round(unit_price * pack_size * 100) / 100;
  const gst_rate = drug.gst_rate ?? defaultGst(drug.form, drug.controlled_schedule);
  return {
    ...drug,
    pack_size,
    purchase_cost,
    pack_mrp,
    gst_rate,
  };
}

export function loadFormulary(): Drug[] {
  if (typeof window === "undefined") return DRUGS.map(normalizeDrug);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DRUGS.map(normalizeDrug);
    const parsed = JSON.parse(raw) as Drug[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DRUGS.map(normalizeDrug);
    return parsed.map(normalizeDrug);
  } catch {
    return DRUGS.map(normalizeDrug);
  }
}

export function saveFormulary(drugs: Drug[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drugs.map(normalizeDrug)));
}

export function marginPercent(selling: number, cost: number) {
  if (!cost || cost <= 0) return 0;
  return Math.round(((selling - cost) / cost) * 1000) / 10;
}

export function pricePerTablet(drug: Drug) {
  return drug.unit_price;
}

export function fmtMargin(drug: Drug) {
  return `${marginPercent(drug.unit_price, drug.purchase_cost)}%`;
}

export function weightedAvgCost(
  batches: StockBatch[],
  drugId: string,
  fallback: number,
): number {
  const active = batches.filter(
    (b) => b.drug_id === drugId && b.status === "active" && b.purchase_cost_per_unit != null,
  );
  if (!active.length) return fallback;
  const totalQty = active.reduce((s, b) => s + b.qty, 0);
  if (totalQty <= 0) return fallback;
  const totalCost = active.reduce(
    (s, b) => s + (b.purchase_cost_per_unit ?? 0) * b.qty,
    0,
  );
  return Math.round((totalCost / totalQty) * 100) / 100;
}

export function unitLabel(form: string) {
  if (form === "Tablet") return "per tablet";
  if (form === "Capsule") return "per capsule";
  if (form === "Suspension") return "per bottle";
  if (form === "Injection") return "per dose";
  return "per unit";
}
