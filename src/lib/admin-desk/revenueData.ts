/** Admin desk — 30-day seeded revenue data for charts and tables. */

export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  invoiced: number;
  collected: number;
}

export interface DepartmentRevenue {
  department: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  rate: number; // collection rate %
}

export interface OutstandingInvoice {
  id: string;
  patientName: string;
  patientId: string;
  department: string;
  amountDue: number;
  daysOutstanding: number;
  lastPaymentDate: string | null;
  invoiceDate: string;
}

export interface PayerMixEntry {
  payer: string;
  amount: number;
  percent: number;
}

export interface InsurancePayer {
  provider: string;
  patients: number;
  invoiced: number;
  collected: number;
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// 30-day daily revenue trend
export const DAILY_REVENUE: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => {
  const d = 29 - i;
  // Simulate weekly patterns — lower on Sundays
  const dayOfWeek = new Date(dateStr(d)).getDay();
  const base = dayOfWeek === 0 ? 18000 : dayOfWeek === 6 ? 28000 : 45000;
  const jitter = Math.floor((Math.sin(i * 7.3) + 1) * 8000);
  const invoiced = base + jitter;
  const collected = Math.floor(invoiced * (0.78 + Math.random() * 0.15));
  return { date: dateStr(d), invoiced, collected };
});

// Department breakdown
export const DEPARTMENT_REVENUE: DepartmentRevenue[] = [
  { department: "OPD Consultation", invoiced: 285000, collected: 241000, outstanding: 44000, rate: 85 },
  { department: "IPD Bed Stay", invoiced: 512000, collected: 390000, outstanding: 122000, rate: 76 },
  { department: "Laboratory", invoiced: 189000, collected: 163000, outstanding: 26000, rate: 86 },
  { department: "Pharmacy OTC", invoiced: 94000, collected: 94000, outstanding: 0, rate: 100 },
  { department: "Pharmacy Rx", invoiced: 148000, collected: 121000, outstanding: 27000, rate: 82 },
  { department: "Radiology", invoiced: 76000, collected: 61000, outstanding: 15000, rate: 80 },
];

// Top 5 revenue services
export const TOP_SERVICES = [
  { name: "IPD Ward Stay (General)", revenue: 210000 },
  { name: "OPD — Cardiology", revenue: 112000 },
  { name: "CT Scan", revenue: 89000 },
  { name: "CBC + Lipid Panel", revenue: 67000 },
  { name: "OPD — General Medicine", revenue: 58000 },
];

// Outstanding dues
export const OUTSTANDING_INVOICES: OutstandingInvoice[] = [
  {
    id: "INV-90013",
    patientName: "Ravi Deshmukh",
    patientId: "MRN-100234",
    department: "OPD Consultation",
    amountDue: 2152.5,
    daysOutstanding: 2,
    lastPaymentDate: null,
    invoiceDate: dateStr(2),
  },
  {
    id: "INV-84001",
    patientName: "Kiran Malhotra",
    patientId: "MRN-100241",
    department: "IPD Bed Stay",
    amountDue: 18500,
    daysOutstanding: 12,
    lastPaymentDate: dateStr(8),
    invoiceDate: dateStr(12),
  },
  {
    id: "INV-84002",
    patientName: "Meera Pillai",
    patientId: "MRN-100243",
    department: "Laboratory",
    amountDue: 4200,
    daysOutstanding: 19,
    lastPaymentDate: null,
    invoiceDate: dateStr(19),
  },
  {
    id: "INV-84003",
    patientName: "Suresh Iyer",
    patientId: "MRN-100245",
    department: "Pharmacy Rx",
    amountDue: 6800,
    daysOutstanding: 38,
    lastPaymentDate: dateStr(35),
    invoiceDate: dateStr(38),
  },
  {
    id: "INV-84004",
    patientName: "Ananya Bose",
    patientId: "MRN-100246",
    department: "IPD Bed Stay",
    amountDue: 45000,
    daysOutstanding: 67,
    lastPaymentDate: dateStr(60),
    invoiceDate: dateStr(67),
  },
  {
    id: "INV-84005",
    patientName: "Ramesh Gupta",
    patientId: "MRN-100248",
    department: "OPD Consultation",
    amountDue: 1800,
    daysOutstanding: 95,
    lastPaymentDate: null,
    invoiceDate: dateStr(95),
  },
];

// Payer mix
export const PAYER_MIX: PayerMixEntry[] = [
  { payer: "Cash", amount: 412000, percent: 32 },
  { payer: "UPI / Card", amount: 386000, percent: 30 },
  { payer: "Insurance", amount: 321000, percent: 25 },
  { payer: "Corporate", amount: 169000, percent: 13 },
];

export const INSURANCE_BREAKDOWN: InsurancePayer[] = [
  { provider: "Star Health", patients: 28, invoiced: 148000, collected: 121000 },
  { provider: "CGHS", patients: 15, invoiced: 92000, collected: 88000 },
  { provider: "Apollo Munich", patients: 10, invoiced: 61000, collected: 52000 },
  { provider: "ICICI Lombard", patients: 8, invoiced: 44000, collected: 36000 },
  { provider: "Niva Bupa", patients: 6, invoiced: 31000, collected: 24000 },
];

// Month-over-month payer comparison
export const PAYER_MONTH_COMPARISON = [
  { payer: "Cash", current: 412000, previous: 388000 },
  { payer: "UPI/Card", current: 386000, previous: 342000 },
  { payer: "Insurance", current: 321000, previous: 295000 },
  { payer: "Corporate", current: 169000, previous: 201000 },
];
