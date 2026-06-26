import { apkDoctor } from "@/lib/doctor-apk-data";

export type ReferralDirection = "sent" | "received";
export type ReferralStatus = "Pending" | "Accepted" | "Declined" | "Completed";

export type DoctorReferral = {
  id: string;
  patientName: string;
  facility: string;
  direction: ReferralDirection;
  status: ReferralStatus;
  specialty: string;
  fromDoctor: string;
  clinicalReason: string;
  linkedDocument: string;
  statusDetail: string;
  relativeTime: string;
  absoluteTime: string;
  history: {
    id: string;
    title: string;
    actor: string;
    detail?: string;
    relativeTime: string;
    absoluteTime: string;
    isLatest?: boolean;
  }[];
};

export const DOCTOR_REFERRALS: DoctorReferral[] = [
  {
    id: "ref-arjun-lipid",
    patientName: "Arjun Kapoor",
    facility: "Thyrocare — Koramangala",
    direction: "sent",
    status: "Pending",
    specialty: "Cardiology",
    fromDoctor: apkDoctor.name,
    clinicalReason:
      "Regarding Lipid panel (Thyrocare — Koramangala): Abnormal or borderline values — request consult for management plan. [Document: Lipid panel]",
    linkedDocument: "Lipid panel",
    statusDetail: "Referral sent · To Cardiology · Thyrocare — Koramangala",
    relativeTime: "about 1 month ago",
    absoluteTime: "24 May · 5:26 PM",
    history: [
      {
        id: "h1",
        title: "Referral sent",
        actor: apkDoctor.name,
        detail: "To Cardiology · Thyrocare — Koramangala",
        relativeTime: "about 1 month ago",
        absoluteTime: "24 May · 5:26 PM",
        isLatest: true,
      },
      {
        id: "h2",
        title: "Referral created",
        actor: apkDoctor.name,
        detail: "To Cardiology · Thyrocare — Koramangala",
        relativeTime: "about 1 month ago",
        absoluteTime: "24 May · 5:26 PM",
      },
      {
        id: "h3",
        title: "Document linked",
        actor: "Medora Results",
        detail: "Lipid panel",
        relativeTime: "about 1 month ago",
        absoluteTime: "24 May · 5:24 PM",
      },
    ],
  },
  {
    id: "ref-sneha-pft",
    patientName: "Sneha Rao",
    facility: "City Pulmonary Clinic",
    direction: "sent",
    status: "Accepted",
    specialty: "Pulmonology",
    fromDoctor: apkDoctor.name,
    clinicalReason: "Asthma suboptimal control — PFT referral for technique review and step-up plan.",
    linkedDocument: "Peak flow diary",
    statusDetail: "Accepted · Patient & referring teams notified",
    relativeTime: "12 days ago",
    absoluteTime: "10 Jun · 2:15 PM",
    history: [
      {
        id: "h1",
        title: "Referral accepted",
        actor: "Dr. Anita Desai",
        detail: "Pulmonology · City Pulmonary Clinic",
        relativeTime: "12 days ago",
        absoluteTime: "10 Jun · 4:00 PM",
        isLatest: true,
      },
      {
        id: "h2",
        title: "Referral sent",
        actor: apkDoctor.name,
        relativeTime: "12 days ago",
        absoluteTime: "10 Jun · 2:15 PM",
      },
    ],
  },
  {
    id: "ref-priya-received",
    patientName: "Priya Sharma",
    facility: "Metro Endocrine",
    direction: "received",
    status: "Pending",
    specialty: "Endocrinology",
    fromDoctor: "Dr. Priya Sharma (GP)",
    clinicalReason: "HbA1c 8.2% — shared care for diabetes optimisation.",
    linkedDocument: "HbA1c result",
    statusDetail: "Incoming referral · Awaiting your review",
    relativeTime: "3 days ago",
    absoluteTime: "19 Jun · 11:00 AM",
    history: [
      {
        id: "h1",
        title: "Referral received",
        actor: "Dr. Priya Sharma (GP)",
        relativeTime: "3 days ago",
        absoluteTime: "19 Jun · 11:00 AM",
        isLatest: true,
      },
    ],
  },
];

export type CoverageNotification = {
  id: string;
  title: string;
  body: string;
  relativeTime: string;
  unread: boolean;
  kind: "accepted" | "declined" | "request" | "ended";
};

export const COVERAGE_NOTIFICATIONS: CoverageNotification[] = [
  {
    id: "n1",
    title: "You're back on duty",
    body: "Coverage ended. Patients can book you again.",
    relativeTime: "27 days ago",
    unread: true,
    kind: "ended",
  },
  {
    id: "n2",
    title: "Coverage accepted",
    body: "Dr. Omar Khan is covering 1 patient(s). Patients notified.",
    relativeTime: "27 days ago",
    unread: true,
    kind: "accepted",
  },
  {
    id: "n3",
    title: "Coverage declined",
    body: "Dr. Karan Nair declined 1 patient(s). Patients get priority rebooking tomorrow.",
    relativeTime: "27 days ago",
    unread: false,
    kind: "declined",
  },
  {
    id: "n4",
    title: "Coverage request",
    body: "Dr. Rajesh Mehta asked you to cover 1 patient(s) — Medical emergency. Accept or decline in Coverage.",
    relativeTime: "28 days ago",
    unread: false,
    kind: "request",
  },
];

export type ScheduleSlot = {
  id: string;
  time: string;
  price: number;
  capacity: number;
  bookedToday: number;
  inPerson: boolean;
  video: boolean;
  enabled: boolean;
};

export const DEFAULT_SCHEDULE = {
  room: "Room 3A",
  defaultFee: 800,
  slotSpacing: 30,
  breakBetweenSlots: false,
  breakMinutes: 10,
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
  slots: [
    { id: "s1", time: "09:00", price: 800, capacity: 2, bookedToday: 1, inPerson: true, video: true, enabled: true },
    { id: "s2", time: "09:30", price: 800, capacity: 2, bookedToday: 2, inPerson: true, video: false, enabled: true },
    { id: "s3", time: "10:00", price: 800, capacity: 1, bookedToday: 1, inPerson: true, video: false, enabled: true },
    { id: "s4", time: "11:15", price: 850, capacity: 2, bookedToday: 0, inPerson: true, video: true, enabled: true },
    { id: "s5", time: "14:00", price: 800, capacity: 2, bookedToday: 1, inPerson: true, video: true, enabled: true },
    { id: "s6", time: "15:15", price: 900, capacity: 1, bookedToday: 1, inPerson: true, video: false, enabled: true },
    { id: "s7", time: "16:00", price: 900, capacity: 2, bookedToday: 0, inPerson: true, video: true, enabled: true },
    { id: "s8", time: "17:30", price: 800, capacity: 1, bookedToday: 0, inPerson: true, video: false, enabled: false },
  ] satisfies ScheduleSlot[],
};

export type AwayReason = "emergency" | "stepped-out" | "leave" | "unavailable";

export const AWAY_REASONS: { id: AwayReason; label: string; hint: string }[] = [
  { id: "emergency", label: "Medical emergency", hint: "Urgent — colleagues notified to accept or decline" },
  { id: "stepped-out", label: "Stepped out briefly", hint: "Short absence — split queue across colleagues" },
  { id: "leave", label: "On leave today", hint: "Full-day handoff with patient alerts" },
  { id: "unavailable", label: "Unavailable", hint: "Pause bookings; existing visits reassigned" },
];

export type TodayPatientForAway = {
  id: string;
  name: string;
  time: string;
  mode: "In-person" | "Video";
  status: string;
};

export const TODAY_PATIENTS_AWAY: TodayPatientForAway[] = [
  { id: "p1", name: "Arjun Kapoor", time: "10:30", mode: "In-person", status: "pending" },
  { id: "p2", name: "Sneha Rao", time: "11:15", mode: "In-person", status: "in-progress" },
  { id: "p3", name: "Mohammad Ali", time: "14:00", mode: "In-person", status: "confirmed" },
  { id: "p4", name: "Priya Sharma", time: "15:30", mode: "Video", status: "confirmed" },
];

export type CoveringDoctor = {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  room: string;
};

export const COVERING_DOCTORS: CoveringDoctor[] = [
  { id: "d1", name: "Dr. Priya Sharma", initials: "PS", specialty: "General Medicine", room: "Room 2B" },
  { id: "d2", name: "Dr. Karan Nair", initials: "KN", specialty: "Internal Medicine", room: "Room 1A" },
  { id: "d3", name: "Dr. Anita Desai", initials: "AD", specialty: "Pulmonology", room: "Room 4C" },
  { id: "d4", name: "Dr. Omar Khan", initials: "OK", specialty: "Cardiology", room: "Room 2A" },
  { id: "d5", name: "Dr. Sneha Iyer", initials: "SI", specialty: "Endocrinology", room: "Room 3B" },
];

export const REFERRAL_SPECIALTIES = ["Cardiology", "Pulmonology", "Endocrinology", "Nephrology", "Radiology"];

export function referralsAwaitingAction(refs = DOCTOR_REFERRALS) {
  return refs.filter((r) => r.status === "Pending").length;
}

export function getReferral(id: string) {
  return DOCTOR_REFERRALS.find((r) => r.id === id);
}
