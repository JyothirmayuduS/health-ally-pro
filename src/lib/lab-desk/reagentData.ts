export interface Reagent {
  id: string;
  name: string;
  instrument: string; // e.g. "Sysmex XN-550", "Cobas C311", "Manual"
  lotNumber: string;
  expiryDate: string;
  testsRemaining: number;
  maxTests: number;
  openedOn?: string;
  stabilityDays?: number;
  testCodes: string[]; // e.g. ["cbc", "glu", "hb", "inr"] to map tests to reagents
}

export const SEED_REAGENTS: Reagent[] = [
  {
    id: "REG-001",
    name: "Sysmex Cellpack DCL Diluent",
    instrument: "Sysmex XN-550",
    lotNumber: "LOT-DCL-992",
    expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    testsRemaining: 350,
    maxTests: 500,
    openedOn: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 60,
    testCodes: ["cbc", "hb"],
  },
  {
    id: "REG-002",
    name: "Sysmex Lysercell WDF Lyse",
    instrument: "Sysmex XN-550",
    lotNumber: "LOT-WDF-441",
    expiryDate: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    testsRemaining: 180,
    maxTests: 300,
    openedOn: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 45,
    testCodes: ["cbc"],
  },
  {
    id: "REG-003",
    name: "Cobas C311 Glucose Assay Kit",
    instrument: "Cobas C311",
    lotNumber: "LOT-GLU-C82",
    expiryDate: new Date(Date.now() + 240 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    testsRemaining: 15, // Low (< 20% of 100)
    maxTests: 100,
    openedOn: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 30,
    testCodes: ["glu", "glucose"],
  },
  {
    id: "REG-004",
    name: "Thromboplastin-S PT/INR Reagent",
    instrument: "Manual Clotter",
    lotNumber: "LOT-PT-225",
    expiryDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().slice(0, 10), // Expired!
    testsRemaining: 50,
    maxTests: 150,
    openedOn: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 14,
    testCodes: ["inr"],
  },
  {
    id: "REG-005",
    name: "Multistix 10SG Urine Dipsticks",
    instrument: "Manual",
    lotNumber: "LOT-MSX-801",
    expiryDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    testsRemaining: 85,
    maxTests: 100,
    openedOn: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 90,
    testCodes: ["urinalysis", "ua"],
  },
  {
    id: "REG-006",
    name: "Cobas HbA1c Hemolysis Reagent",
    instrument: "Cobas C311",
    lotNumber: "LOT-HBA1C-01",
    expiryDate: new Date(Date.now() + 150 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    testsRemaining: 0, // Out of stock!
    maxTests: 100,
    openedOn: new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 30,
    testCodes: ["hba1c"],
  },
  {
    id: "REG-007",
    name: "CSF Protein Pyrogallol Kit",
    instrument: "Manual",
    lotNumber: "LOT-CSF-662",
    expiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10), // Expiring in 7 days
    testsRemaining: 40,
    maxTests: 50,
    openedOn: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    stabilityDays: 10,
    testCodes: ["csf_wbc"],
  },
];
