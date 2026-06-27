/** Shared leave request store — used by both doctor desk and admin desk */

export type LeaveType = "sick" | "casual" | "conference" | "emergency" | "maternity" | "paternity";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type StaffCategory = "doctor" | "nurse" | "staff";

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  category: StaffCategory;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  locumCoverId?: string;
  locumCoverName?: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface PerformanceRecord {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  category: StaffCategory;
  totalLeaveDays: number;
  sickLeaves: number;
  casualLeaves: number;
  emergencyLeaves: number;
  attendancePct: number;       // working days / total days
  patientsHandled?: number;    // doctors only
  reviewScore: number;         // 1-5 admin rating
  hikeRecommendation: "excellent" | "good" | "average" | "below-average";
}

const SHARED_LEAVE_KEY = "medora-shared-leave-v1";

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const SEED_LEAVE_REQUESTS: StaffLeaveRequest[] = [
  // Doctors
  {
    id: "SLR-001", staffId: "DOC-004", staffName: "Dr. Sara Iyer", role: "Dermatologist",
    department: "Dermatology", category: "doctor", leaveType: "conference",
    fromDate: dateStr(3), toDate: dateStr(5), days: 3,
    reason: "Attending National Dermatology Congress, Bengaluru", status: "pending",
  },
  {
    id: "SLR-002", staffId: "DOC-002", staffName: "Dr. Priya Nair", role: "Pediatrician",
    department: "Pediatrics", category: "doctor", leaveType: "sick",
    fromDate: dateStr(1), toDate: dateStr(2), days: 2,
    reason: "Viral fever — certified unfit for duty", status: "approved",
    locumCoverName: "Dr. Aarav Mehta", decidedAt: new Date().toISOString(), decidedBy: "Admin User",
  },
  {
    id: "SLR-003", staffId: "DOC-005", staffName: "Dr. Vikram Shah", role: "Cardiologist",
    department: "Cardiology", category: "doctor", leaveType: "casual",
    fromDate: dateStr(7), toDate: dateStr(7), days: 1,
    reason: "Personal work", status: "pending",
  },
  {
    id: "SLR-004", staffId: "DOC-003", staffName: "Dr. Rohan Bhatt", role: "Orthopedic Surgeon",
    department: "Orthopedics", category: "doctor", leaveType: "emergency",
    fromDate: dateStr(-2), toDate: dateStr(-1), days: 2,
    reason: "Family emergency — urgent travel", status: "approved",
    locumCoverName: "Dr. Aarav Mehta", decidedAt: new Date(Date.now() - 2 * 86400_000).toISOString(), decidedBy: "Admin User",
  },
  {
    id: "SLR-005", staffId: "DOC-001", staffName: "Dr. Aarav Mehta", role: "General Physician",
    department: "General Medicine", category: "doctor", leaveType: "casual",
    fromDate: dateStr(14), toDate: dateStr(15), days: 2,
    reason: "Planned vacation", status: "rejected",
    decidedAt: new Date(Date.now() - 1 * 86400_000).toISOString(), decidedBy: "Admin User",
  },
  // Nurses
  {
    id: "SLR-006", staffId: "NRS-001", staffName: "Sunita Pillai", role: "Staff Nurse",
    department: "ICU", category: "nurse", leaveType: "sick",
    fromDate: dateStr(-5), toDate: dateStr(-4), days: 2,
    reason: "Acute back pain", status: "approved",
    decidedAt: new Date(Date.now() - 5 * 86400_000).toISOString(), decidedBy: "Admin User",
  },
  {
    id: "SLR-007", staffId: "NRS-002", staffName: "Anitha Kumar", role: "Head Nurse",
    department: "Maternity Ward", category: "nurse", leaveType: "maternity",
    fromDate: dateStr(-30), toDate: dateStr(60), days: 90,
    reason: "Maternity leave", status: "approved",
    decidedAt: new Date(Date.now() - 30 * 86400_000).toISOString(), decidedBy: "Admin User",
  },
  {
    id: "SLR-008", staffId: "NRS-003", staffName: "Ramesh Babu", role: "Staff Nurse",
    department: "General Ward", category: "nurse", leaveType: "casual",
    fromDate: dateStr(2), toDate: dateStr(3), days: 2,
    reason: "Personal travel", status: "pending",
  },
  // Staff
  {
    id: "SLR-009", staffId: "STF-001", staffName: "Maya Kapoor", role: "Receptionist",
    department: "Reception", category: "staff", leaveType: "casual",
    fromDate: dateStr(-10), toDate: dateStr(-10), days: 1,
    reason: "Bank appointment", status: "approved",
    decidedAt: new Date(Date.now() - 10 * 86400_000).toISOString(), decidedBy: "Admin User",
  },
  {
    id: "SLR-010", staffId: "STF-002", staffName: "Riley Chen", role: "Pharmacist",
    department: "Pharmacy", category: "staff", leaveType: "emergency",
    fromDate: dateStr(1), toDate: dateStr(2), days: 2,
    reason: "Medical emergency of a family member", status: "pending",
  },
  {
    id: "SLR-011", staffId: "STF-003", staffName: "J. Mensah", role: "Lab Technician",
    department: "Laboratory", category: "staff", leaveType: "sick",
    fromDate: dateStr(-3), toDate: dateStr(-2), days: 2,
    reason: "Food poisoning", status: "approved",
    decidedAt: new Date(Date.now() - 3 * 86400_000).toISOString(), decidedBy: "Admin User",
  },
  {
    id: "SLR-012", staffId: "STF-004", staffName: "Anita Rao", role: "Billing Staff",
    department: "Billing", category: "staff", leaveType: "casual",
    fromDate: dateStr(5), toDate: dateStr(5), days: 1,
    reason: "Family function", status: "pending",
  },
];

export const PERFORMANCE_DATA: PerformanceRecord[] = [
  // Doctors
  { staffId: "DOC-001", staffName: "Dr. Aarav Mehta", role: "General Physician", department: "General Medicine", category: "doctor", totalLeaveDays: 2, sickLeaves: 0, casualLeaves: 2, emergencyLeaves: 0, attendancePct: 96, patientsHandled: 312, reviewScore: 4.5, hikeRecommendation: "excellent" },
  { staffId: "DOC-002", staffName: "Dr. Priya Nair", role: "Pediatrician", department: "Pediatrics", category: "doctor", totalLeaveDays: 2, sickLeaves: 2, casualLeaves: 0, emergencyLeaves: 0, attendancePct: 94, patientsHandled: 284, reviewScore: 4.2, hikeRecommendation: "good" },
  { staffId: "DOC-003", staffName: "Dr. Rohan Bhatt", role: "Orthopedic Surgeon", department: "Orthopedics", category: "doctor", totalLeaveDays: 5, sickLeaves: 0, casualLeaves: 3, emergencyLeaves: 2, attendancePct: 90, patientsHandled: 195, reviewScore: 3.8, hikeRecommendation: "good" },
  { staffId: "DOC-004", staffName: "Dr. Sara Iyer", role: "Dermatologist", department: "Dermatology", category: "doctor", totalLeaveDays: 7, sickLeaves: 0, casualLeaves: 4, emergencyLeaves: 0, attendancePct: 87, patientsHandled: 220, reviewScore: 3.5, hikeRecommendation: "average" },
  { staffId: "DOC-005", staffName: "Dr. Vikram Shah", role: "Cardiologist", department: "Cardiology", category: "doctor", totalLeaveDays: 1, sickLeaves: 0, casualLeaves: 1, emergencyLeaves: 0, attendancePct: 98, patientsHandled: 340, reviewScore: 4.9, hikeRecommendation: "excellent" },
  // Nurses
  { staffId: "NRS-001", staffName: "Sunita Pillai", role: "Staff Nurse", department: "ICU", category: "nurse", totalLeaveDays: 2, sickLeaves: 2, casualLeaves: 0, emergencyLeaves: 0, attendancePct: 93, reviewScore: 4.0, hikeRecommendation: "good" },
  { staffId: "NRS-002", staffName: "Anitha Kumar", role: "Head Nurse", department: "Maternity Ward", category: "nurse", totalLeaveDays: 90, sickLeaves: 0, casualLeaves: 0, emergencyLeaves: 0, attendancePct: 65, reviewScore: 4.7, hikeRecommendation: "excellent" },
  { staffId: "NRS-003", staffName: "Ramesh Babu", role: "Staff Nurse", department: "General Ward", category: "nurse", totalLeaveDays: 8, sickLeaves: 3, casualLeaves: 5, emergencyLeaves: 0, attendancePct: 84, reviewScore: 3.2, hikeRecommendation: "average" },
  // Staff
  { staffId: "STF-001", staffName: "Maya Kapoor", role: "Receptionist", department: "Reception", category: "staff", totalLeaveDays: 1, sickLeaves: 0, casualLeaves: 1, emergencyLeaves: 0, attendancePct: 98, reviewScore: 4.6, hikeRecommendation: "excellent" },
  { staffId: "STF-002", staffName: "Riley Chen", role: "Pharmacist", department: "Pharmacy", category: "staff", totalLeaveDays: 3, sickLeaves: 1, casualLeaves: 0, emergencyLeaves: 2, attendancePct: 94, reviewScore: 4.1, hikeRecommendation: "good" },
  { staffId: "STF-003", staffName: "J. Mensah", role: "Lab Technician", department: "Laboratory", category: "staff", totalLeaveDays: 2, sickLeaves: 2, casualLeaves: 0, emergencyLeaves: 0, attendancePct: 95, reviewScore: 3.9, hikeRecommendation: "good" },
  { staffId: "STF-004", staffName: "Anita Rao", role: "Billing Staff", department: "Billing", category: "staff", totalLeaveDays: 6, sickLeaves: 2, casualLeaves: 4, emergencyLeaves: 0, attendancePct: 88, reviewScore: 3.1, hikeRecommendation: "below-average" },
];

export function loadSharedLeaves(): StaffLeaveRequest[] {
  if (typeof window === "undefined") return SEED_LEAVE_REQUESTS;
  try {
    const raw = localStorage.getItem(SHARED_LEAVE_KEY);
    return raw ? JSON.parse(raw) : SEED_LEAVE_REQUESTS;
  } catch { return SEED_LEAVE_REQUESTS; }
}

export function saveSharedLeaves(reqs: StaffLeaveRequest[]) {
  if (typeof window !== "undefined") localStorage.setItem(SHARED_LEAVE_KEY, JSON.stringify(reqs));
}

export function addLeaveRequest(req: StaffLeaveRequest): StaffLeaveRequest[] {
  const current = loadSharedLeaves();
  const next = [req, ...current];
  saveSharedLeaves(next);
  return next;
}
