export type RxStatus =
  | "received"
  | "in_review"
  | "on_hold"
  | "ready_to_dispense"
  | "dispensing"
  | "dispensed"
  | "ready_pickup"
  | "collected"
  | "cancelled";

export type RxPriority = "routine" | "urgent" | "stat";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type StorageZone = "main" | "cold" | "controlled" | "otc";
export type StorageTemp = "Room" | "2–8 °C" | "Frozen";
export type RefillStatus = "pending" | "approved" | "denied" | "dispensed";

export type AuditEntry = { at: string; actor: string; action: string; note?: string };

export type PharmacyPatient = {
  id: string;
  name: string;
  mrn: string;
  age: number;
  sex: string;
  phone: string;
  allergies: string[];
};

export type PharmacyDoctor = { id: string; name: string; specialty: string };

export type DrugLocation = {
  zone: StorageZone;
  aisle: string;
  rack: string;
  tray: string;
  slot: string;
  shelf?: string;
  temp: StorageTemp;
  location_code: string;
};

export type GstRate = 0 | 5 | 12 | 18;

export type Drug = {
  id: string;
  sku: string;
  barcode: string;
  generic_name: string;
  brand_names: string[];
  strength: string;
  form: string;
  route: string;
  rx_required: boolean;
  controlled_schedule?: string;
  location: DrugLocation;
  reorder_level: number;
  /** Selling price per dispensable unit (tablet, capsule, bottle, dose). */
  unit_price: number;
  /** Last / default purchase cost per dispensable unit. */
  purchase_cost?: number;
  /** Units per purchase pack (e.g. 10 tablets per strip). */
  pack_size?: number;
  /** MRP printed on the pack. */
  pack_mrp?: number;
  gst_rate?: GstRate;
  price_updated_at?: string;
  price_updated_by?: string;
  high_alert?: boolean;
  lasa_pair?: string;
  counseling?: string;
};

export type StockBatch = {
  id: string;
  drug_id: string;
  lot: string;
  expiry: string;
  qty: number;
  reserved_qty: number;
  location_override?: string;
  purchase_cost_per_unit?: number;
  vendor?: string;
  po_reference?: string;
  received_at?: string;
  status: "active" | "quarantine" | "expired";
};

export type PrescriptionLine = {
  id: string;
  drug_id: string;
  sig: string;
  qty_prescribed: number;
  qty_dispensed: number;
  days_supply: number;
  refills_allowed: number;
  refills_used: number;
  pick_batch_id?: string;
  substitute_for?: string;
  stock_ok?: boolean;
};

export type PaymentMethod = "cash" | "card" | "upi" | "insurance";

export type Prescription = {
  id: string;
  rx_number: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  encounter_id?: string;
  source: "doctor" | "reception" | "walk-in";
  priority: RxPriority;
  status: RxStatus;
  payment_status: PaymentStatus;
  invoice_number?: string;
  amount_paid?: number;
  payment_method?: PaymentMethod;
  paid_at?: string;
  received_at: string;
  reviewed_at?: string;
  dispensed_at?: string;
  collected_at?: string;
  bag_id?: string;
  hold_reason?: string;
  cancel_reason?: string;
  counseling_notes?: string;
  lines: PrescriptionLine[];
  history: AuditEntry[];
  clinical_flags?: string[];
};

export type RefillRequest = {
  id: string;
  original_rx_id: string;
  patient_id: string;
  drug_id: string;
  status: RefillStatus;
  requested_at: string;
  due_date: string;
  refills_remaining: number;
  source: "patient_app" | "counter" | "auto";
  note?: string;
};

export type ControlledEntry = {
  id: string;
  drug_id: string;
  rx_id: string;
  patient_id: string;
  qty: number;
  balance_after: number;
  witness?: string;
  at: string;
  pharmacist: string;
};

export type StockMovement = {
  id: string;
  drug_id: string;
  batch_id: string;
  type: "receive" | "dispense" | "adjust" | "transfer" | "expire" | "return" | "quarantine";
  qty: number;
  reference?: string;
  actor: string;
  at: string;
  note?: string;
};

export type WardOrderStatus = "pending" | "picking" | "in_transit" | "delivered";

export type WardOrder = {
  id: string;
  ward: string;
  bed: string;
  patient_id: string;
  nurse: string;
  drug_id: string;
  qty: number;
  priority: RxPriority;
  status: WardOrderStatus;
  requested_at: string;
  notes?: string;
};

export type PharmacyAlert = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  body: string;
  at: string;
  action_label?: string;
  action_to?: string;
  dismissed?: boolean;
};

export type WalkInItem = {
  id: string;
  drug_id: string;
  qty: number;
  patient_name?: string;
  amount: number;
  payment: PaymentStatus;
  at: string;
};

export const HOSPITAL = {
  id: "a0000001-0001-4001-8001-000000000001",
  name: "Maple Hospital",
  pharmacy: "Oak Haven Outpatient Pharmacy",
};

export const PHARMACIST = { name: "Riley Chen", email: "pharmacy@oakhaven.demo" };

import { PHARMACY_PATIENTS } from "@/lib/shared/patients";

export const PATIENTS: PharmacyPatient[] = PHARMACY_PATIENTS;

export const DOCTORS: PharmacyDoctor[] = [
  { id: "d1", name: "Dr. Elena Vasquez", specialty: "Internal Medicine" },
  { id: "d2", name: "Dr. Samuel Okonkwo", specialty: "Cardiology" },
  { id: "d3", name: "Dr. Mei Lin", specialty: "Pediatrics" },
  { id: "d4", name: "Dr. James Porter", specialty: "Family Medicine" },
  { id: "d-tyra", name: "Dr. Tyra Dhillon", specialty: "General Physician" },
];

const loc = (
  zone: StorageZone,
  aisle: string,
  rack: string,
  tray: string,
  slot: string,
  temp: StorageTemp,
  shelf?: string,
): DrugLocation => ({
  zone,
  aisle,
  rack,
  tray,
  slot,
  shelf,
  temp,
  location_code: `${rack}-${tray}-S${slot}`,
});

export const DRUGS: Drug[] = [
  {
    id: "drug-amx500",
    sku: "MED-AMX-500-TAB",
    barcode: "8901234567001",
    generic_name: "Amoxicillin",
    brand_names: ["Amoxil", "Trimox"],
    strength: "500 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A3", "T12", "4", "Room"),
    reorder_level: 50,
    unit_price: 0.42,
    counseling: "Take with or without food. Complete full course.",
  },
  {
    id: "drug-met500",
    sku: "MED-MET-500-TAB",
    barcode: "8901234567002",
    generic_name: "Metformin",
    brand_names: ["Glucophage"],
    strength: "500 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "B", "B2", "T08", "2", "Room"),
    reorder_level: 80,
    unit_price: 0.18,
    high_alert: true,
    counseling: "Take with meals to reduce GI upset.",
  },
  {
    id: "drug-lis10",
    sku: "MED-LIS-10-TAB",
    barcode: "8901234567003",
    generic_name: "Lisinopril",
    brand_names: ["Zestril", "Prinivil"],
    strength: "10 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A1", "T05", "7", "Room"),
    reorder_level: 60,
    unit_price: 0.22,
    lasa_pair: "drug-los50",
    counseling: "May cause dizziness. Rise slowly from sitting.",
  },
  {
    id: "drug-los50",
    sku: "MED-LOS-50-TAB",
    barcode: "8901234567004",
    generic_name: "Losartan",
    brand_names: ["Cozaar"],
    strength: "50 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A1", "T06", "3", "Room"),
    reorder_level: 60,
    unit_price: 0.28,
    lasa_pair: "drug-lis10",
  },
  {
    id: "drug-par500",
    sku: "MED-PAR-500-TAB",
    barcode: "8901234567005",
    generic_name: "Paracetamol",
    brand_names: ["Panadol", "Tylenol"],
    strength: "500 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: false,
    location: loc("otc", "C", "C1", "T02", "1", "Room"),
    reorder_level: 200,
    unit_price: 0.08,
  },
  {
    id: "drug-ibu400",
    sku: "MED-IBU-400-TAB",
    barcode: "8901234567006",
    generic_name: "Ibuprofen",
    brand_names: ["Advil", "Motrin"],
    strength: "400 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: false,
    location: loc("otc", "C", "C1", "T03", "5", "Room"),
    reorder_level: 150,
    unit_price: 0.12,
  },
  {
    id: "drug-ins100",
    sku: "MED-INS-100-INJ",
    barcode: "8901234567007",
    generic_name: "Insulin Glargine",
    brand_names: ["Lantus"],
    strength: "100 U/mL",
    form: "Injection",
    route: "Subcutaneous",
    rx_required: true,
    location: loc("cold", "F", "FRIDGE-2", "T03", "1", "2–8 °C"),
    reorder_level: 20,
    unit_price: 28.5,
    high_alert: true,
    counseling: "Store refrigerated. Do not freeze.",
  },
  {
    id: "drug-ome20",
    sku: "MED-OME-20-CAP",
    barcode: "8901234567008",
    generic_name: "Omeprazole",
    brand_names: ["Prilosec"],
    strength: "20 mg",
    form: "Capsule",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A2", "T09", "6", "Room"),
    reorder_level: 40,
    unit_price: 0.35,
    counseling: "Take 30 minutes before breakfast.",
  },
  {
    id: "drug-azt250",
    sku: "MED-AZT-250-SUS",
    barcode: "8901234567009",
    generic_name: "Azithromycin",
    brand_names: ["Zithromax"],
    strength: "250 mg/5 mL",
    form: "Suspension",
    route: "Oral",
    rx_required: true,
    location: loc("main", "B", "B3", "T04", "2", "Room", "S2"),
    reorder_level: 15,
    unit_price: 1.2,
  },
  {
    id: "drug-hct25",
    sku: "MED-HCT-25-TAB",
    barcode: "8901234567010",
    generic_name: "Hydrochlorothiazide",
    brand_names: ["Microzide"],
    strength: "25 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A1", "T04", "8", "Room"),
    reorder_level: 45,
    unit_price: 0.15,
  },
  {
    id: "drug-oxy5",
    sku: "MED-OXY-5-TAB",
    barcode: "8901234567011",
    generic_name: "Oxycodone",
    brand_names: ["OxyContin"],
    strength: "5 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    controlled_schedule: "Schedule II",
    location: loc("controlled", "X", "C1", "T01", "1", "Room"),
    reorder_level: 10,
    unit_price: 1.85,
    high_alert: true,
    counseling: "Controlled substance. Risk of dependence.",
  },
  {
    id: "drug-vacflu",
    sku: "MED-FLU-VAC",
    barcode: "8901234567012",
    generic_name: "Influenza Vaccine",
    brand_names: ["Fluarix"],
    strength: "0.5 mL",
    form: "Injection",
    route: "IM",
    rx_required: true,
    location: loc("cold", "F", "FRIDGE-1", "T02", "4", "2–8 °C"),
    reorder_level: 30,
    unit_price: 22.0,
  },
  {
    id: "drug-aml5",
    sku: "MED-AML-5-TAB",
    barcode: "8901234567013",
    generic_name: "Amlodipine",
    brand_names: ["Norvasc"],
    strength: "5 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A1", "T07", "2", "Room"),
    reorder_level: 55,
    unit_price: 0.24,
    counseling: "May cause ankle swelling. Take at the same time daily.",
  },
  {
    id: "drug-ato40",
    sku: "MED-ATO-40-TAB",
    barcode: "8901234567014",
    generic_name: "Atorvastatin",
    brand_names: ["Lipitor"],
    strength: "40 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "B", "B1", "T11", "3", "Room"),
    reorder_level: 50,
    unit_price: 0.45,
    counseling: "Take at night. Avoid grapefruit juice.",
  },
  {
    id: "drug-asp75",
    sku: "MED-ASP-75-TAB",
    barcode: "8901234567015",
    generic_name: "Aspirin",
    brand_names: ["Ecosprin"],
    strength: "75 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "A", "A2", "T10", "1", "Room"),
    reorder_level: 70,
    unit_price: 0.06,
    counseling: "Take after food. Report bleeding or bruising.",
  },
  {
    id: "drug-pred5",
    sku: "MED-PRED-5-TAB",
    barcode: "8901234567016",
    generic_name: "Prednisolone",
    brand_names: ["Wysolone"],
    strength: "5 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "B", "B2", "T07", "4", "Room"),
    reorder_level: 35,
    unit_price: 0.14,
    counseling: "Take with food in the morning. Do not stop abruptly.",
  },
  {
    id: "drug-sal100",
    sku: "MED-SAL-100-INH",
    barcode: "8901234567017",
    generic_name: "Salbutamol",
    brand_names: ["Ventolin"],
    strength: "100 mcg",
    form: "Inhaler",
    route: "Inhaled",
    rx_required: true,
    location: loc("main", "C", "C2", "T01", "6", "Room"),
    reorder_level: 25,
    unit_price: 4.2,
    counseling: "1–2 puffs as needed. Rinse mouth after use.",
  },
  {
    id: "drug-gli1",
    sku: "MED-GLI-1-TAB",
    barcode: "8901234567018",
    generic_name: "Glimepiride",
    brand_names: ["Amaryl"],
    strength: "1 mg",
    form: "Tablet",
    route: "Oral",
    rx_required: true,
    location: loc("main", "B", "B2", "T09", "1", "Room"),
    reorder_level: 40,
    unit_price: 0.32,
    high_alert: true,
    counseling: "Take before breakfast. Risk of hypoglycemia.",
  },
];

export const STOCK_BATCHES: StockBatch[] = [
  { id: "b1", drug_id: "drug-amx500", lot: "LOT-881", expiry: "2026-03-15", qty: 120, reserved_qty: 30, status: "active" },
  { id: "b2", drug_id: "drug-amx500", lot: "LOT-902", expiry: "2026-09-20", qty: 120, reserved_qty: 0, status: "active" },
  { id: "b3", drug_id: "drug-met500", lot: "LOT-441", expiry: "2026-11-01", qty: 180, reserved_qty: 60, status: "active" },
  { id: "b4", drug_id: "drug-lis10", lot: "LOT-332", expiry: "2026-07-10", qty: 90, reserved_qty: 0, status: "active" },
  { id: "b5", drug_id: "drug-los50", lot: "LOT-333", expiry: "2026-08-22", qty: 85, reserved_qty: 0, status: "active" },
  { id: "b6", drug_id: "drug-par500", lot: "LOT-110", expiry: "2027-01-05", qty: 400, reserved_qty: 0, status: "active" },
  { id: "b7", drug_id: "drug-ibu400", lot: "LOT-112", expiry: "2026-12-18", qty: 220, reserved_qty: 0, status: "active" },
  { id: "b8", drug_id: "drug-ins100", lot: "LOT-C01", expiry: "2026-04-30", qty: 24, reserved_qty: 2, status: "active" },
  { id: "b9", drug_id: "drug-ome20", lot: "LOT-550", expiry: "2026-06-01", qty: 8, reserved_qty: 0, status: "active" },
  { id: "b10", drug_id: "drug-azt250", lot: "LOT-220", expiry: "2026-05-12", qty: 12, reserved_qty: 0, status: "active" },
  { id: "b11", drug_id: "drug-hct25", lot: "LOT-778", expiry: "2026-10-15", qty: 100, reserved_qty: 0, status: "active" },
  { id: "b12", drug_id: "drug-oxy5", lot: "LOT-N01", expiry: "2026-08-01", qty: 40, reserved_qty: 0, status: "active" },
  { id: "b13", drug_id: "drug-vacflu", lot: "LOT-V88", expiry: "2026-02-28", qty: 18, reserved_qty: 0, status: "active" },
  { id: "b14", drug_id: "drug-aml5", lot: "LOT-901", expiry: "2026-09-15", qty: 95, reserved_qty: 0, status: "active" },
  { id: "b15", drug_id: "drug-ato40", lot: "LOT-445", expiry: "2026-11-20", qty: 80, reserved_qty: 0, status: "active" },
  { id: "b16", drug_id: "drug-asp75", lot: "LOT-201", expiry: "2027-03-01", qty: 150, reserved_qty: 0, status: "active" },
  { id: "b17", drug_id: "drug-pred5", lot: "LOT-312", expiry: "2026-08-10", qty: 60, reserved_qty: 0, status: "active" },
  { id: "b18", drug_id: "drug-sal100", lot: "LOT-INH1", expiry: "2026-07-30", qty: 22, reserved_qty: 0, status: "active" },
  { id: "b19", drug_id: "drug-gli1", lot: "LOT-667", expiry: "2026-10-05", qty: 70, reserved_qty: 0, status: "active" },
];

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

export const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-001",
    rx_number: "RX-2025-00421",
    patient_id: "MRN-100231",
    doctor_id: "d1",
    doctor_name: "Dr. Elena Vasquez",
    source: "doctor",
    priority: "urgent",
    status: "received",
    payment_status: "unpaid",
    received_at: ago(12),
    clinical_flags: ["Allergy: Penicillin — verify alternative"],
    lines: [
      { id: "l1", drug_id: "drug-azt250", sig: "5 mL once daily × 5 days", qty_prescribed: 1, qty_dispensed: 0, days_supply: 5, refills_allowed: 0, refills_used: 0, stock_ok: true },
    ],
    history: [{ at: ago(12), actor: "System", action: "Received from doctor portal" }],
  },
  {
    id: "rx-002",
    rx_number: "RX-2025-00418",
    patient_id: "MRN-100232",
    doctor_id: "d2",
    doctor_name: "Dr. Samuel Okonkwo",
    source: "doctor",
    priority: "routine",
    status: "in_review",
    payment_status: "paid",
    received_at: ago(45),
    lines: [
      { id: "l2", drug_id: "drug-met500", sig: "500 mg twice daily with meals", qty_prescribed: 60, qty_dispensed: 0, days_supply: 30, refills_allowed: 2, refills_used: 0, stock_ok: true },
      { id: "l3", drug_id: "drug-lis10", sig: "10 mg once daily", qty_prescribed: 30, qty_dispensed: 0, days_supply: 30, refills_allowed: 3, refills_used: 0, stock_ok: true },
    ],
    history: [
      { at: ago(45), actor: "System", action: "Received from doctor portal" },
      { at: ago(20), actor: "Riley Chen", action: "Opened for review" },
    ],
  },
  {
    id: "rx-003",
    rx_number: "RX-2025-00415",
    patient_id: "MRN-100235",
    doctor_id: "d3",
    doctor_name: "Dr. Mei Lin",
    source: "doctor",
    priority: "stat",
    status: "ready_to_dispense",
    payment_status: "paid",
    received_at: ago(90),
    reviewed_at: ago(30),
    lines: [
      { id: "l4", drug_id: "drug-amx500", sig: "250 mg (½ tab) three times daily", qty_prescribed: 21, qty_dispensed: 0, days_supply: 7, refills_allowed: 0, refills_used: 0, stock_ok: true },
    ],
    history: [
      { at: ago(90), actor: "System", action: "Received — pediatric dose" },
      { at: ago(30), actor: "Riley Chen", action: "Accepted for dispensing" },
    ],
  },
  {
    id: "rx-004",
    rx_number: "RX-2025-00412",
    patient_id: "MRN-100234",
    doctor_id: "d2",
    doctor_name: "Dr. Samuel Okonkwo",
    source: "doctor",
    priority: "routine",
    status: "dispensing",
    payment_status: "paid",
    received_at: ago(120),
    reviewed_at: ago(60),
    lines: [
      { id: "l5", drug_id: "drug-hct25", sig: "25 mg every morning", qty_prescribed: 30, qty_dispensed: 15, days_supply: 30, refills_allowed: 5, refills_used: 1, stock_ok: true, pick_batch_id: "b11" },
      { id: "l6", drug_id: "drug-ome20", sig: "20 mg before breakfast", qty_prescribed: 30, qty_dispensed: 0, days_supply: 30, refills_allowed: 2, refills_used: 0, stock_ok: false },
    ],
    history: [
      { at: ago(120), actor: "System", action: "Received" },
      { at: ago(60), actor: "Riley Chen", action: "Accepted" },
      { at: ago(15), actor: "Riley Chen", action: "Dispensing started" },
    ],
  },
  {
    id: "rx-005",
    rx_number: "RX-2025-00408",
    patient_id: "MRN-100233",
    doctor_id: "d4",
    doctor_name: "Dr. James Porter",
    source: "doctor",
    priority: "routine",
    status: "ready_pickup",
    payment_status: "paid",
    received_at: ago(180),
    reviewed_at: ago(120),
    dispensed_at: ago(40),
    bag_id: "BAG-8821",
    lines: [
      { id: "l7", drug_id: "drug-par500", sig: "1 g every 6 hours PRN pain", qty_prescribed: 40, qty_dispensed: 40, days_supply: 10, refills_allowed: 0, refills_used: 0, pick_batch_id: "b6" },
    ],
    history: [
      { at: ago(180), actor: "System", action: "Received" },
      { at: ago(40), actor: "Riley Chen", action: "Dispensed — bag BAG-8821" },
    ],
  },
  {
    id: "rx-006",
    rx_number: "RX-2025-00401",
    patient_id: "MRN-100236",
    doctor_id: "d1",
    doctor_name: "Dr. Elena Vasquez",
    source: "doctor",
    priority: "urgent",
    status: "on_hold",
    payment_status: "unpaid",
    hold_reason: "Interaction review — patient on Codeine allergy",
    received_at: ago(25),
    clinical_flags: ["Allergy: Codeine", "Duplicate therapy check"],
    lines: [
      { id: "l8", drug_id: "drug-oxy5", sig: "5 mg every 6 hours PRN severe pain", qty_prescribed: 12, qty_dispensed: 0, days_supply: 3, refills_allowed: 0, refills_used: 0, stock_ok: true },
    ],
    history: [
      { at: ago(25), actor: "System", action: "Received — controlled substance" },
      { at: ago(10), actor: "Riley Chen", action: "Placed on hold", note: "Allergy review" },
    ],
  },
  {
    id: "rx-007",
    rx_number: "RX-2025-00398",
    patient_id: "MRN-100232",
    doctor_id: "d2",
    doctor_name: "Dr. Samuel Okonkwo",
    source: "doctor",
    priority: "routine",
    status: "collected",
    payment_status: "paid",
    received_at: ago(1440),
    reviewed_at: ago(1380),
    dispensed_at: ago(1320),
    collected_at: ago(1300),
    bag_id: "BAG-8790",
    lines: [
      { id: "l9", drug_id: "drug-los50", sig: "50 mg once daily", qty_prescribed: 30, qty_dispensed: 30, days_supply: 30, refills_allowed: 3, refills_used: 1, pick_batch_id: "b5" },
    ],
    history: [
      { at: ago(1440), actor: "System", action: "Received" },
      { at: ago(1300), actor: "Riley Chen", action: "Collected by patient" },
    ],
  },
  {
    id: "rx-008",
    rx_number: "RX-2025-00422",
    patient_id: "MRN-100234",
    doctor_id: "d2",
    doctor_name: "Dr. Samuel Okonkwo",
    source: "doctor",
    priority: "stat",
    status: "received",
    payment_status: "partial",
    received_at: ago(5),
    lines: [
      { id: "l10", drug_id: "drug-ins100", sig: "20 units at bedtime", qty_prescribed: 1, qty_dispensed: 0, days_supply: 30, refills_allowed: 2, refills_used: 0, stock_ok: true },
    ],
    clinical_flags: ["Cold chain — fridge pick required"],
    history: [{ at: ago(5), actor: "System", action: "STAT — received" }],
  },
  {
    id: "rx-009",
    rx_number: "RX-2025-00425",
    patient_id: "MRN-100231",
    doctor_id: "d-tyra",
    doctor_name: "Dr. Tyra Dhillon",
    source: "doctor",
    priority: "routine",
    status: "received",
    payment_status: "unpaid",
    received_at: ago(3),
    lines: [
      { id: "l11", drug_id: "drug-los50", sig: "50 mg once daily", qty_prescribed: 30, qty_dispensed: 0, days_supply: 30, refills_allowed: 2, refills_used: 0, stock_ok: true },
      { id: "l12", drug_id: "drug-met500", sig: "500 mg twice daily with meals", qty_prescribed: 60, qty_dispensed: 0, days_supply: 30, refills_allowed: 1, refills_used: 0, stock_ok: true },
    ],
    history: [{ at: ago(3), actor: "Dr. Tyra Dhillon", action: "E-prescribed — sent to pharmacy" }],
  },
];

export const SEED_REFILLS: RefillRequest[] = [
  { id: "rf-01", original_rx_id: "rx-007", patient_id: "MRN-100232", drug_id: "drug-los50", status: "pending", requested_at: ago(60), due_date: new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10), refills_remaining: 2, source: "patient_app" },
  { id: "rf-02", original_rx_id: "rx-002", patient_id: "MRN-100232", drug_id: "drug-met500", status: "pending", requested_at: ago(180), due_date: new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10), refills_remaining: 2, source: "auto" },
  { id: "rf-03", original_rx_id: "rx-005", patient_id: "MRN-100233", drug_id: "drug-par500", status: "approved", requested_at: ago(300), due_date: new Date().toISOString().slice(0, 10), refills_remaining: 0, source: "counter", note: "Walk-in request" },
];

export const SEED_CONTROLLED: ControlledEntry[] = [
  { id: "ce-1", drug_id: "drug-oxy5", rx_id: "rx-006", patient_id: "MRN-100236", qty: 0, balance_after: 40, at: ago(10), pharmacist: "Riley Chen" },
];

export const SEED_MOVEMENTS: StockMovement[] = [
  { id: "mv-1", drug_id: "drug-amx500", batch_id: "b1", type: "receive", qty: 120, reference: "PO-4421", actor: "Riley Chen", at: ago(43200), note: "Weekly delivery" },
  { id: "mv-2", drug_id: "drug-los50", batch_id: "b5", type: "dispense", qty: -30, reference: "RX-2025-00398", actor: "Riley Chen", at: ago(1320) },
];

export const SEED_WARD_ORDERS: WardOrder[] = [
  { id: "wo-1", ward: "Med-Surg 3W", bed: "312", patient_id: "MRN-100234", nurse: "N. Okoro", drug_id: "drug-hct25", qty: 1, priority: "routine", status: "pending", requested_at: ago(18), notes: "Morning dose" },
  { id: "wo-2", ward: "ICU 2N", bed: "ICU-08", patient_id: "MRN-100232", nurse: "T. Hughes", drug_id: "drug-ins100", qty: 1, priority: "stat", status: "picking", requested_at: ago(8), notes: "STAT bedtime insulin" },
  { id: "wo-3", ward: "Peds 1E", bed: "104", patient_id: "MRN-100235", nurse: "M. Santos", drug_id: "drug-amx500", qty: 21, priority: "urgent", status: "pending", requested_at: ago(25) },
  { id: "wo-4", ward: "Ortho 4W", bed: "418", patient_id: "MRN-100236", nurse: "K. Webb", drug_id: "drug-par500", qty: 20, priority: "routine", status: "in_transit", requested_at: ago(45) },
];

export const SEED_ALERTS: PharmacyAlert[] = [
  { id: "al-1", level: "critical", title: "Fridge-2 temp excursion", body: "Recorded 9.2 °C for 12 min — verify insulin stock.", at: ago(20), action_label: "View cold chain", action_to: "/pharmacy/map" },
  { id: "al-2", level: "warning", title: "Omeprazole below reorder", body: "8 units on hand · reorder at 40 · A2-T09-S6", at: ago(90), action_label: "Receive stock", action_to: "/pharmacy/inventory" },
  { id: "al-3", level: "warning", title: "Rx SLA breach", body: "RX-2025-00421 waiting 12m in inbox — pediatric urgent.", at: ago(12), action_label: "Open inbox", action_to: "/pharmacy/prescriptions" },
  { id: "al-4", level: "info", title: "Flu vaccine batch expiring", body: "LOT-V88 expires in 28 days · FRIDGE-1-T02-S4", at: ago(200), action_label: "Expiry hub", action_to: "/pharmacy/operations" },
];

export const HOURLY_DISPENSE_SEED = [
  { hour: "08:00", rx: 4, ward: 1 },
  { hour: "09:00", rx: 7, ward: 2 },
  { hour: "10:00", rx: 11, ward: 1 },
  { hour: "11:00", rx: 9, ward: 3 },
  { hour: "12:00", rx: 6, ward: 2 },
  { hour: "13:00", rx: 8, ward: 1 },
  { hour: "14:00", rx: 5, ward: 2 },
];

export const RACK_LAYOUT = [
  { aisle: "A", label: "Oral solids — cardio & antibiotics", racks: ["A1", "A2", "A3"] },
  { aisle: "B", label: "Oral solids — metabolic & liquids", racks: ["B2", "B3"] },
  { aisle: "C", label: "OTC & analgesics", racks: ["C1"] },
  { aisle: "F", label: "Cold chain", racks: ["FRIDGE-1", "FRIDGE-2"] },
  { aisle: "X", label: "Controlled substances", racks: ["C1"] },
] as const;

export function findDrug(id: string) {
  return DRUGS.find((d) => d.id === id);
}

export type ReturnReason =
  | "Patient discharged"
  | "Dose change"
  | "Treatment stopped"
  | "Excess dispensed"
  | "Damaged packaging";

export type WardReturn = {
  id: string;
  ward: string;
  bed: string;
  patient_id: string;
  drug_id: string;
  batch_id: string;
  qty: number;
  reason: ReturnReason;
  submitted_by: string;
  submitted_at: string;
  status: "pending" | "restocked" | "disposed";
};


export const SEED_RETURNS: WardReturn[] = [
  {
    id: "ret-1",
    ward: "Med-Surg 3W",
    bed: "312",
    patient_id: "MRN-100234",
    drug_id: "drug-hct25",
    batch_id: "b11",
    qty: 5,
    reason: "Patient discharged",
    submitted_by: "Nurse N. Okoro",
    submitted_at: ago(120),
    status: "pending",
  },
  {
    id: "ret-2",
    ward: "ICU 2N",
    bed: "ICU-08",
    patient_id: "MRN-100232",
    drug_id: "drug-met500",
    batch_id: "b3",
    qty: 10,
    reason: "Dose change",
    submitted_by: "Nurse T. Hughes",
    submitted_at: ago(180),
    status: "pending",
  },
  {
    id: "ret-3",
    ward: "Peds 1E",
    bed: "104",
    patient_id: "MRN-100235",
    drug_id: "drug-amx500",
    batch_id: "b1",
    qty: 2,
    reason: "Treatment stopped",
    submitted_by: "Nurse M. Santos",
    submitted_at: ago(240),
    status: "pending",
  },
  {
    id: "ret-4",
    ward: "Ortho 4W",
    bed: "418",
    patient_id: "MRN-100236",
    drug_id: "drug-par500",
    batch_id: "b6",
    qty: 8,
    reason: "Damaged packaging",
    submitted_by: "Nurse K. Webb",
    submitted_at: ago(360),
    status: "pending",
  },
];

