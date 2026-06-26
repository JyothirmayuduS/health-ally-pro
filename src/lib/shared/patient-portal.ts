import { loadPatientRegistry, PORTAL_DEMO_PATIENT_ID } from "./patient-registry";
import { getSharedPatient, resolvePatientId } from "./patients";
import { listClinicQueue } from "./clinic-queue";
import { listLabResults } from "./lab-results";
import { loadLedgerInvoices } from "./billing-ledger";
import { listEncounters } from "./encounters";
import type { Appointment, Report } from "@/lib/mock-data";
import { listPatientAppointments } from "@/lib/patient-appointments-store";

/** Build patient-app views from staff desk data (demo: Anjali / MRN-100231). */
export function getPortalPatientId() {
  return PORTAL_DEMO_PATIENT_ID;
}

export function getPortalPatientProfile() {
  const p = getSharedPatient(PORTAL_DEMO_PATIENT_ID) ?? loadPatientRegistry()[0];
  if (!p) {
    return { name: "Guest", initials: "G", email: "", memberSince: "2024", age: 0, bloodGroup: "—" };
  }
  const parts = p.name.split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : p.name.slice(0, 2).toUpperCase();
  const age = p.dob
    ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 86400000))
    : 0;
  return {
    name: p.name,
    initials,
    email: p.email ?? `${p.name.split(" ")[0].toLowerCase()}@example.com`,
    memberSince: p.createdAt?.slice(0, 4) ?? "2024",
    age,
    bloodGroup: p.bloodGroup ?? "—",
  };
}

export function getPortalAppointments(): Appointment[] {
  const fromBookings = listPatientAppointments();
  if (fromBookings.some((a) => a.id.startsWith("appt-pb-") || a.status === "in-queue")) {
    return fromBookings;
  }

  const pid = PORTAL_DEMO_PATIENT_ID;
  const queue = listClinicQueue().filter((q) => q.patientId === pid);
  const encounters = listEncounters().filter((e) => e.patientId === pid);
  const today = new Date().toISOString().slice(0, 10);

  const fromQueue: Appointment[] = queue
    .filter((q) => q.status !== "completed")
    .map((q) => ({
      id: q.appointmentId,
      doctorId: "d1",
      date: today,
      time: q.checkInTime,
      reason: encounters.find((e) => e.appointmentId === q.appointmentId)?.chiefComplaint ?? "Clinic visit",
      status: q.status === "in-consultation" ? ("in-queue" as const) : ("in-queue" as const),
      queuePosition: q.tokenNumber % 100,
      estimatedWait: q.waitMinutes,
    }));

  if (fromQueue.length) return fromQueue;

  return [
    {
      id: "portal-a1",
      doctorId: "d1",
      date: today,
      time: "10:00",
      reason: "Follow-up consultation",
      status: "upcoming",
    },
  ];
}

export function getPortalReports(): Report[] {
  const pid = PORTAL_DEMO_PATIENT_ID;
  const labs = listLabResults(pid);
  return labs.map((r) => ({
    id: r.id,
    title: r.testName,
    type: "Lab" as const,
    date: r.date,
    size: "1.2 MB",
    doctor: "Dr. Aarav Mehta",
    shared: ["d1"],
    notes: r.summary,
  }));
}

export function getPortalBalance(): number {
  const inv = loadLedgerInvoices().filter(
    (i) => i.patientId === PORTAL_DEMO_PATIENT_ID && i.status !== "paid",
  );
  return inv.reduce((s, i) => s + (i.total - i.amountPaid), 0);
}

export function resolvePortalPatientId(id: string) {
  return resolvePatientId(id);
}
