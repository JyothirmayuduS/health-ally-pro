/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import {
  DEFAULT_STAFF,
  type StaffMember,
  loadHospital,
  saveHospital,
} from "./config";
import {
  loadRoster,
  saveRoster,
  loadLeaveRequests,
  saveLeaveRequests,
  ACTIVE_SESSIONS,
  type DoctorRosterEntry,
  type LeaveRequest,
  type ActiveSession,
  type ShiftType,
} from "./doctorRosterData";
import {
  getAnnouncements,
  pushAnnouncement,
  expireAnnouncement,
  notifyAnnouncementsUpdated,
  type Announcement,
} from "@/lib/shared/announcements";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type Role =
  | "Super Admin"
  | "Hospital Admin"
  | "Receptionist"
  | "Lab Technician"
  | "Lab Supervisor"
  | "Pharmacist"
  | "Pharmacy Supervisor"
  | "Doctor"
  | "Nurse"
  | "Billing Staff"
  | "Read Only";

export interface ExtendedStaffMember extends StaffMember {
  employeeId: string;
  designation: string;
  shift: "morning" | "afternoon" | "night" | "rotational";
  phone: string;
  joinDate: string;
  lastLogin: string;
  roleFull: Role;
}

export interface RolePermissions {
  role: Role;
  permissions: {
    reception: { viewAppointments: boolean; manageCheckIn: boolean; processBilling: boolean; issueRefunds: boolean };
    lab: { viewOrders: boolean; enterResults: boolean; validateReports: boolean; manageQC: boolean; viewAnalytics: boolean };
    pharmacy: { viewPrescriptions: boolean; dispenseMedications: boolean; manageControlled: boolean; manageInventory: boolean };
    ipd: { viewAdmissions: boolean; processADT: boolean; manageBedBoard: boolean };
    admin: { viewAnalytics: boolean; manageStaff: boolean; manageRevenue: boolean; systemSettings: boolean };
  };
}

export interface ActivityFeedEntry {
  id: string;
  module: "reception" | "lab" | "pharmacy" | "ipd" | "admin";
  icon: string;
  action: string;
  staff: string;
  timestamp: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Seed data
// ──────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: "Super Admin",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: true, processBilling: true, issueRefunds: true },
      lab: { viewOrders: true, enterResults: true, validateReports: true, manageQC: true, viewAnalytics: true },
      pharmacy: { viewPrescriptions: true, dispenseMedications: true, manageControlled: true, manageInventory: true },
      ipd: { viewAdmissions: true, processADT: true, manageBedBoard: true },
      admin: { viewAnalytics: true, manageStaff: true, manageRevenue: true, systemSettings: true },
    },
  },
  {
    role: "Hospital Admin",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: true, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: true },
      pharmacy: { viewPrescriptions: true, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: true, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: true, manageStaff: true, manageRevenue: true, systemSettings: true },
    },
  },
  {
    role: "Receptionist",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: true, processBilling: true, issueRefunds: false },
      lab: { viewOrders: false, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: false },
      pharmacy: { viewPrescriptions: false, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: true, processADT: true, manageBedBoard: false },
      admin: { viewAnalytics: false, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
  {
    role: "Lab Technician",
    permissions: {
      reception: { viewAppointments: false, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: true, enterResults: true, validateReports: false, manageQC: false, viewAnalytics: false },
      pharmacy: { viewPrescriptions: false, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: false, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: false, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
  {
    role: "Lab Supervisor",
    permissions: {
      reception: { viewAppointments: false, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: true, enterResults: true, validateReports: true, manageQC: true, viewAnalytics: true },
      pharmacy: { viewPrescriptions: false, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: false, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: false, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
  {
    role: "Pharmacist",
    permissions: {
      reception: { viewAppointments: false, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: false, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: false },
      pharmacy: { viewPrescriptions: true, dispenseMedications: true, manageControlled: false, manageInventory: true },
      ipd: { viewAdmissions: false, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: false, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
  {
    role: "Billing Staff",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: false, processBilling: true, issueRefunds: true },
      lab: { viewOrders: false, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: false },
      pharmacy: { viewPrescriptions: false, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: false, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: true, manageStaff: false, manageRevenue: true, systemSettings: false },
    },
  },
  {
    role: "Doctor",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: true, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: false },
      pharmacy: { viewPrescriptions: true, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: true, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: false, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
  {
    role: "Nurse",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: true, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: false },
      pharmacy: { viewPrescriptions: true, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: true, processADT: true, manageBedBoard: true },
      admin: { viewAnalytics: false, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
  {
    role: "Read Only",
    permissions: {
      reception: { viewAppointments: true, manageCheckIn: false, processBilling: false, issueRefunds: false },
      lab: { viewOrders: true, enterResults: false, validateReports: false, manageQC: false, viewAnalytics: true },
      pharmacy: { viewPrescriptions: true, dispenseMedications: false, manageControlled: false, manageInventory: false },
      ipd: { viewAdmissions: true, processADT: false, manageBedBoard: false },
      admin: { viewAnalytics: true, manageStaff: false, manageRevenue: false, systemSettings: false },
    },
  },
];

function seedRoleForStaff(role: string): Role {
  const m: Record<string, Role> = {
    "Receptionist": "Receptionist",
    "Lab technician": "Lab Technician",
    "Lab supervisor": "Lab Supervisor",
    "Pharmacist": "Pharmacist",
    "Billing staff": "Billing Staff",
    "Nurse": "Nurse",
    "Hospital admin": "Hospital Admin",
  };
  return m[role] ?? "Read Only";
}

const EXTENDED_STAFF: ExtendedStaffMember[] = [
  ...DEFAULT_STAFF.map((s, i) => ({
    ...s,
    employeeId: `EMP-${String(i + 1).padStart(3, "0")}`,
    designation: s.role,
    shift: (["morning", "morning", "morning", "morning", "morning", "rotational", "morning"] as const)[i] ?? "morning",
    phone: `+91 9${String(8800001000 + i * 11).slice(1)}`,
    joinDate: `202${2 - (i % 3)}-0${(i % 9) + 1}-01`,
    lastLogin: new Date(Date.now() - i * 3600_000).toISOString(),
    roleFull: seedRoleForStaff(s.role),
  })),
  {
    id: "ST-08",
    name: "Dr. Vikram Shah",
    role: "Doctor",
    email: "v.shah@oakhaven.demo",
    department: "Cardiology",
    active: true,
    employeeId: "EMP-008",
    designation: "Senior Consultant",
    shift: "afternoon",
    phone: "+91 98100 88882",
    joinDate: "2021-06-15",
    lastLogin: new Date(Date.now() - 1 * 3600_000).toISOString(),
    roleFull: "Doctor",
  },
  {
    id: "ST-09",
    name: "Dr. Priya Nair",
    role: "Doctor",
    email: "p.nair@oakhaven.demo",
    department: "Pediatrics",
    active: true,
    employeeId: "EMP-009",
    designation: "Consultant",
    shift: "morning",
    phone: "+91 98100 88883",
    joinDate: "2020-03-01",
    lastLogin: new Date(Date.now() - 2 * 3600_000).toISOString(),
    roleFull: "Doctor",
  },
];

function ts(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

const ACTIVITY_FEED: ActivityFeedEntry[] = [
  { id: "AF-001", module: "reception", icon: "👤", action: "New patient registered — Kavita Sharma (MRN-100251)", staff: "Maya Kapoor", timestamp: ts(2) },
  { id: "AF-002", module: "lab", icon: "🔴", action: "Critical value released — Hemoglobin 5.2 g/dL for Anjali Krishnan", staff: "J. Mensah", timestamp: ts(5) },
  { id: "AF-003", module: "reception", icon: "✅", action: "Invoice INV-90011 paid — ₹735 by Anjali Krishnan", staff: "Maya Kapoor", timestamp: ts(8) },
  { id: "AF-004", module: "pharmacy", icon: "💊", action: "Prescription dispensed — Metformin 500mg × 30 to Ravi Deshmukh", staff: "Riley Chen", timestamp: ts(12) },
  { id: "AF-005", module: "reception", icon: "🏥", action: "Patient admitted — Kiran Malhotra → Bed B-202 (Semi-Private)", staff: "Maya Kapoor", timestamp: ts(15) },
  { id: "AF-006", module: "lab", icon: "🧪", action: "Lab order validated — Lipid Profile for Suresh Iyer", staff: "Dr. Rajan", timestamp: ts(18) },
  { id: "AF-007", module: "reception", icon: "🪙", action: "Appointment checked-in — Meera Pillai · Token #102", staff: "Maya Kapoor", timestamp: ts(22) },
  { id: "AF-008", module: "pharmacy", icon: "📦", action: "QC lock cleared — Amoxicillin 500mg back in service", staff: "Riley Chen", timestamp: ts(28) },
  { id: "AF-009", module: "lab", icon: "📋", action: "Shift report signed — Morning shift by Dr. Rajan", staff: "Dr. Rajan", timestamp: ts(35) },
  { id: "AF-010", module: "ipd", icon: "🛏️", action: "Patient discharged — Anjali Krishnan · Bed B-101", staff: "Sunita Pillai", timestamp: ts(40) },
  { id: "AF-011", module: "reception", icon: "📅", action: "Appointment cancelled — APT-50016 (patient request)", staff: "Maya Kapoor", timestamp: ts(48) },
  { id: "AF-012", module: "lab", icon: "🔬", action: "QC run passed — CBC Sysmex Analyzer", staff: "J. Mensah", timestamp: ts(55) },
  { id: "AF-013", module: "pharmacy", icon: "💉", action: "Controlled substance dispensed — Tramadol 50mg (Rxn #8821)", staff: "Riley Chen", timestamp: ts(62) },
  { id: "AF-014", module: "ipd", icon: "🛏️", action: "Bed transfer — Ravi Deshmukh B-201 → B-302", staff: "Sunita Pillai", timestamp: ts(70) },
  { id: "AF-015", module: "reception", icon: "💰", action: "Partial refund processed — ₹500 for INV-90013", staff: "Anita Rao", timestamp: ts(75) },
  { id: "AF-016", module: "lab", icon: "⚗️", action: "New sample received — Urine R/M for Kavita Sharma", staff: "J. Mensah", timestamp: ts(82) },
  { id: "AF-017", module: "pharmacy", icon: "📦", action: "Inventory low alert — Atorvastatin 20mg < 10 units", staff: "Riley Chen", timestamp: ts(90) },
  { id: "AF-018", module: "reception", icon: "👤", action: "Walk-in check-in — Suresh Iyer · Dr. Mehta · Token #103", staff: "Maya Kapoor", timestamp: ts(95) },
  { id: "AF-019", module: "lab", icon: "📋", action: "Lab order received from Dr. Mehta — CBC for Kavita Sharma", staff: "System", timestamp: ts(100) },
  { id: "AF-020", module: "reception", icon: "🏥", action: "Patient admitted — Ananya Bose → ICU B-401", staff: "Maya Kapoor", timestamp: ts(110) },
];

const STAFF_KEY = "medora-admin-staff-v1";
const SESSIONS_KEY = "medora-admin-sessions-v1";

function loadStaff(): ExtendedStaffMember[] {
  if (typeof window === "undefined") return EXTENDED_STAFF;
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    return raw ? JSON.parse(raw) : EXTENDED_STAFF;
  } catch { return EXTENDED_STAFF; }
}

function saveStaff(staff: ExtendedStaffMember[]) {
  if (typeof window !== "undefined") localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

function loadSessions(): ActiveSession[] {
  if (typeof window === "undefined") return ACTIVE_SESSIONS;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : ACTIVE_SESSIONS;
  } catch { return ACTIVE_SESSIONS; }
}

// ──────────────────────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────────────────────

const Ctx = createContext<ReturnType<typeof buildValue> | null>(null);

function buildValue(
  staff: ExtendedStaffMember[],
  setStaff: React.Dispatch<React.SetStateAction<ExtendedStaffMember[]>>,
  roster: DoctorRosterEntry[],
  setRoster: React.Dispatch<React.SetStateAction<DoctorRosterEntry[]>>,
  leaveRequests: LeaveRequest[],
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>,
  activityFeed: ActivityFeedEntry[],
  setActivityFeed: React.Dispatch<React.SetStateAction<ActivityFeedEntry[]>>,
  sessions: ActiveSession[],
  setSessions: React.Dispatch<React.SetStateAction<ActiveSession[]>>,
  announcements: Announcement[],
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>,
) {
  return {
    staff,
    roster,
    leaveRequests,
    activityFeed,
    sessions,
    announcements,
    rolePermissions: ROLE_PERMISSIONS,

    updateStaff: (id: string, patch: Partial<ExtendedStaffMember>) => {
      setStaff((list) => {
        const next = list.map((s) => s.id === id ? { ...s, ...patch } : s);
        saveStaff(next);
        return next;
      });
    },

    updateRosterCell: (doctorId: string, day: string, shift: ShiftType) => {
      setRoster((list) => {
        const next = list.map((r) =>
          r.doctorId === doctorId
            ? { ...r, schedule: { ...r.schedule, [day]: shift } }
            : r
        );
        saveRoster(next);
        return next;
      });
    },

    publishRoster: () => {
      saveRoster(roster);
      // Sync to reception-desk doctors: update onDuty based on today's schedule
      const todayDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
      const rosterMap = new Map(roster.map((r) => [r.doctorId, r.schedule[todayDay]]));
      const existing = (() => {
        try { return JSON.parse(localStorage.getItem("medora-reception-appointments-v1") ?? "null") ?? null; } catch { return null; }
      })();
      // Write doctor onDuty state for reception board
      const doctorStatus = roster.map((r) => ({
        id: r.doctorId,
        onDuty: r.schedule[todayDay] !== "off" && r.schedule[todayDay] !== "leave",
        shift: r.schedule[todayDay],
      }));
      localStorage.setItem("medora-admin-doctor-onduty-v1", JSON.stringify(doctorStatus));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("medora-roster-updated"));
      }
    },

    approveLeave: (leaveId: string, locumId?: string, locumName?: string) => {
      setLeaveRequests((list) => {
        const next = list.map((lr) =>
          lr.id === leaveId
            ? { ...lr, status: "approved" as const, locumDoctorId: locumId, locumDoctorName: locumName, decidedAt: new Date().toISOString() }
            : lr
        );
        saveLeaveRequests(next);
        return next;
      });
    },

    rejectLeave: (leaveId: string) => {
      setLeaveRequests((list) => {
        const next = list.map((lr) =>
          lr.id === leaveId ? { ...lr, status: "rejected" as const, decidedAt: new Date().toISOString() } : lr
        );
        saveLeaveRequests(next);
        return next;
      });
    },

    addActivityEntry: (entry: Omit<ActivityFeedEntry, "id" | "timestamp">) => {
      const newEntry: ActivityFeedEntry = {
        ...entry,
        id: `AF-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setActivityFeed((list) => [newEntry, ...list].slice(0, 50));
    },

    forceLogout: (sessionId: string) => {
      setSessions((list) => list.filter((s) => s.id !== sessionId));
    },

    createAnnouncement: (data: Omit<Announcement, "id" | "status">) => {
      const ann = pushAnnouncement(data);
      setAnnouncements(getAnnouncements());
      notifyAnnouncementsUpdated();
      return ann;
    },

    expireAnnouncement: (id: string) => {
      expireAnnouncement(id);
      setAnnouncements(getAnnouncements());
      notifyAnnouncementsUpdated();
    },
  };
}

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<ExtendedStaffMember[]>(() => loadStaff());
  const [roster, setRoster] = useState<DoctorRosterEntry[]>(() => loadRoster());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadLeaveRequests());
  const [activityFeed, setActivityFeed] = useState<ActivityFeedEntry[]>(ACTIVITY_FEED);
  const [sessions, setSessions] = useState<ActiveSession[]>(() => loadSessions());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => getAnnouncements());

  const value = useMemo(
    () => buildValue(staff, setStaff, roster, setRoster, leaveRequests, setLeaveRequests, activityFeed, setActivityFeed, sessions, setSessions, announcements, setAnnouncements),
    [staff, roster, leaveRequests, activityFeed, sessions, announcements]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return ctx;
}
