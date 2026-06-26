/** Cross-portal hospital ERP snapshot — Meditech-style command center data */

export type ErpStatus = "paid" | "partial" | "pending" | "in-progress" | "completed" | "upcoming" | "occupied" | "available" | "cleaning" | "maintenance" | "urgent" | "routine" | "stat" | "critical" | "high" | "medium";

export const FINANCE_KPIS = {
  revenueToday: { value: 284500, delta: "+12.4%", vs: "vs last week" },
  pendingPayments: { value: 67300, delta: "-3.1%", vs: "vs last week" },
  totalCollected: { value: 1248000, delta: "+8.7%", vs: "vs last week" },
  insuranceClaims: { value: 18, delta: "+2 pending", vs: "awaiting adjudication" },
};

export const REVENUE_VS_EXPENSES = [
  { month: "Jan", revenue: 820000, expenses: 540000 },
  { month: "Feb", revenue: 910000, expenses: 560000 },
  { month: "Mar", revenue: 880000, expenses: 575000 },
  { month: "Apr", revenue: 1020000, expenses: 590000 },
  { month: "May", revenue: 1150000, expenses: 610000 },
  { month: "Jun", revenue: 1248000, expenses: 628000 },
];

export const PAYMENT_METHODS = [
  { method: "Cash", amount: 312000 },
  { method: "Card", amount: 428000 },
  { method: "Insurance", amount: 356000 },
  { method: "UPI", amount: 152000 },
];

export const RECENT_BILLS = [
  { id: "INV-2401", patient: "Arjun Kapoor", mrn: "P-2041", date: "2026-06-24", amount: 4200, paid: 4200, balance: 0, status: "paid" as const },
  { id: "INV-2400", patient: "Sneha Rao", mrn: "P-3188", date: "2026-06-24", amount: 1850, paid: 1000, balance: 850, status: "partial" as const },
  { id: "INV-2399", patient: "Priya Sharma", mrn: "P-2910", date: "2026-06-23", amount: 6200, paid: 0, balance: 6200, status: "pending" as const },
  { id: "INV-2398", patient: "Mohammed Ali", mrn: "P-1102", date: "2026-06-23", amount: 12400, paid: 12400, balance: 0, status: "paid" as const },
  { id: "INV-2397", patient: "Lakshmi Devi", mrn: "P-4420", date: "2026-06-22", amount: 2800, paid: 2800, balance: 0, status: "paid" as const },
];

export const OPD_TODAY = [
  { id: "a1", patient: "Arjun Kapoor", mrn: "P-2041", type: "Follow-up", status: "in-progress" as const, dept: "Cardiology", doctor: "Dr. Rajesh Mehta", time: "09:30" },
  { id: "a2", patient: "Sneha Rao", mrn: "P-3188", type: "New patient", status: "upcoming" as const, dept: "Pulmonology", doctor: "Dr. Rajesh Mehta", time: "10:15" },
  { id: "a3", patient: "Priya Sharma", mrn: "P-2910", type: "Follow-up", status: "upcoming" as const, dept: "Endocrinology", doctor: "Dr. Ananya Iyer", time: "10:45" },
  { id: "a4", patient: "Ravi Kumar", mrn: "P-5512", type: "Review", status: "completed" as const, dept: "General", doctor: "Dr. Rajesh Mehta", time: "09:00" },
];

export const IPD_SUMMARY = {
  totalBeds: 120,
  occupied: 94,
  available: 26,
  occupancyRate: 78,
};

export const WARD_OCCUPANCY = [
  { ward: "General Ward A", occupied: 28, total: 32 },
  { ward: "General Ward B", occupied: 24, total: 30 },
  { ward: "ICU", occupied: 12, total: 14 },
  { ward: "Pediatric Ward", occupied: 18, total: 24 },
  { ward: "Maternity", occupied: 12, total: 20 },
];

export const IPD_ADMISSIONS_CURRENT = [
  { id: "adm1", patient: "Mohammed Ali", mrn: "P-1102", priority: "medium" as const, doctor: "Dr. Rajesh Mehta", admitted: "2026-06-20", diagnosis: "Post-PCI observation" },
  { id: "adm2", patient: "Kavitha Nair", mrn: "P-3301", priority: "critical" as const, doctor: "Dr. Ananya Iyer", admitted: "2026-06-23", diagnosis: "Sepsis — ICU" },
  { id: "adm3", patient: "Suresh Patel", mrn: "P-2890", priority: "high" as const, doctor: "Dr. Vikram Singh", admitted: "2026-06-22", diagnosis: "Fracture — right femur" },
];

export const IPD_ADMISSIONS_PENDING = [
  { id: "padm1", patient: "Anita Desai", mrn: "P-6102", priority: "high" as const, doctor: "Dr. Rajesh Mehta", requested: "2026-06-24", diagnosis: "Elective cholecystectomy" },
];

export const LAB_ORDERS_SNAPSHOT = [
  { id: "lo1", test: "Complete Blood Count", patient: "Sneha Rao", sample: "Collected", priority: "routine" as const, status: "in-progress" as const },
  { id: "lo2", test: "Lipid Profile", patient: "Arjun Kapoor", sample: "Collected", priority: "routine" as const, status: "completed" as const },
  { id: "lo3", test: "HbA1c", patient: "Priya Sharma", sample: "Pending", priority: "urgent" as const, status: "pending" as const },
  { id: "lo4", test: "LFT Panel", patient: "Kavitha Nair", sample: "Collected", priority: "stat" as const, status: "in-progress" as const },
];

export const OT_ROOMS = [
  { id: "OT-1", name: "OT-1", status: "occupied" as const, procedure: "Knee arthroscopy", until: "45 min" },
  { id: "OT-2", name: "OT-2", status: "available" as const },
  { id: "OT-3", name: "OT-3", status: "cleaning" as const, until: "12 min" },
  { id: "OT-4", name: "OT-4", status: "occupied" as const, procedure: "C-section", until: "1h 20m" },
  { id: "OT-5", name: "OT-5", status: "available" as const },
  { id: "OT-6", name: "OT-6", status: "maintenance" as const },
];

export const OT_UTILIZATION = 78;

export const IMAGING_ORDERS = [
  { id: "img1", patient: "Arjun Kapoor", mrn: "P-2041", study: "Chest X-ray", modality: "X-ray", status: "completed" as const },
  { id: "img2", patient: "Suresh Patel", mrn: "P-2890", study: "Femur AP/Lat", modality: "X-ray", status: "in-progress" as const },
  { id: "img3", patient: "Mohammed Ali", mrn: "P-1102", study: "Echocardiogram", modality: "US", status: "upcoming" as const },
  { id: "img4", patient: "Priya Sharma", mrn: "P-2910", study: "Abdominal US", modality: "US", status: "upcoming" as const },
];

export function fmtInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
