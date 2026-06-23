// Mock seed data for Oakhaven Pharmacy Desk
// Mirrors the lab/reception mock pattern in the project spec.

export const PATIENTS = [
  { id: "pt_01", mrn: "OAK-10421", name: "Aanya Sharma",      dob: "1992-03-14", allergies: ["Penicillin"],          phone: "+1 415-555-0102" },
  { id: "pt_02", mrn: "OAK-10488", name: "Marcus O'Donnell",  dob: "1957-11-02", allergies: ["Sulfa drugs"],         phone: "+1 415-555-0118" },
  { id: "pt_03", mrn: "OAK-10502", name: "Priya Iyer",         dob: "1984-06-29", allergies: [],                      phone: "+1 415-555-0143" },
  { id: "pt_04", mrn: "OAK-10577", name: "Daniel Park",        dob: "2008-01-22", allergies: ["NSAIDs"],              phone: "+1 415-555-0177" },
  { id: "pt_05", mrn: "OAK-10612", name: "Beatrice Volkov",    dob: "1973-09-09", allergies: ["Codeine"],             phone: "+1 415-555-0181" },
  { id: "pt_06", mrn: "OAK-10650", name: "Jonas Eriksson",     dob: "1965-04-17", allergies: [],                      phone: "+1 415-555-0204" },
  { id: "pt_07", mrn: "OAK-10711", name: "Renata Costa",       dob: "1996-12-05", allergies: ["Latex"],               phone: "+1 415-555-0231" },
];

export const STAFF = [
  { id: "stf_doc_01", name: "Dr. Elena Marsh",   role: "doctor",      specialty: "Internal Medicine" },
  { id: "stf_doc_02", name: "Dr. Theo Akande",   role: "doctor",      specialty: "Family Practice" },
  { id: "stf_doc_03", name: "Dr. Mei Watanabe",  role: "doctor",      specialty: "Cardiology" },
  { id: "stf_phm_01", name: "Riley Chen",        role: "pharmacist",  specialty: "Lead Pharmacist" },
];

// Drug catalog + on-hand inventory (no Supabase table yet — fully mock)
export const INVENTORY = [
  {
    id: "drg_01",
    name: "Amoxicillin",
    form: "Capsule",
    strength: "500 mg",
    sku: "AMX-500",
    reorderLevel: 80,
    supplier: "Cedarwood Pharma Supply",
    batches: [
      { lot: "AMX-7A21", qty: 142, expiry: "2026-08-15" },
      { lot: "AMX-7B04", qty: 60,  expiry: "2026-04-02" },
    ],
  },
  {
    id: "drg_02",
    name: "Lisinopril",
    form: "Tablet",
    strength: "10 mg",
    sku: "LIS-010",
    reorderLevel: 120,
    supplier: "Northgate Generics",
    batches: [
      { lot: "LIS-9C11", qty: 220, expiry: "2027-01-30" },
    ],
  },
  {
    id: "drg_03",
    name: "Metformin",
    form: "Tablet",
    strength: "500 mg",
    sku: "MET-500",
    reorderLevel: 150,
    supplier: "Northgate Generics",
    batches: [
      { lot: "MET-3F88", qty: 95,  expiry: "2026-03-20" },
      { lot: "MET-3G02", qty: 180, expiry: "2027-06-10" },
    ],
  },
  {
    id: "drg_04",
    name: "Atorvastatin",
    form: "Tablet",
    strength: "20 mg",
    sku: "ATV-020",
    reorderLevel: 100,
    supplier: "Cedarwood Pharma Supply",
    batches: [
      { lot: "ATV-2K77", qty: 30, expiry: "2026-02-28" }, // low + near expiry
    ],
  },
  {
    id: "drg_05",
    name: "Salbutamol",
    form: "Inhaler",
    strength: "100 mcg",
    sku: "SAL-INH",
    reorderLevel: 25,
    supplier: "Bayline Respiratory",
    batches: [
      { lot: "SAL-BX19", qty: 18, expiry: "2026-11-04" },
    ],
  },
  {
    id: "drg_06",
    name: "Ibuprofen",
    form: "Tablet",
    strength: "400 mg",
    sku: "IBU-400",
    reorderLevel: 200,
    supplier: "Northgate Generics",
    batches: [
      { lot: "IBU-5R20", qty: 410, expiry: "2027-09-12" },
    ],
  },
  {
    id: "drg_07",
    name: "Sertraline",
    form: "Tablet",
    strength: "50 mg",
    sku: "SER-050",
    reorderLevel: 60,
    supplier: "Cedarwood Pharma Supply",
    batches: [
      { lot: "SER-4D03", qty: 88, expiry: "2026-12-01" },
    ],
  },
  {
    id: "drg_08",
    name: "Levothyroxine",
    form: "Tablet",
    strength: "50 mcg",
    sku: "LEV-050",
    reorderLevel: 70,
    supplier: "Northgate Generics",
    batches: [
      { lot: "LEV-6P55", qty: 0, expiry: "2026-05-22" }, // out of stock
    ],
  },
];

// Workflow statuses (mirror lab):
// new → in_review → ready_to_dispense → dispensing → dispensed → collected
// alt: on_hold / cancelled
export const PRESCRIPTIONS = [
  {
    id: "rx_1001",
    patientId: "pt_01",
    prescribedByStaffId: "stf_doc_01",
    encounterId: "enc_5501",
    priority: "urgent",
    status: "new",
    createdAt: isoMinutesAgo(8),
    items: [
      { drugId: "drg_01", medicationName: "Amoxicillin", dosage: "500 mg", frequency: "Three times daily", duration: "7 days", quantity: 21, instructions: "Take with food. Complete full course." },
    ],
    refillsAllowed: 0,
    refillsUsed: 0,
    notes: "Acute sinusitis. Pt reports penicillin allergy — verify before dispense.",
    history: [
      { at: isoMinutesAgo(8), by: "Dr. Elena Marsh", action: "Prescription submitted" },
    ],
  },
  {
    id: "rx_1002",
    patientId: "pt_02",
    prescribedByStaffId: "stf_doc_03",
    encounterId: "enc_5512",
    priority: "routine",
    status: "in_review",
    createdAt: isoMinutesAgo(34),
    items: [
      { drugId: "drg_02", medicationName: "Lisinopril",   dosage: "10 mg",  frequency: "Once daily", duration: "30 days", quantity: 30,  instructions: "Take in the morning. Monitor BP." },
      { drugId: "drg_04", medicationName: "Atorvastatin", dosage: "20 mg",  frequency: "Once daily at bedtime", duration: "30 days", quantity: 30, instructions: "Take at night." },
    ],
    refillsAllowed: 5,
    refillsUsed: 1,
    notes: "Chronic management. Pt has stable BP last visit.",
    history: [
      { at: isoMinutesAgo(34), by: "Dr. Mei Watanabe", action: "Prescription submitted" },
      { at: isoMinutesAgo(20), by: "Riley Chen",       action: "Opened for review" },
    ],
  },
  {
    id: "rx_1003",
    patientId: "pt_03",
    prescribedByStaffId: "stf_doc_02",
    encounterId: "enc_5520",
    priority: "routine",
    status: "ready_to_dispense",
    createdAt: isoMinutesAgo(75),
    items: [
      { drugId: "drg_03", medicationName: "Metformin", dosage: "500 mg", frequency: "Twice daily with meals", duration: "30 days", quantity: 60, instructions: "Take with breakfast and dinner." },
    ],
    refillsAllowed: 5,
    refillsUsed: 0,
    notes: "Type 2 DM, new start.",
    history: [
      { at: isoMinutesAgo(75), by: "Dr. Theo Akande", action: "Prescription submitted" },
      { at: isoMinutesAgo(40), by: "Riley Chen",       action: "Reviewed — cleared" },
    ],
  },
  {
    id: "rx_1004",
    patientId: "pt_05",
    prescribedByStaffId: "stf_doc_01",
    encounterId: "enc_5535",
    priority: "routine",
    status: "dispensing",
    createdAt: isoMinutesAgo(120),
    items: [
      { drugId: "drg_07", medicationName: "Sertraline", dosage: "50 mg", frequency: "Once daily", duration: "28 days", quantity: 28, instructions: "Take in the morning. Allow 2–4 weeks for full effect." },
    ],
    refillsAllowed: 3,
    refillsUsed: 0,
    notes: "Counsel on side effects and timing.",
    history: [
      { at: isoMinutesAgo(120), by: "Dr. Elena Marsh", action: "Prescription submitted" },
      { at: isoMinutesAgo(90),  by: "Riley Chen",      action: "Reviewed — cleared" },
      { at: isoMinutesAgo(10),  by: "Riley Chen",      action: "Started dispense" },
    ],
  },
  {
    id: "rx_1005",
    patientId: "pt_06",
    prescribedByStaffId: "stf_doc_02",
    encounterId: "enc_5540",
    priority: "routine",
    status: "dispensed",
    createdAt: isoMinutesAgo(240),
    items: [
      { drugId: "drg_06", medicationName: "Ibuprofen", dosage: "400 mg", frequency: "Every 6 hours as needed", duration: "5 days", quantity: 20, instructions: "Take with food. Max 4 doses per day." },
    ],
    refillsAllowed: 0,
    refillsUsed: 0,
    notes: "Acute lower back strain.",
    dispensedAt: isoMinutesAgo(45),
    label: { batchLot: "IBU-5R20" },
    history: [
      { at: isoMinutesAgo(240), by: "Dr. Theo Akande", action: "Prescription submitted" },
      { at: isoMinutesAgo(180), by: "Riley Chen",      action: "Reviewed — cleared" },
      { at: isoMinutesAgo(50),  by: "Riley Chen",      action: "Started dispense" },
      { at: isoMinutesAgo(45),  by: "Riley Chen",      action: "Dispensed · batch IBU-5R20" },
    ],
  },
  {
    id: "rx_1006",
    patientId: "pt_04",
    prescribedByStaffId: "stf_doc_03",
    encounterId: "enc_5544",
    priority: "urgent",
    status: "on_hold",
    createdAt: isoMinutesAgo(95),
    items: [
      { drugId: "drg_05", medicationName: "Salbutamol", dosage: "100 mcg", frequency: "2 puffs as needed", duration: "30 days", quantity: 1, instructions: "Up to 4 times daily. Shake well." },
    ],
    refillsAllowed: 2,
    refillsUsed: 0,
    notes: "Hold — pending insurance auth.",
    history: [
      { at: isoMinutesAgo(95), by: "Dr. Mei Watanabe", action: "Prescription submitted" },
      { at: isoMinutesAgo(60), by: "Riley Chen",       action: "On hold — insurance auth pending" },
    ],
  },
];

// Refills queue — separate stream feeding into prescriptions inbox when approved
export const REFILLS = [
  {
    id: "ref_2001",
    originalRxId: "rx_0901",          // an older completed Rx, not in the active list
    patientId: "pt_02",
    drugSnapshot: { name: "Lisinopril", strength: "10 mg", form: "Tablet" },
    requestedAt: isoMinutesAgo(180),
    source: "patient_app",
    status: "pending",                // pending | approved | denied
    remainingRefills: 4,
    daysSupplyLeft: 3,
    autoRefillEligible: true,
  },
  {
    id: "ref_2002",
    originalRxId: "rx_0888",
    patientId: "pt_05",
    drugSnapshot: { name: "Sertraline", strength: "50 mg", form: "Tablet" },
    requestedAt: isoMinutesAgo(50),
    source: "phone",
    status: "pending",
    remainingRefills: 2,
    daysSupplyLeft: 6,
    autoRefillEligible: false,
  },
  {
    id: "ref_2003",
    originalRxId: "rx_0795",
    patientId: "pt_06",
    drugSnapshot: { name: "Metformin", strength: "500 mg", form: "Tablet" },
    requestedAt: isoMinutesAgo(900),
    source: "pharmacist",
    status: "approved",
    remainingRefills: 3,
    daysSupplyLeft: 0,
    autoRefillEligible: true,
  },
  {
    id: "ref_2004",
    originalRxId: "rx_0770",
    patientId: "pt_01",
    drugSnapshot: { name: "Amoxicillin", strength: "500 mg", form: "Capsule" },
    requestedAt: isoMinutesAgo(60),
    source: "patient_app",
    status: "denied",
    deniedReason: "Acute course — refer back to doctor",
    remainingRefills: 0,
    daysSupplyLeft: 0,
    autoRefillEligible: false,
  },
];

export function isoMinutesAgo(min) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

export const SEED = {
  patients: PATIENTS,
  staff: STAFF,
  inventory: INVENTORY,
  prescriptions: PRESCRIPTIONS,
  refills: REFILLS,
  version: 3,
};
