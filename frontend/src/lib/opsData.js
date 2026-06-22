import { TODAY_STR } from "./mockData";

export const STAFF = [
  { id: "STF-001", name: "Reena D'souza", initials: "RD" },
  { id: "STF-002", name: "Anjali Pawar", initials: "AP" },
  { id: "STF-003", name: "Karan Mehra", initials: "KM" },
];

// Denominations used at the drawer
export const DENOMS = [500, 200, 100, 50, 20, 10];

// Two shifts seeded for today: one closed (Morning), one open (Afternoon)
export const SEED_SHIFTS = [
  {
    id: "SHF-2001",
    date: TODAY_STR,
    label: "Morning",
    staffId: "STF-001",
    openedAt: `${TODAY_STR}T07:00:00`,
    closedAt: `${TODAY_STR}T15:02:00`,
    openingFloat: 2000,
    closingDenom: { 500: 8, 200: 6, 100: 14, 50: 8, 20: 12, 10: 20 },
    cashCollected: 4895,
    variance: 0,
    status: "closed",
    handover: "Two pending unpaid invoices passed to afternoon — INV-90013 (Vijay S) and INV-90015 (Arjun M). Card terminal #2 was acting up around 11:00, restart fixed it.",
  },
  {
    id: "SHF-2002",
    date: TODAY_STR,
    label: "Afternoon",
    staffId: "STF-002",
    openedAt: `${TODAY_STR}T15:05:00`,
    closedAt: null,
    openingFloat: 3000,
    closingDenom: null,
    cashCollected: 0,
    variance: null,
    status: "open",
    handover: null,
  },
];

let shiftCounter = 2003;
export const nextShiftId = () => `SHF-${shiftCounter++}`;

// Insurance claims — one per insured patient with mixed statuses
export const SEED_CLAIMS = [
  {
    id: "CLM-7001",
    patientId: "MRN-100231",
    appointmentId: "APT-50011",
    doctorId: "DOC-001",
    provider: "Star Health",
    policyId: "SH-882-3341",
    diagnosis: "Hypertension review (ICD I10)",
    serviceType: "OPD Consultation",
    estimatedCost: 1200,
    requestedAmount: 1200,
    approvedAmount: 1200,
    status: "approved",
    submittedAt: `${TODAY_STR}T08:55:00`,
    decisionAt: `${TODAY_STR}T09:25:00`,
    documents: [
      { name: "Policy card.pdf", size: "1.1 MB" },
      { name: "BP chart.jpg", size: "342 KB" },
    ],
    note: "Auto-approved via TPA portal",
  },
  {
    id: "CLM-7002",
    patientId: "MRN-100234",
    appointmentId: "APT-50015",
    doctorId: "DOC-003",
    provider: "Self-pay",
    policyId: "—",
    diagnosis: "Left knee pain — meniscal tear suspected",
    serviceType: "Orthopedic consult + X-ray",
    estimatedCost: 2050,
    requestedAmount: 2050,
    approvedAmount: null,
    status: "not-required",
    submittedAt: null,
    decisionAt: null,
    documents: [],
    note: "Patient opted self-pay",
  },
  {
    id: "CLM-7003",
    patientId: "MRN-100236",
    appointmentId: "APT-50016",
    doctorId: "DOC-005",
    provider: "Star Health",
    policyId: "SH-220-7711",
    diagnosis: "Post-MI follow-up (ICD I25.2)",
    serviceType: "Cardiology consult + ECG",
    estimatedCost: 2400,
    requestedAmount: 2400,
    approvedAmount: null,
    status: "submitted",
    submittedAt: `${TODAY_STR}T11:05:00`,
    decisionAt: null,
    documents: [
      { name: "ECG report.pdf", size: "780 KB" },
      { name: "Discharge summary.pdf", size: "1.4 MB" },
    ],
    note: "Pre-auth submitted to TPA, awaiting decision",
  },
  {
    id: "CLM-7004",
    patientId: "MRN-100237",
    appointmentId: "APT-50017",
    doctorId: "DOC-001",
    provider: "Tata AIG",
    policyId: "TA-118-6677",
    diagnosis: "Allergic rhinitis (ICD J30.9)",
    serviceType: "OPD Consultation",
    estimatedCost: 800,
    requestedAmount: 800,
    approvedAmount: 600,
    status: "partial",
    submittedAt: `${TODAY_STR}T10:30:00`,
    decisionAt: `${TODAY_STR}T11:55:00`,
    documents: [{ name: "Policy card.pdf", size: "980 KB" }],
    note: "TPA approved ₹600 of ₹800 — copay ₹200 to be collected at desk",
  },
  {
    id: "CLM-7005",
    patientId: "MRN-100235",
    appointmentId: "APT-50014",
    doctorId: "DOC-002",
    provider: "Niva Bupa",
    policyId: "NB-441-5523",
    diagnosis: "Routine pediatric vaccination — DTP booster",
    serviceType: "Pediatric consult + Vaccine",
    estimatedCost: 1500,
    requestedAmount: 1500,
    approvedAmount: null,
    status: "pending",
    submittedAt: null,
    decisionAt: null,
    documents: [],
    note: "Awaiting parent's consent + supporting docs",
  },
  {
    id: "CLM-7006",
    patientId: "MRN-100232",
    appointmentId: null,
    doctorId: "DOC-001",
    provider: "HDFC Ergo",
    policyId: "HE-771-9921",
    diagnosis: "General medicine follow-up",
    serviceType: "OPD Consultation",
    estimatedCost: 700,
    requestedAmount: 700,
    approvedAmount: 0,
    status: "rejected",
    submittedAt: `${TODAY_STR}T08:10:00`,
    decisionAt: `${TODAY_STR}T08:45:00`,
    documents: [{ name: "Old prescription.pdf", size: "612 KB" }],
    note: "Rejected — service excluded under current policy schedule",
  },
];

let claimCounter = 7007;
export const nextClaimId = () => `CLM-${claimCounter++}`;

export const CLAIM_STATUSES = [
  { id: "pending",      label: "Pending",        chip: "chip-mustard" },
  { id: "submitted",    label: "Submitted",      chip: "chip-teal" },
  { id: "approved",     label: "Approved",       chip: "chip-money" },
  { id: "partial",      label: "Partial",        chip: "chip-plum" },
  { id: "rejected",     label: "Rejected",       chip: "chip-clay" },
  { id: "not-required", label: "Not required",   chip: "chip-ink" },
];

export const STATUS_META = Object.fromEntries(
  CLAIM_STATUSES.map((s) => [s.id, s]),
);
