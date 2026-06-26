import type { Drug, DrugLocation, StockBatch } from "./mockData";

export function formatLocation(loc: DrugLocation) {
  const parts = [loc.aisle, loc.rack, loc.tray, `S${loc.slot}`];
  if (loc.shelf) parts.splice(3, 0, loc.shelf);
  return parts.join(" · ");
}

export function formatLocationShort(loc: DrugLocation) {
  return loc.location_code;
}

export function zoneLabel(zone: DrugLocation["zone"]) {
  const map: Record<DrugLocation["zone"], string> = {
    main: "Main formulary",
    cold: "Cold chain",
    controlled: "Controlled cabinet",
    otc: "OTC aisle",
  };
  return map[zone];
}

export function zoneColor(zone: DrugLocation["zone"]) {
  const map: Record<DrugLocation["zone"], string> = {
    main: "bg-sage-soft text-sage border-sage/30",
    cold: "bg-teal-soft text-teal border-teal/30",
    controlled: "bg-plum-soft text-plum border-plum/30",
    otc: "bg-mustard-soft text-mustard border-mustard/30",
  };
  return map[zone];
}

export function pickPathSteps(loc: DrugLocation) {
  return [
    { step: 1, label: "Aisle", value: loc.aisle },
    { step: 2, label: "Rack", value: loc.rack },
    { step: 3, label: "Tray", value: loc.tray },
    { step: 4, label: "Slot", value: `S${loc.slot}` },
  ];
}

export function fefoBatch(batches: StockBatch[]) {
  return [...batches]
    .filter((b) => b.status === "active" && b.qty > b.reserved_qty)
    .sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime())[0];
}

export function availableQty(batches: StockBatch[]) {
  return batches
    .filter((b) => b.status === "active")
    .reduce((sum, b) => sum + Math.max(0, b.qty - b.reserved_qty), 0);
}

export function totalQty(batches: StockBatch[]) {
  return batches.filter((b) => b.status === "active").reduce((sum, b) => sum + b.qty, 0);
}

export function isLowStock(drug: Drug, batches: StockBatch[]) {
  return availableQty(batches) <= drug.reorder_level;
}

export function daysUntilExpiry(expiry: string) {
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400_000);
}

export function expiryStatus(expiry: string) {
  const days = daysUntilExpiry(expiry);
  if (days < 0) return { level: "expired", label: "Expired", days };
  if (days <= 30) return { level: "critical", label: `${days}d left`, days };
  if (days <= 90) return { level: "warning", label: `${days}d left`, days };
  return { level: "ok", label: new Date(expiry).toLocaleDateString([], { month: "short", year: "numeric" }), days };
}

export type SearchHit = {
  drug: Drug;
  batches: StockBatch[];
  available: number;
  fefo?: StockBatch;
  lowStock: boolean;
  matchReason: string;
};

export function searchMedicines(
  query: string,
  drugs: Drug[],
  batches: StockBatch[],
  opts?: { zone?: DrugLocation["zone"]; inStockOnly?: boolean },
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const drug of drugs) {
    if (opts?.zone && drug.location.zone !== opts.zone) continue;

    const drugBatches = batches.filter((b) => b.drug_id === drug.id);
    const available = availableQty(drugBatches);
    if (opts?.inStockOnly && available <= 0) continue;

    const haystack = [
      drug.generic_name,
      ...drug.brand_names,
      drug.sku,
      drug.barcode,
      drug.strength,
      drug.form,
      drug.location.location_code,
      drug.location.rack,
      drug.location.tray,
      `${drug.location.rack}-${drug.location.tray}`,
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(q) && !fuzzyMatch(haystack, q)) continue;

    let matchReason = "Name match";
    if (drug.location.location_code.toLowerCase().includes(q)) matchReason = "Location code";
    else if (drug.barcode.includes(q)) matchReason = "Barcode";
    else if (drug.sku.toLowerCase().includes(q)) matchReason = "SKU";

    hits.push({
      drug,
      batches: drugBatches,
      available,
      fefo: fefoBatch(drugBatches),
      lowStock: isLowStock(drug, drugBatches),
      matchReason,
    });
  }

  return hits.sort((a, b) => {
    if (a.available !== b.available) return b.available - a.available;
    return a.drug.generic_name.localeCompare(b.drug.generic_name);
  });
}

function fuzzyMatch(text: string, q: string) {
  if (q.length < 3) return false;
  const words = q.split(/\s+/);
  return words.every((w) => text.includes(w.slice(0, Math.max(3, w.length - 1))));
}
