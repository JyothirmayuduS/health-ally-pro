import type { UserRole } from "./types";

/**
 * Local/dev demo staff only. Passwords rotated 2026-07-22 (Demo1234! retired).
 * Production builds must not expose these — see DEMO_CREDENTIALS in auth.ts
 * (empty unless DEV or VITE_ALLOW_DEMO_AUTH=true) and server production-boot guard.
 */
export const DEMO_STAFF_TABLE: Record<
  string,
  { password: string; fullName: string; roles: UserRole[]; userId: string }
> = {
  "lab@oakhaven.demo": {
    password: "MedoraDemo!2026Lab",
    fullName: "J. Mensah",
    roles: ["lab_technician"],
    userId: "demo-lab-technician",
  },
  "lab.supervisor@oakhaven.demo": {
    password: "MedoraDemo!2026Lab",
    fullName: "Dr. Rajan",
    roles: ["lab_supervisor"],
    userId: "demo-lab-supervisor",
  },
  "pharmacy@oakhaven.demo": {
    password: "MedoraDemo!2026Rx",
    fullName: "Riley Chen",
    roles: ["pharmacist"],
    userId: "demo-pharmacist",
  },
  "reception@oakhaven.demo": {
    password: "MedoraDemo!2026Front",
    fullName: "Maya Kapoor",
    roles: ["receptionist"],
    userId: "demo-receptionist",
  },
  "billing@oakhaven.demo": {
    password: "MedoraDemo!2026Bill",
    fullName: "Anita Rao",
    roles: ["billing_staff"],
    userId: "demo-billing",
  },
  "nursing@oakhaven.demo": {
    password: "MedoraDemo!2026Nurse",
    fullName: "Sunita Pillai",
    roles: ["nurse"],
    userId: "demo-nurse",
  },
  "admin@oakhaven.demo": {
    password: "MedoraDemo!2026Admin",
    fullName: "Admin User",
    roles: ["hospital_admin"],
    userId: "demo-admin",
  },
  "doctor@oakhaven.demo": {
    password: "MedoraDemo!2026Doc",
    fullName: "Dr. Aarav Mehta",
    roles: ["doctor"],
    userId: "demo-doctor",
  },
  "ophthalmology@oakhaven.demo": {
    password: "MedoraDemo!2026Doc",
    fullName: "Dr. Meera Joshi",
    roles: ["doctor"],
    userId: "demo-doctor-ophtho",
  },
  "cardiology@oakhaven.demo": {
    password: "MedoraDemo!2026Doc",
    fullName: "Dr. Vikram Shah",
    roles: ["doctor"],
    userId: "demo-doctor-cardio",
  },
  "pediatrics@oakhaven.demo": {
    password: "MedoraDemo!2026Doc",
    fullName: "Dr. Priya Nair",
    roles: ["doctor"],
    userId: "demo-doctor-peds",
  },
  "orthopedics@oakhaven.demo": {
    password: "MedoraDemo!2026Doc",
    fullName: "Dr. Rohan Bhatt",
    roles: ["doctor"],
    userId: "demo-doctor-ortho",
  },
  "patient@oakhaven.demo": {
    password: "MedoraDemo!2026Patient",
    fullName: "Anjali Krishnan",
    roles: ["patient"],
    userId: "demo-patient",
  },
};
