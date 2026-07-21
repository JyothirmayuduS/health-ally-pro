import type { UserRole } from "./types";

/** Demo staff logins — only bundled when import.meta.env.DEV or VITE_ALLOW_DEMO_AUTH=true */
export const DEMO_STAFF_TABLE: Record<
  string,
  { password: string; fullName: string; roles: UserRole[]; userId: string }
> = {
  "lab@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "J. Mensah",
    roles: ["lab_technician"],
    userId: "demo-lab-technician",
  },
  "lab.supervisor@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Rajan",
    roles: ["lab_supervisor"],
    userId: "demo-lab-supervisor",
  },
  "pharmacy@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Riley Chen",
    roles: ["pharmacist"],
    userId: "demo-pharmacist",
  },
  "reception@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Maya Kapoor",
    roles: ["receptionist"],
    userId: "demo-receptionist",
  },
  "billing@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Anita Rao",
    roles: ["billing_staff"],
    userId: "demo-billing",
  },
  "nursing@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Sunita Pillai",
    roles: ["nurse"],
    userId: "demo-nurse",
  },
  "admin@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Admin User",
    roles: ["hospital_admin"],
    userId: "demo-admin",
  },
  "doctor@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Aarav Mehta",
    roles: ["doctor"],
    userId: "demo-doctor",
  },
  "ophthalmology@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Meera Joshi",
    roles: ["doctor"],
    userId: "demo-doctor-ophtho",
  },
  "cardiology@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Vikram Shah",
    roles: ["doctor"],
    userId: "demo-doctor-cardio",
  },
  "pediatrics@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Priya Nair",
    roles: ["doctor"],
    userId: "demo-doctor-peds",
  },
  "orthopedics@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Dr. Rohan Bhatt",
    roles: ["doctor"],
    userId: "demo-doctor-ortho",
  },
  "patient@oakhaven.demo": {
    password: "Demo1234!",
    fullName: "Anjali Krishnan",
    roles: ["patient"],
    userId: "demo-patient",
  },
};
