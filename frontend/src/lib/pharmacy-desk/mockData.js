// Oakhaven Pharmacy Desk — seed data (Phase 1 spec, full)
// Drug master + rack/tray/slot locations + multi-batch FEFO stock + multi-line Rx
// + walk-in patients + refills + clinical interaction rules.

export const ZONES = {
  MAIN:        { id: "MAIN",        label: "Main formulary",  temp: "Room",    color: "sage"    },
  COLD_CHAIN:  { id: "COLD_CHAIN",  label: "Cold chain",      temp: "2–8 °C",  color: "sky"     },
  CONTROLLED:  { id: "CONTROLLED",  label: "Controlled cabinet", temp: "Room", color: "rose"    },
  OTC:         { id: "OTC",         label: "OTC shelf",       temp: "Room",    color: "amber"   },
};

// Aisle / rack / tray layout for the storage map view.
// Each rack has trays; each tray has slots (1..N).
export const STORE_LAYOUT = [
  { zone: "MAIN", aisle: "A", label: "Oral solids — Antibiotics",
    racks: [
      { rack: "A1", trays: 4, slots: 6 },
      { rack: "A2", trays: 4, slots: 6 },
    ],
  },
  { zone: "MAIN", aisle: "B", label: "Cardio · Metabolic · Lipids",
    racks: [
      { rack: "B1", trays: 4, slots: 6 },
      { rack: "B2", trays: 4, slots: 6 },
    ],
  },
  { zone: "MAIN", aisle: "C", label: "Analgesics · Respiratory · CNS",
    racks: [
      { rack: "C1", trays: 4, slots: 6 },
    ],
  },
  { zone: "OTC", aisle: "D", label: "OTC shelf",
    racks: [
      { rack: "D1", trays: 3, slots: 6 },
    ],
  },
  { zone: "COLD_CHAIN", aisle: "F", label: "Cold chain",
    racks: [
      { rack: "FRIDGE-1", trays: 3, slots: 4 },
      { rack: "FRIDGE-2", trays: 3, slots: 4 },
    ],
  },
  { zone: "CONTROLLED", aisle: "X", label: "Controlled cabinet",
    racks: [
      { rack: "CAB-1", trays: 2, slots: 4 },
    ],
  },
];

// Helper to build a location code
const loc = (zone, aisle, rack, tray, slot) => ({
  zone, aisle, rack, tray, slot,
  code: `${rack}-T${String(tray).padStart(2, "0")}-S${slot}`,
});

export const PATIENTS = [
  { id: "pt_01", mrn: "OAK-10421", name: "Aanya Sharma",     dob: "1992-03-14", sex: "F", weightKg: 58,  allergies: ["Penicillin"],   conditions: ["Sinusitis"],                phone: "+1 415-555-0102" },
  { id: "pt_02", mrn: "OAK-10488", name: "Marcus O'Donnell", dob: "1957-11-02", sex: "M", weightKg: 84,  allergies: ["Sulfa drugs"],  conditions: ["HTN", "Hyperlipidemia"],    phone: "+1 415-555-0118" },
  { id: "pt_03", mrn: "OAK-10502", name: "Priya Iyer",       dob: "1984-06-29", sex: "F", weightKg: 64,  allergies: [],               conditions: ["Type 2 DM"],                phone: "+1 415-555-0143" },
  { id: "pt_04", mrn: "OAK-10577", name: "Daniel Park",      dob: "2008-01-22", sex: "M", weightKg: 42,  allergies: ["NSAIDs"],       conditions: ["Asthma"],                   phone: "+1 415-555-0177" },
  { id: "pt_05", mrn: "OAK-10612", name: "Beatrice Volkov",  dob: "1973-09-09", sex: "F", weightKg: 71,  allergies: ["Codeine"],      conditions: ["Depression"],               phone: "+1 415-555-0181" },
  { id: "pt_06", mrn: "OAK-10650", name: "Jonas Eriksson",   dob: "1965-04-17", sex: "M", weightKg: 92,  allergies: [],               conditions: ["Lower back pain", "Warfarin therapy"], phone: "+1 415-555-0204" },
  { id: "pt_07", mrn: "OAK-10711", name: "Renata Costa",     dob: "1996-12-05", sex: "F", weightKg: 60,  allergies: ["Latex"],        conditions: ["Pregnancy T2"],             phone: "+1 415-555-0231", flags: ["pregnancy"] },
];

export const STAFF = [
  { id: "stf_doc_01", name: "Dr. Elena Marsh",  role: "doctor",     specialty: "Internal Medicine" },
  { id: "stf_doc_02", name: "Dr. Theo Akande",  role: "doctor",     specialty: "Family Practice" },
  { id: "stf_doc_03", name: "Dr. Mei Watanabe", role: "doctor",     specialty: "Cardiology" },
  { id: "stf_phm_01", name: "Riley Chen",       role: "pharmacist", specialty: "Lead Pharmacist" },
];

// Drug master + locations + batches + flags + interaction tags
export const INVENTORY = [
  {
    id: "drg_01",
    name: "Amoxicillin", generic: "Amoxicillin", brand: "Amoxil",
    form: "Capsule", strength: "500 mg", route: "PO",
    sku: "AMX-500", barcode: "8901234560011",
    rxRequired: true, controlled: null,
    flags: ["antibiotic"],
    interactionTags: ["penicillin"],
    pregnancyCategory: "B",
    location: loc("MAIN", "A", "A1", 1, 2),
    reorderLevel: 80, unitPrice: 0.42,
    supplier: "Cedarwood Pharma Supply",
    batches: [
      { lot: "AMX-7A21", qty: 142, expiry: "2026-08-15" },
      { lot: "AMX-7B04", qty: 60,  expiry: "2026-04-02" },
    ],
  },
  {
    id: "drg_02",
    name: "Lisinopril", generic: "Lisinopril", brand: "Zestril",
    form: "Tablet", strength: "10 mg", route: "PO",
    sku: "LIS-010", barcode: "8901234560028",
    rxRequired: true, controlled: null,
    flags: ["ace-inhibitor"],
    interactionTags: ["ace-inhibitor", "potassium-sparing"],
    pregnancyCategory: "D",
    location: loc("MAIN", "B", "B1", 1, 3),
    reorderLevel: 120, unitPrice: 0.18,
    supplier: "Northgate Generics",
    batches: [{ lot: "LIS-9C11", qty: 220, expiry: "2027-01-30" }],
  },
  {
    id: "drg_03",
    name: "Metformin", generic: "Metformin", brand: "Glucophage",
    form: "Tablet", strength: "500 mg", route: "PO",
    sku: "MET-500", barcode: "8901234560035",
    rxRequired: true, controlled: null,
    flags: ["antidiabetic"],
    interactionTags: ["metformin"],
    pregnancyCategory: "B",
    location: loc("MAIN", "B", "B2", 2, 1),
    reorderLevel: 150, unitPrice: 0.09,
    supplier: "Northgate Generics",
    batches: [
      { lot: "MET-3F88", qty: 95,  expiry: "2026-03-20" },
      { lot: "MET-3G02", qty: 180, expiry: "2027-06-10" },
    ],
  },
  {
    id: "drg_04",
    name: "Atorvastatin", generic: "Atorvastatin", brand: "Lipitor",
    form: "Tablet", strength: "20 mg", route: "PO",
    sku: "ATV-020", barcode: "8901234560042",
    rxRequired: true, controlled: null,
    flags: ["statin"],
    interactionTags: ["statin", "cyp3a4-substrate"],
    pregnancyCategory: "X",
    location: loc("MAIN", "B", "B2", 3, 4),
    reorderLevel: 100, unitPrice: 0.30,
    supplier: "Cedarwood Pharma Supply",
    batches: [{ lot: "ATV-2K77", qty: 30, expiry: "2026-02-28" }],
  },
  {
    id: "drg_05",
    name: "Salbutamol", generic: "Salbutamol", brand: "Ventolin",
    form: "Inhaler", strength: "100 mcg/dose", route: "INH",
    sku: "SAL-INH", barcode: "8901234560059",
    rxRequired: true, controlled: null,
    flags: ["bronchodilator"],
    interactionTags: ["beta-agonist"],
    pregnancyCategory: "C",
    location: loc("MAIN", "C", "C1", 1, 1),
    reorderLevel: 25, unitPrice: 6.80,
    supplier: "Bayline Respiratory",
    batches: [{ lot: "SAL-BX19", qty: 18, expiry: "2026-11-04" }],
  },
  {
    id: "drg_06",
    name: "Ibuprofen", generic: "Ibuprofen", brand: "Advil",
    form: "Tablet", strength: "400 mg", route: "PO",
    sku: "IBU-400", barcode: "8901234560066",
    rxRequired: false, controlled: null,
    flags: ["nsaid", "otc"],
    interactionTags: ["nsaid"],
    pregnancyCategory: "C/D",
    location: loc("OTC", "D", "D1", 1, 1),
    reorderLevel: 200, unitPrice: 0.06,
    supplier: "Northgate Generics",
    batches: [{ lot: "IBU-5R20", qty: 410, expiry: "2027-09-12" }],
  },
  {
    id: "drg_07",
    name: "Sertraline", generic: "Sertraline", brand: "Zoloft",
    form: "Tablet", strength: "50 mg", route: "PO",
    sku: "SER-050", barcode: "8901234560073",
    rxRequired: true, controlled: null,
    flags: ["ssri"],
    interactionTags: ["ssri", "serotonergic"],
    pregnancyCategory: "C",
    location: loc("MAIN", "C", "C1", 2, 3),
    reorderLevel: 60, unitPrice: 0.22,
    supplier: "Cedarwood Pharma Supply",
    batches: [{ lot: "SER-4D03", qty: 88, expiry: "2026-12-01" }],
  },
  {
    id: "drg_08",
    name: "Levothyroxine", generic: "Levothyroxine", brand: "Synthroid",
    form: "Tablet", strength: "50 mcg", route: "PO",
    sku: "LEV-050", barcode: "8901234560080",
    rxRequired: true, controlled: null,
    flags: ["thyroid"],
    interactionTags: ["levothyroxine"],
    pregnancyCategory: "A",
    location: loc("MAIN", "B", "B1", 3, 5),
    reorderLevel: 70, unitPrice: 0.12,
    supplier: "Northgate Generics",
    batches: [{ lot: "LEV-6P55", qty: 0, expiry: "2026-05-22" }],
  },
  {
    id: "drg_09",
    name: "Warfarin", generic: "Warfarin", brand: "Coumadin",
    form: "Tablet", strength: "5 mg", route: "PO",
    sku: "WAR-005", barcode: "8901234560097",
    rxRequired: true, controlled: null,
    flags: ["anticoagulant", "high-alert"],
    interactionTags: ["warfarin", "anticoagulant"],
    pregnancyCategory: "X",
    location: loc("MAIN", "B", "B1", 4, 2),
    reorderLevel: 40, unitPrice: 0.55,
    supplier: "Cedarwood Pharma Supply",
    batches: [{ lot: "WAR-1Q08", qty: 65, expiry: "2026-10-09" }],
  },
  {
    id: "drg_10",
    name: "Insulin Glargine", generic: "Insulin glargine", brand: "Lantus",
    form: "Pen injector", strength: "100 IU/ml", route: "SC",
    sku: "INS-GLA", barcode: "8901234560103",
    rxRequired: true, controlled: null,
    flags: ["biologic", "fridge"],
    interactionTags: ["insulin"],
    pregnancyCategory: "B",
    location: loc("COLD_CHAIN", "F", "FRIDGE-2", 1, 2),
    reorderLevel: 15, unitPrice: 38.00,
    supplier: "Bayline Biologics",
    batches: [{ lot: "INS-Y3T1", qty: 22, expiry: "2026-07-30" }],
  },
  {
    id: "drg_11",
    name: "Tramadol", generic: "Tramadol", brand: "Ultram",
    form: "Tablet", strength: "50 mg", route: "PO",
    sku: "TRA-050", barcode: "8901234560110",
    rxRequired: true, controlled: "IV",
    flags: ["opioid", "controlled"],
    interactionTags: ["opioid", "serotonergic"],
    pregnancyCategory: "C",
    location: loc("CONTROLLED", "X", "CAB-1", 1, 1),
    reorderLevel: 30, unitPrice: 0.65,
    supplier: "Cedarwood Pharma Supply",
    batches: [{ lot: "TRA-5N02", qty: 45, expiry: "2026-09-18" }],
  },
  {
    id: "drg_12",
    name: "Paracetamol", generic: "Paracetamol (Acetaminophen)", brand: "Panadol",
    form: "Tablet", strength: "500 mg", route: "PO",
    sku: "PAR-500", barcode: "8901234560127",
    rxRequired: false, controlled: null,
    flags: ["analgesic", "otc"],
    interactionTags: ["paracetamol"],
    pregnancyCategory: "B",
    location: loc("OTC", "D", "D1", 2, 1),
    reorderLevel: 300, unitPrice: 0.04,
    supplier: "Northgate Generics",
    batches: [{ lot: "PAR-9K42", qty: 520, expiry: "2027-04-22" }],
  },
];

// Multi-line Rx — most have one drug, a few have multiple (lipid + ACE; opioid + nsaid demo)
export const PRESCRIPTIONS = [
  {
    id: "rx_1001", rxNumber: "RX-2026-1001",
    patientId: "pt_01", prescribedByStaffId: "stf_doc_01",
    encounterId: "enc_5501", priority: "urgent", status: "new",
    paymentStatus: "unpaid", createdAt: isoMinutesAgo(8),
    items: [
      { drugId: "drg_01", medicationName: "Amoxicillin", dosage: "500 mg",
        frequency: "Three times daily", duration: "7 days", quantity: 21,
        instructions: "Take with food. Complete full course." },
    ],
    refillsAllowed: 0, refillsUsed: 0,
    notes: "Acute sinusitis. Pt reports penicillin allergy — verify before dispense.",
    history: [{ at: isoMinutesAgo(8), by: "Dr. Elena Marsh", action: "Prescription submitted" }],
  },
  {
    id: "rx_1002", rxNumber: "RX-2026-1002",
    patientId: "pt_02", prescribedByStaffId: "stf_doc_03",
    encounterId: "enc_5512", priority: "routine", status: "in_review",
    paymentStatus: "paid", createdAt: isoMinutesAgo(34),
    items: [
      { drugId: "drg_02", medicationName: "Lisinopril",   dosage: "10 mg", frequency: "Once daily",                    duration: "30 days", quantity: 30, instructions: "Take in the morning. Monitor BP." },
      { drugId: "drg_04", medicationName: "Atorvastatin", dosage: "20 mg", frequency: "Once daily at bedtime",         duration: "30 days", quantity: 30, instructions: "Take at night." },
    ],
    refillsAllowed: 5, refillsUsed: 1, notes: "Chronic management. Stable BP last visit.",
    history: [
      { at: isoMinutesAgo(34), by: "Dr. Mei Watanabe", action: "Prescription submitted" },
      { at: isoMinutesAgo(20), by: "Riley Chen",       action: "Opened for review" },
    ],
  },
  {
    id: "rx_1003", rxNumber: "RX-2026-1003",
    patientId: "pt_03", prescribedByStaffId: "stf_doc_02",
    encounterId: "enc_5520", priority: "routine", status: "ready_to_dispense",
    paymentStatus: "paid", createdAt: isoMinutesAgo(75),
    items: [
      { drugId: "drg_03", medicationName: "Metformin", dosage: "500 mg",
        frequency: "Twice daily with meals", duration: "30 days", quantity: 60,
        instructions: "Take with breakfast and dinner." },
    ],
    refillsAllowed: 5, refillsUsed: 0, notes: "Type 2 DM, new start.",
    history: [
      { at: isoMinutesAgo(75), by: "Dr. Theo Akande", action: "Prescription submitted" },
      { at: isoMinutesAgo(40), by: "Riley Chen",      action: "Reviewed — cleared" },
    ],
  },
  {
    id: "rx_1004", rxNumber: "RX-2026-1004",
    patientId: "pt_05", prescribedByStaffId: "stf_doc_01",
    encounterId: "enc_5535", priority: "routine", status: "dispensing",
    paymentStatus: "paid", createdAt: isoMinutesAgo(120),
    items: [
      { drugId: "drg_07", medicationName: "Sertraline", dosage: "50 mg",
        frequency: "Once daily", duration: "28 days", quantity: 28,
        instructions: "Take in the morning. Allow 2–4 weeks for full effect." },
      { drugId: "drg_11", medicationName: "Tramadol",   dosage: "50 mg",
        frequency: "Every 6 hours as needed", duration: "5 days", quantity: 20,
        instructions: "Max 4 doses per day. Counsel on drowsiness." },
    ],
    refillsAllowed: 3, refillsUsed: 0, notes: "Counsel on serotonergic combination risk.",
    history: [
      { at: isoMinutesAgo(120), by: "Dr. Elena Marsh", action: "Prescription submitted" },
      { at: isoMinutesAgo(90),  by: "Riley Chen",      action: "Reviewed — cleared" },
      { at: isoMinutesAgo(10),  by: "Riley Chen",      action: "Started dispense" },
    ],
  },
  {
    id: "rx_1005", rxNumber: "RX-2026-1005",
    patientId: "pt_06", prescribedByStaffId: "stf_doc_02",
    encounterId: "enc_5540", priority: "routine", status: "dispensed",
    paymentStatus: "paid", createdAt: isoMinutesAgo(240),
    items: [
      { drugId: "drg_06", medicationName: "Ibuprofen", dosage: "400 mg",
        frequency: "Every 6 hours as needed", duration: "5 days", quantity: 20,
        instructions: "Take with food. Max 4 doses per day." },
    ],
    refillsAllowed: 0, refillsUsed: 0, notes: "Pt on warfarin — INR caution noted by doctor.",
    dispensedAt: isoMinutesAgo(45), labelBatchLots: ["IBU-5R20"],
    history: [
      { at: isoMinutesAgo(240), by: "Dr. Theo Akande", action: "Prescription submitted" },
      { at: isoMinutesAgo(180), by: "Riley Chen",      action: "Reviewed — cleared" },
      { at: isoMinutesAgo(50),  by: "Riley Chen",      action: "Started dispense" },
      { at: isoMinutesAgo(45),  by: "Riley Chen",      action: "Dispensed · batch IBU-5R20" },
    ],
  },
  {
    id: "rx_1006", rxNumber: "RX-2026-1006",
    patientId: "pt_04", prescribedByStaffId: "stf_doc_03",
    encounterId: "enc_5544", priority: "urgent", status: "on_hold",
    paymentStatus: "unpaid", createdAt: isoMinutesAgo(95),
    items: [
      { drugId: "drg_05", medicationName: "Salbutamol", dosage: "100 mcg",
        frequency: "2 puffs as needed", duration: "30 days", quantity: 1,
        instructions: "Up to 4 times daily. Shake well." },
    ],
    refillsAllowed: 2, refillsUsed: 0, notes: "Hold — pending insurance auth.",
    history: [
      { at: isoMinutesAgo(95), by: "Dr. Mei Watanabe", action: "Prescription submitted" },
      { at: isoMinutesAgo(60), by: "Riley Chen",       action: "On hold — insurance auth pending" },
    ],
  },
  {
    id: "rx_1007", rxNumber: "RX-2026-1007",
    patientId: "pt_07", prescribedByStaffId: "stf_doc_01",
    encounterId: "enc_5560", priority: "routine", status: "new",
    paymentStatus: "unpaid", createdAt: isoMinutesAgo(20),
    items: [
      { drugId: "drg_04", medicationName: "Atorvastatin", dosage: "20 mg",
        frequency: "Once daily at bedtime", duration: "30 days", quantity: 30,
        instructions: "Take at night." },
    ],
    refillsAllowed: 5, refillsUsed: 0,
    notes: "Lipids elevated. Patient is pregnant T2 — confirm safety.",
    history: [{ at: isoMinutesAgo(20), by: "Dr. Elena Marsh", action: "Prescription submitted" }],
  },
];

export const REFILLS = [
  {
    id: "ref_2001", originalRxId: "rx_0901",
    patientId: "pt_02", drugSnapshot: { name: "Lisinopril", strength: "10 mg", form: "Tablet" },
    requestedAt: isoMinutesAgo(180), source: "patient_app",
    status: "pending", remainingRefills: 4, daysSupplyLeft: 3, autoRefillEligible: true,
  },
  {
    id: "ref_2002", originalRxId: "rx_0888",
    patientId: "pt_05", drugSnapshot: { name: "Sertraline", strength: "50 mg", form: "Tablet" },
    requestedAt: isoMinutesAgo(50), source: "phone",
    status: "pending", remainingRefills: 2, daysSupplyLeft: 6, autoRefillEligible: false,
  },
  {
    id: "ref_2003", originalRxId: "rx_0795",
    patientId: "pt_06", drugSnapshot: { name: "Metformin", strength: "500 mg", form: "Tablet" },
    requestedAt: isoMinutesAgo(900), source: "pharmacist",
    status: "approved", approvedAt: isoMinutesAgo(800),
    remainingRefills: 3, daysSupplyLeft: 0, autoRefillEligible: true,
  },
  {
    id: "ref_2004", originalRxId: "rx_0770",
    patientId: "pt_01", drugSnapshot: { name: "Amoxicillin", strength: "500 mg", form: "Capsule" },
    requestedAt: isoMinutesAgo(60), source: "patient_app",
    status: "denied", deniedReason: "Acute course — refer back to doctor",
    remainingRefills: 0, daysSupplyLeft: 0, autoRefillEligible: false,
  },
];

// Pinned favourite SKUs for the medicine search (high-volume)
export const FAVORITE_SKUS = ["AMX-500", "PAR-500", "IBU-400", "MET-500"];

export function isoMinutesAgo(min) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

export const SEED = {
  patients: PATIENTS,
  staff: STAFF,
  inventory: INVENTORY,
  prescriptions: PRESCRIPTIONS,
  refills: REFILLS,
  storeLayout: STORE_LAYOUT,
  zones: ZONES,
  favorites: FAVORITE_SKUS,
  version: 5,
};
