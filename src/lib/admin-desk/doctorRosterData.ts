/** Admin desk — doctor roster and leave request seed data. */

export type ShiftType = "morning" | "afternoon" | "night" | "off" | "leave";

export interface DoctorDaySchedule {
  [day: string]: ShiftType; // "mon", "tue", "wed", "thu", "fri", "sat", "sun"
}

export interface DoctorRosterEntry {
  doctorId: string;
  doctorName: string;
  specialty: string;
  room: string;
  schedule: DoctorDaySchedule;
}

export type LeaveType = "sick" | "casual" | "conference" | "emergency";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  locumDoctorId?: string;
  locumDoctorName?: string;
  decidedAt?: string;
}

export interface ActiveSession {
  id: string;
  name: string;
  role: string;
  module: string;
  loginTime: string;
  lastActivity: string;
}

function dateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const DOCTOR_ROSTER: DoctorRosterEntry[] = [
  {
    doctorId: "DOC-001",
    doctorName: "Dr. Aarav Mehta",
    specialty: "General Medicine",
    room: "G-12",
    schedule: {
      mon: "morning", tue: "morning", wed: "morning", thu: "morning",
      fri: "morning", sat: "off", sun: "off",
    },
  },
  {
    doctorId: "DOC-002",
    doctorName: "Dr. Priya Nair",
    specialty: "Pediatrics",
    room: "P-04",
    schedule: {
      mon: "morning", tue: "morning", wed: "afternoon", thu: "morning",
      fri: "morning", sat: "morning", sun: "off",
    },
  },
  {
    doctorId: "DOC-003",
    doctorName: "Dr. Rohan Bhatt",
    specialty: "Orthopedics",
    room: "O-21",
    schedule: {
      mon: "afternoon", tue: "afternoon", wed: "afternoon", thu: "afternoon",
      fri: "afternoon", sat: "off", sun: "off",
    },
  },
  {
    doctorId: "DOC-004",
    doctorName: "Dr. Sara Iyer",
    specialty: "Dermatology",
    room: "D-07",
    schedule: {
      mon: "off", tue: "morning", wed: "morning", thu: "morning",
      fri: "morning", sat: "off", sun: "off",
    },
  },
  {
    doctorId: "DOC-005",
    doctorName: "Dr. Vikram Shah",
    specialty: "Cardiology",
    room: "C-15",
    schedule: {
      mon: "afternoon", tue: "off", wed: "afternoon", thu: "afternoon",
      fri: "off", sat: "morning", sun: "off",
    },
  },
];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "LR-001",
    doctorId: "DOC-004",
    doctorName: "Dr. Sara Iyer",
    specialty: "Dermatology",
    leaveType: "conference",
    fromDate: dateStr(3),
    toDate: dateStr(5),
    days: 3,
    reason: "Attending National Dermatology Congress, Bengaluru",
    status: "pending",
  },
  {
    id: "LR-002",
    doctorId: "DOC-002",
    doctorName: "Dr. Priya Nair",
    specialty: "Pediatrics",
    leaveType: "sick",
    fromDate: dateStr(1),
    toDate: dateStr(2),
    days: 2,
    reason: "Viral fever — doctor certified unfit for duty",
    status: "approved",
    locumDoctorId: "DOC-001",
    locumDoctorName: "Dr. Aarav Mehta",
    decidedAt: new Date().toISOString(),
  },
  {
    id: "LR-003",
    doctorId: "DOC-005",
    doctorName: "Dr. Vikram Shah",
    specialty: "Cardiology",
    leaveType: "casual",
    fromDate: dateStr(7),
    toDate: dateStr(7),
    days: 1,
    reason: "Personal work",
    status: "pending",
  },
  {
    id: "LR-004",
    doctorId: "DOC-003",
    doctorName: "Dr. Rohan Bhatt",
    specialty: "Orthopedics",
    leaveType: "emergency",
    fromDate: dateStr(-2),
    toDate: dateStr(-1),
    days: 2,
    reason: "Family emergency — urgent travel",
    status: "approved",
    locumDoctorId: "DOC-001",
    locumDoctorName: "Dr. Aarav Mehta",
    decidedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
  {
    id: "LR-005",
    doctorId: "DOC-001",
    doctorName: "Dr. Aarav Mehta",
    specialty: "General Medicine",
    leaveType: "casual",
    fromDate: dateStr(14),
    toDate: dateStr(15),
    days: 2,
    reason: "Planned vacation",
    status: "rejected",
    decidedAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
];

export const ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "SES-001",
    name: "Maya Kapoor",
    role: "Receptionist",
    module: "Reception Desk",
    loginTime: new Date(Date.now() - 2.5 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: "SES-002",
    name: "J. Mensah",
    role: "Lab Technician",
    module: "Lab Desk",
    loginTime: new Date(Date.now() - 4 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: "SES-003",
    name: "Dr. Rajan",
    role: "Lab Supervisor",
    module: "Lab Desk",
    loginTime: new Date(Date.now() - 3.5 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: "SES-004",
    name: "Riley Chen",
    role: "Pharmacist",
    module: "Pharmacy Desk",
    loginTime: new Date(Date.now() - 3 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: "SES-005",
    name: "Dr. Aarav Mehta",
    role: "Doctor",
    module: "Doctor Desk",
    loginTime: new Date(Date.now() - 5 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 1 * 60_000).toISOString(),
  },
  {
    id: "SES-006",
    name: "Anita Rao",
    role: "Billing Staff",
    module: "Billing Desk",
    loginTime: new Date(Date.now() - 1.8 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: "SES-007",
    name: "Sunita Pillai",
    role: "Nurse",
    module: "Nursing Desk",
    loginTime: new Date(Date.now() - 6 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 20 * 60_000).toISOString(),
  },
  {
    id: "SES-008",
    name: "Admin User",
    role: "Hospital Admin",
    module: "Admin Desk",
    loginTime: new Date(Date.now() - 0.5 * 3600_000).toISOString(),
    lastActivity: new Date(Date.now() - 1 * 60_000).toISOString(),
  },
];

export const ROSTER_KEY = "medora-admin-doctor-roster-v1";
export const LEAVE_KEY = "medora-admin-leave-requests-v1";

export function loadRoster(): DoctorRosterEntry[] {
  if (typeof window === "undefined") return DOCTOR_ROSTER;
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    return raw ? JSON.parse(raw) : DOCTOR_ROSTER;
  } catch { return DOCTOR_ROSTER; }
}

export function saveRoster(roster: DoctorRosterEntry[]) {
  if (typeof window !== "undefined") localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

export function loadLeaveRequests(): LeaveRequest[] {
  if (typeof window === "undefined") return LEAVE_REQUESTS;
  try {
    const raw = localStorage.getItem(LEAVE_KEY);
    return raw ? JSON.parse(raw) : LEAVE_REQUESTS;
  } catch { return LEAVE_REQUESTS; }
}

export function saveLeaveRequests(requests: LeaveRequest[]) {
  if (typeof window !== "undefined") localStorage.setItem(LEAVE_KEY, JSON.stringify(requests));
}
