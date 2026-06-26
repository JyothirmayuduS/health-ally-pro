// Mock seed data for the Hospital Reception Management System
// All times are local (no TZ math) since this is a mock UI.

const today = new Date();
const pad = (n) => String(n).padStart(2, "0");
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
  today.getDate(),
)}`;

export const DOCTORS = [
  {
    id: "DOC-001",
    name: "Dr. Aarav Mehta",
    specialty: "General Medicine",
    room: "G-12",
    onDuty: true,
    shift: "08:00 – 16:00",
  },
  {
    id: "DOC-002",
    name: "Dr. Priya Nair",
    specialty: "Pediatrics",
    room: "P-04",
    onDuty: true,
    shift: "09:00 – 17:00",
  },
  {
    id: "DOC-003",
    name: "Dr. Rohan Bhatt",
    specialty: "Orthopedics",
    room: "O-21",
    onDuty: true,
    shift: "10:00 – 18:00",
  },
  {
    id: "DOC-004",
    name: "Dr. Sara Iyer",
    specialty: "Dermatology",
    room: "D-07",
    onDuty: false,
    shift: "Off today",
  },
  {
    id: "DOC-005",
    name: "Dr. Vikram Shah",
    specialty: "Cardiology",
    room: "C-15",
    onDuty: true,
    shift: "11:00 – 19:00",
  },
];

import { SHARED_PATIENTS } from "@/lib/shared/patients";

export const PATIENTS = SHARED_PATIENTS;

// Helper to build appointment times today
const at = (h, m) => `${pad(h)}:${pad(m)}`;

export const APPOINTMENTS = [
  {
    id: "APT-50011",
    patientId: "MRN-100231",
    doctorId: "DOC-001",
    date: todayStr,
    time: at(9, 0),
    type: "Follow-up",
    duration: 15,
    status: "checked-in",
    tokenNumber: 101,
    notes: "BP review",
  },
  {
    id: "APT-50012",
    patientId: "MRN-100232",
    doctorId: "DOC-001",
    date: todayStr,
    time: at(9, 20),
    type: "New",
    duration: 20,
    status: "in-progress",
    tokenNumber: 102,
    notes: "",
  },
  {
    id: "APT-50013",
    patientId: "MRN-100233",
    doctorId: "DOC-002",
    date: todayStr,
    time: at(10, 0),
    type: "New",
    duration: 20,
    status: "checked-in",
    tokenNumber: 201,
    notes: "",
  },
  {
    id: "APT-50014",
    patientId: "MRN-100235",
    doctorId: "DOC-002",
    date: todayStr,
    time: at(10, 30),
    type: "Follow-up",
    duration: 15,
    status: "scheduled",
    tokenNumber: null,
    notes: "Vaccination",
  },
  {
    id: "APT-50015",
    patientId: "MRN-100234",
    doctorId: "DOC-003",
    date: todayStr,
    time: at(11, 0),
    type: "New",
    duration: 30,
    status: "checked-in",
    tokenNumber: 301,
    notes: "Knee pain",
  },
  {
    id: "APT-50016",
    patientId: "MRN-100236",
    doctorId: "DOC-005",
    date: todayStr,
    time: at(11, 30),
    type: "Lab review",
    duration: 15,
    status: "scheduled",
    tokenNumber: null,
    notes: "ECG follow-up",
  },
  {
    id: "APT-50017",
    patientId: "MRN-100237",
    doctorId: "DOC-001",
    date: todayStr,
    time: at(12, 0),
    type: "New",
    duration: 20,
    status: "scheduled",
    tokenNumber: null,
    notes: "",
  },
  {
    id: "APT-50018",
    patientId: "MRN-100238",
    doctorId: "DOC-005",
    date: todayStr,
    time: at(14, 0),
    type: "Follow-up",
    duration: 20,
    status: "no-show",
    tokenNumber: null,
    notes: "",
  },
  {
    id: "APT-50019",
    patientId: "MRN-100233",
    doctorId: "DOC-003",
    date: todayStr,
    time: at(15, 0),
    type: "New",
    duration: 30,
    status: "scheduled",
    tokenNumber: null,
    notes: "Wrist sprain",
  },
];

export const VISIT_TYPES = ["New", "Follow-up", "Emergency", "Lab review"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const GENDERS = ["Male", "Female", "Other"];

export const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 8; h < 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${pad(h)}:${pad(m)}`);
    }
  }
  return out;
})();

export const TODAY_STR = todayStr;
