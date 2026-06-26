/** Condition-aware lab panels — what doctors actually order in clinic */
export type LabOrderSet = {
  id: string;
  label: string;
  hint: string;
  codes: string[];
  conditions?: string[];
};

export const LAB_ORDER_SETS: LabOrderSet[] = [
  {
    id: "annual",
    label: "Annual panel",
    hint: "CBC, metabolic, lipids",
    codes: ["CBC", "BMP", "LIPID"],
    conditions: ["Hypertension", "Diabetes"],
  },
  {
    id: "diabetes",
    label: "Diabetes follow-up",
    hint: "HbA1c, renal, lipids",
    codes: ["HBA1C", "BMP", "LIPID", "UA"],
    conditions: ["Diabetes"],
  },
  {
    id: "cardiac",
    label: "Cardiac risk",
    hint: "Lipids, metabolic, CBC",
    codes: ["LIPID", "BMP", "CBC"],
    conditions: ["Hypertension", "Cardiac"],
  },
  {
    id: "acute",
    label: "Acute workup",
    hint: "CBC, metabolic, urinalysis",
    codes: ["CBC", "BMP", "UA"],
    conditions: ["Asthma"],
  },
  {
    id: "thyroid",
    label: "Thyroid panel",
    hint: "TFT screening",
    codes: ["TFT"],
  },
];

export function suggestedOrderSets(condition: string): LabOrderSet[] {
  const matched = LAB_ORDER_SETS.filter(
    (set) => set.conditions?.some((c) => condition.toLowerCase().includes(c.toLowerCase())),
  );
  if (matched.length > 0) return matched;
  return LAB_ORDER_SETS.slice(0, 2);
}
