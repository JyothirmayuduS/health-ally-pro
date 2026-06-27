/** Admin desk — analytics seed data for charts (last 3 months). */

export interface MonthlyRevenue {
  month: string; // "Jan", "Feb", etc.
  invoiced: number;
  collected: number;
}

export interface TestCount {
  name: string;
  count: number;
}

export interface DiagnosisCount {
  name: string;
  count: number;
}

export interface OpdVisitType {
  type: string;
  count: number;
  color: string;
}

export interface IpdLos {
  tier: string;
  avgDays: number;
  color: string;
}

export interface WeeklyApptStatus {
  week: string;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface HourlyLoad {
  hour: string;
  opd: number;
  lab: number;
  pharmacy: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const now = new Date();

export const MONTHLY_REVENUE: MonthlyRevenue[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
  const base = 900000 + Math.floor(Math.sin(i * 1.3) * 120000);
  const invoiced = base + Math.floor(i * 35000);
  const collected = Math.floor(invoiced * (0.76 + (i % 3) * 0.05));
  return { month: MONTHS[d.getMonth()], invoiced, collected };
});

export const TOP_TESTS: TestCount[] = [
  { name: "CBC (Complete Blood Count)", count: 342 },
  { name: "Lipid Profile", count: 285 },
  { name: "HbA1c", count: 241 },
  { name: "LFT", count: 198 },
  { name: "KFT / RFT", count: 176 },
  { name: "Thyroid Panel (TSH/T3/T4)", count: 163 },
  { name: "Blood Glucose (Fasting)", count: 154 },
  { name: "Urine R/M", count: 138 },
  { name: "Dengue NS1 Ag", count: 112 },
  { name: "Serum Vitamin D", count: 98 },
];

export const TOP_DIAGNOSES: DiagnosisCount[] = [
  { name: "Type 2 Diabetes Mellitus", count: 128 },
  { name: "Essential Hypertension", count: 114 },
  { name: "Acute URTI", count: 98 },
  { name: "Lumbar Radiculopathy", count: 76 },
  { name: "Dyslipidaemia", count: 68 },
  { name: "Chronic Obstructive Pulmonary Disease", count: 54 },
  { name: "Iron Deficiency Anaemia", count: 48 },
  { name: "Acute Gastroenteritis", count: 43 },
  { name: "Hypothyroidism", count: 41 },
  { name: "Osteoarthritis (Knee)", count: 38 },
];

export const OPD_VISIT_TYPES: OpdVisitType[] = [
  { type: "Follow-up", count: 312, color: "#2c7873" },
  { type: "New Patient", count: 186, color: "#2c5e4e" },
  { type: "Emergency Walk-in", count: 74, color: "#b85c38" },
  { type: "Walk-in (OPD)", count: 98, color: "#a87826" },
];

export const REPEAT_PATIENT_RATE = {
  current: 68, // % of patients who visited > once
  previous: 63,
};

export const IPD_LENGTH_OF_STAY: IpdLos[] = [
  { tier: "General Ward", avgDays: 4.2, color: "#2c7873" },
  { tier: "Semi-Private", avgDays: 3.8, color: "#2c5e4e" },
  { tier: "Private Deluxe", avgDays: 2.9, color: "#a87826" },
  { tier: "ICU", avgDays: 6.7, color: "#b85c38" },
];

export const WEEKLY_APPT_STATUS: WeeklyApptStatus[] = [
  { week: "Wk 1", scheduled: 112, completed: 89, cancelled: 14, noShow: 9 },
  { week: "Wk 2", scheduled: 128, completed: 104, cancelled: 12, noShow: 12 },
  { week: "Wk 3", scheduled: 119, completed: 92, cancelled: 18, noShow: 9 },
  { week: "Wk 4", scheduled: 134, completed: 112, cancelled: 11, noShow: 11 },
  { week: "Wk 5", scheduled: 108, completed: 88, cancelled: 13, noShow: 7 },
  { week: "Wk 6", scheduled: 141, completed: 118, cancelled: 10, noShow: 13 },
  { week: "Wk 7", scheduled: 126, completed: 99, cancelled: 16, noShow: 11 },
  { week: "Wk 8", scheduled: 138, completed: 115, cancelled: 9, noShow: 14 },
];

export const HOURLY_LOAD: HourlyLoad[] = [
  { hour: "08:00", opd: 8, lab: 12, pharmacy: 5 },
  { hour: "09:00", opd: 22, lab: 28, pharmacy: 14 },
  { hour: "10:00", opd: 38, lab: 35, pharmacy: 22 },
  { hour: "11:00", opd: 42, lab: 30, pharmacy: 28 },
  { hour: "12:00", opd: 35, lab: 24, pharmacy: 32 },
  { hour: "13:00", opd: 28, lab: 18, pharmacy: 24 },
  { hour: "14:00", opd: 31, lab: 22, pharmacy: 21 },
  { hour: "15:00", opd: 39, lab: 26, pharmacy: 18 },
  { hour: "16:00", opd: 33, lab: 21, pharmacy: 16 },
  { hour: "17:00", opd: 25, lab: 15, pharmacy: 14 },
  { hour: "18:00", opd: 18, lab: 10, pharmacy: 11 },
  { hour: "19:00", opd: 9, lab: 6, pharmacy: 8 },
  { hour: "20:00", opd: 4, lab: 3, pharmacy: 5 },
];
