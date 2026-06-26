import type { LabCatalogItem, LabOrder } from "./mockData";

export type SpecimenMeta = {
  tube: string;
  sample_type: string;
  volume_ml: number;
  storage_rack: string;
  storage_slot: string;
  temp: "Room" | "2–8 °C" | "Frozen";
  condition: "Acceptable" | "Hemolyzed" | "Lipemic";
};

const TUBE_VISUAL: Record<string, { cap: string; ring: string; label: string }> = {
  Lavender: { cap: "bg-plum", ring: "border-plum", label: "EDTA" },
  "Gold (SST)": { cap: "bg-mustard", ring: "border-mustard", label: "SST" },
  "Green (Lithium Heparin)": { cap: "bg-teal", ring: "border-teal", label: "Li-Hep" },
  Yellow: { cap: "bg-mustard", ring: "border-mustard", label: "ACD" },
};

export function tubeVisual(tube: string) {
  return TUBE_VISUAL[tube] ?? { cap: "bg-ink-400", ring: "border-ink-400", label: "Tube" };
}

function rackFromAccession(accession: string) {
  const n = accession.replace(/\D/g, "");
  const num = parseInt(n.slice(-3) || "1", 10);
  const rack = String.fromCharCode(65 + (num % 4));
  const slot = (num % 12) + 1;
  return { rack: `Rack ${rack}`, slot: `${slot}` };
}

export function buildSpecimenMeta(order: LabOrder, catalog?: LabCatalogItem | null): SpecimenMeta {
  const tube = catalog?.tube ?? "Lavender";
  const { rack, slot } = rackFromAccession(order.accession);
  const needsCold = catalog?.sample_type?.toLowerCase().includes("serum") ?? false;
  const isUa = order.test_code === "UA";

  return {
    tube,
    sample_type: catalog?.sample_type ?? "Whole blood",
    volume_ml: isUa ? 10 : tube.includes("Gold") ? 5 : 4,
    storage_rack: rack,
    storage_slot: slot,
    temp: isUa ? "Room" : needsCold ? "2–8 °C" : "Room",
    condition: "Acceptable",
  };
}

export function getSpecimenMeta(order: LabOrder, catalog?: LabCatalogItem | null): SpecimenMeta {
  if (order.specimen) return order.specimen;
  return buildSpecimenMeta(order, catalog);
}

/** Physical specimen exists after draw */
export function hasPhysicalSpecimen(order: LabOrder) {
  return order.status !== "ordered" && order.status !== "cancelled" && !!order.collected_at;
}

/** Results submitted to supervisor */
export function isSubmittedToSupervisor(order: LabOrder) {
  return order.status === "validation" || order.status === "validated";
}
