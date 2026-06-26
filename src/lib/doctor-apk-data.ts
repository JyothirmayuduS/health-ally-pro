export const apkDoctor = {
  name: "Dr. Rajesh Mehta",
  shortName: "Dr. Rajesh",
  specialty: "Internal Medicine",
  initials: "RM",
  email: "dr.mehta@clinic.in",
  rating: 4.9,
  scheduleSlots: 8,
};

export type ApkShortcut = {
  id: string;
  label: string;
  to: string;
  bg: string;
  icon: "pill" | "clock" | "users" | "file" | "grid";
};

export const apkShortcuts: ApkShortcut[] = [
  { id: "rx", label: "Prescribe", to: "/doctor/prescriptions", bg: "#F0DDD6", icon: "pill" },
  { id: "queue", label: "Queue", to: "/doctor/queue", bg: "#EDEAE6", icon: "clock" },
  { id: "patients", label: "Patients", to: "/doctor/patients", bg: "#E8EFE6", icon: "users" },
  { id: "reports", label: "Inbox", to: "/doctor/reports", bg: "#EDEAE6", icon: "file" },
  { id: "visits", label: "Visits", to: "/doctor/schedule", bg: "#F0DDD6", icon: "grid" },
];

export type ApkUpNextVisit = {
  id: string;
  time: string;
  shortTime: string;
  patient: string;
  initials: string;
  reason: string;
  status: "Pending" | "Urgent" | "Confirmed";
  mode: "In-person" | "Telehealth";
};

export const apkTodayVisits: ApkUpNextVisit[] = [
  {
    id: "v1",
    time: "10:30",
    shortTime: "10:30",
    patient: "Arjun Kapoor",
    initials: "AK",
    reason: "Blood pressure review — home readings elevated",
    status: "Pending",
    mode: "In-person",
  },
  {
    id: "v2",
    time: "11:15",
    shortTime: "11:15",
    patient: "Sneha Rao",
    initials: "SR",
    reason: "Asthma follow-up — inhaler technique check",
    status: "Urgent",
    mode: "In-person",
  },
  {
    id: "v3",
    time: "14:00",
    shortTime: "14:00",
    patient: "Mohammad Ali",
    initials: "MA",
    reason: "Diabetes review — HbA1c discussion",
    status: "Pending",
    mode: "In-person",
  },
  {
    id: "v4",
    time: "15:30",
    shortTime: "15:30",
    patient: "Priya Sharma",
    initials: "PS",
    reason: "Lab results review — HbA1c + fasting glucose",
    status: "Pending",
    mode: "In-person",
  },
];

export const apkClinicOverview = [
  {
    id: "visits",
    value: "5",
    label: "Visits today",
    hint: "1 completed",
    icon: "calendar" as const,
    iconBg: "#EDEAE6",
    valueColor: "#1B3B2E",
  },
  {
    id: "tasks",
    value: "2",
    label: "Open tasks",
    hint: "Needs action",
    icon: "clipboard" as const,
    iconBg: "#F0DDD6",
    valueColor: "#B8735D",
  },
  {
    id: "queue",
    value: "5",
    label: "Queue",
    hint: "2 pending",
    icon: "clock" as const,
    iconBg: "#F0DDD6",
    valueColor: "#B8735D",
  },
  {
    id: "rating",
    value: "4.9",
    label: "Rating",
    hint: "Patient feedback",
    icon: "star" as const,
    iconBg: "#E8EFE6",
    valueColor: "#1B3B2E",
  },
];

export const apkEndOfDay = {
  finishBy: "17:30",
  remaining: 4,
  lastSlot: "15:30",
  progress: 1,
  total: 6,
};

export type ApkLabItem = {
  id: string;
  patient: string;
  initials: string;
  test: string;
  status: "Released" | "Processing" | "Ordered";
  time: string;
};

export const apkLabQueue: ApkLabItem[] = [
  {
    id: "l1",
    patient: "Priya Sharma",
    initials: "PS",
    test: "HbA1c + Fasting glucose",
    status: "Released",
    time: "09:40",
  },
  {
    id: "l2",
    patient: "Mohammad Ali",
    initials: "MA",
    test: "Lipid panel",
    status: "Processing",
    time: "08:15",
  },
  {
    id: "l3",
    patient: "Arjun Kapoor",
    initials: "AK",
    test: "CBC + Renal panel",
    status: "Ordered",
    time: "07:50",
  },
];

export const apkPanelHealth = {
  activePatients: 142,
  chronicCare: 12,
  followUpDue: 8,
  adherence: 87,
};

export type ApkAttentionItem = {
  id: string;
  title: string;
  subtitle: string;
  severity: "urgent" | "warning" | "info";
  initials: string;
};

export const apkNeedsAttention: ApkAttentionItem[] = [
  {
    id: "a1",
    title: "Asthma exacerbation risk",
    subtitle: "Sneha Rao — peak flow down 22%",
    severity: "urgent",
    initials: "SR",
  },
  {
    id: "a2",
    title: "Lab result flagged",
    subtitle: "Priya Sharma — HbA1c 8.2%",
    severity: "warning",
    initials: "PS",
  },
  {
    id: "a3",
    title: "Referral pending sign-off",
    subtitle: "Mohammad Ali — endocrinology",
    severity: "info",
    initials: "MA",
  },
];

export type ApkActivityItem = {
  id: string;
  text: string;
  time: string;
  type: "visit" | "lab" | "rx" | "message";
};

export const apkActivity: ApkActivityItem[] = [
  { id: "act1", text: "Confirmed visit with Arjun Kapoor", time: "2m ago", type: "visit" },
  { id: "act2", text: "Lab results released for Priya Sharma", time: "15m ago", type: "lab" },
  { id: "act3", text: "Prescription sent to pharmacy — Jane Cooper", time: "1h ago", type: "rx" },
  { id: "act4", text: "Secure message from Sneha Rao", time: "2h ago", type: "message" },
];

export type ApkTimelineItem = {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  state: "done" | "current" | "upcoming";
};

export const apkTimeline: ApkTimelineItem[] = [
  { id: "t0", time: "09:00", title: "Team huddle", state: "done" },
  {
    id: "t1",
    time: "10:30",
    title: "Arjun Kapoor",
    subtitle: "Blood pressure review",
    state: "current",
  },
  {
    id: "t2",
    time: "11:15",
    title: "Sneha Rao",
    subtitle: "Asthma follow-up",
    state: "upcoming",
  },
  {
    id: "t3",
    time: "14:00",
    title: "Mohammad Ali",
    subtitle: "Diabetes review",
    state: "upcoming",
  },
  {
    id: "t4",
    time: "15:30",
    title: "Priya Sharma",
    subtitle: "Lab results review",
    state: "upcoming",
  },
];

export type ApkTaskItem = {
  id: string;
  title: string;
  due: string;
  urgent?: boolean;
};

export const apkTasks: ApkTaskItem[] = [
  { id: "tk1", title: "Sign off Sneha Rao encounter notes", due: "Due today", urgent: true },
  { id: "tk2", title: "Review Priya Sharma lab results", due: "Due today", urgent: true },
  { id: "tk3", title: "Complete referral for Mohammad Ali", due: "Tomorrow" },
];

export type ApkRxItem = {
  id: string;
  drug: string;
  patient: string;
  initials: string;
  when: string;
};

export const apkRecentRx: ApkRxItem[] = [
  { id: "rx1", drug: "Lisinopril 10 mg", patient: "Arjun Kapoor", initials: "AK", when: "Today 09:15" },
  { id: "rx2", drug: "Salbutamol inhaler", patient: "Sneha Rao", initials: "SR", when: "Yesterday" },
  { id: "rx3", drug: "Metformin 500 mg", patient: "Mohammad Ali", initials: "MA", when: "2 days ago" },
];

export const DOCTOR_APK_TABS = [
  { to: "/doctor", label: "Home", icon: "home" as const, exact: true },
  { to: "/doctor/patients", label: "Patients", icon: "users" as const },
  { to: "/doctor/queue", label: "Queue", icon: "clock" as const },
  { to: "/doctor/reports", label: "Inbox", icon: "file" as const },
  { to: "/doctor/settings", label: "Profile", icon: "user" as const },
] as const;
