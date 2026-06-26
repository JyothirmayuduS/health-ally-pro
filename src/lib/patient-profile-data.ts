import type { QueuePersona } from "@/lib/patient-queue";

export type DependentRelation = "Child" | "Parent" | "Spouse" | "Other";

export type DependentVital = {
  label: string;
  value: string;
  at: string;
};

export type DependentMedicationToday = {
  id: string;
  name: string;
  detail: string;
  taken: boolean;
};

export type DependentAppointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: "upcoming" | "completed";
};

export type DependentReport = {
  id: string;
  title: string;
  type: string;
  date: string;
};

export type Dependent = {
  id: string;
  name: string;
  initials: string;
  relation: DependentRelation;
  age: number;
  bloodGroup: string;
  persona: QueuePersona;
  avatarColor: string;
  adherence: number;
  carePlan: string;
  primaryDoctor: string;
  primarySpecialty: string;
  nextConsultation: string;
  medicationsToday: string;
  conditions: string[];
  allergies: string[];
  appointments: DependentAppointment[];
  medications: { id: string; name: string; detail: string }[];
  reports: DependentReport[];
  lastVisit: string;
  medsTakenToday: number;
  medsTotalToday: number;
  medicationsTodayList: DependentMedicationToday[];
  vitals: DependentVital[];
  emergencyContact: string;
  insurance: string;
  careNotes: string;
};

export const PATIENT_IDENTITY = {
  patientId: "MED-0842-X",
  name: "Jyothirmayudu S",
  initials: "JS",
  email: "clara.w@medora.health",
  phone: "+1 (555) 012-3456",
  memberSince: "2022",
  age: 34,
  bloodGroup: "O+",
};

export const PROFILE_PREFERENCES = [
  {
    id: "reminders",
    title: "Appointment reminders",
    description: "1 hour before each visit",
    defaultOn: true,
  },
  {
    id: "insights",
    title: "Health insights",
    description: "Weekly digest of your trends",
    defaultOn: false,
  },
  {
    id: "2fa",
    title: "Two-factor auth",
    description: "Required for sharing reports",
    defaultOn: true,
  },
] as const;

export const PROFILE_ACCOUNT_LINKS = [
  { id: "messages", label: "Messages", to: "/profile/messages" as const },
  { id: "notifications", label: "Notifications", to: "/profile/notifications" as const },
  { id: "book", label: "Book appointment", to: "/book" as const },
  { id: "privacy", label: "Privacy & blockchain", to: "/profile/privacy" as const },
  { id: "support", label: "Contact support", to: "/profile/support" as const },
  { id: "terms", label: "Terms & Conditions", to: "/profile/terms" as const },
] as const;

export const DEPENDENTS: Dependent[] = [
  {
    id: "mila",
    name: "Mila",
    initials: "M",
    relation: "Child",
    age: 7,
    bloodGroup: "A+",
    persona: "girl",
    avatarColor: "bg-[#5B8DB8]",
    adherence: 88,
    carePlan: "Asthma Auto-Injector & Seasonal Vaccines",
    primaryDoctor: "Dr. Priya Nair",
    primarySpecialty: "Pediatrics",
    nextConsultation: "Oct 22, 10:30 AM · Pediatrics",
    medicationsToday: "2/3 taken · Albuterol HFA, Fluticasone…",
    conditions: ["Mild persistent asthma", "Seasonal allergies"],
    allergies: ["Peanuts", "Dust mites"],
    appointments: [
      {
        id: "a1",
        title: "Visit with Dr. Mira Okafor",
        date: "May 29, 2026",
        time: "5:15 PM",
        status: "upcoming",
      },
      {
        id: "a2",
        title: "Visit with Dr. Saanvi Reddy",
        date: "May 26, 2026",
        time: "11:00 AM",
        status: "completed",
      },
    ],
    medications: [
      { id: "m1", name: "Albuterol HFA", detail: "2 puffs · PRN wheezing" },
      { id: "m2", name: "Fluticasone", detail: "50 mcg · Once daily evening" },
      { id: "m3", name: "Cetirizine", detail: "5 mg · Morning during pollen season" },
    ],
    reports: [
      { id: "r1", title: "Spirometry & Peak Flow", type: "Pulmonary", date: "Oct 8, 2024" },
      { id: "r5", title: "Allergy IgE Panel", type: "Lab", date: "Jun 4, 2024" },
    ],
    lastVisit: "Sep 12, 2025",
    medsTakenToday: 2,
    medsTotalToday: 3,
    medicationsTodayList: [
      { id: "t1", name: "Albuterol HFA", detail: "2 puffs PRN · As needed", taken: true },
      { id: "t2", name: "Fluticasone", detail: "50mcg · 8:00 PM daily", taken: true },
      { id: "t3", name: "Cetirizine", detail: "5mg · Morning", taken: false },
    ],
    vitals: [
      { label: "PEAK FLOW", value: "92%", at: "Today 7:40 AM" },
      { label: "SPO₂", value: "98%", at: "Today 7:40 AM" },
      { label: "WEIGHT", value: "24.1 kg", at: "Sep 12 visit" },
    ],
    emergencyContact: "Raj (Father) · +1 555-0142",
    insurance: "FAM-MILA-8841",
    careNotes: "Carry rescue inhaler to school. Peak-flow log shared with school nurse.",
  },
  {
    id: "arthur",
    name: "Arthur",
    initials: "AT",
    relation: "Parent",
    age: 68,
    bloodGroup: "B+",
    persona: "elderly-man",
    avatarColor: "bg-[#8B6BB8]",
    adherence: 72,
    carePlan: "Cardiac Rehab & Blood Pressure Monitoring",
    primaryDoctor: "Dr. Eleanor Thorne",
    primarySpecialty: "Cardiology",
    nextConsultation: "Tomorrow, 2:00 PM · Cardiology",
    medicationsToday: "2/3 taken · Amlodipine, Metoprolol…",
    conditions: ["Hypertension", "Post-MI recovery (2023)"],
    allergies: ["Penicillin"],
    appointments: [
      {
        id: "a3",
        title: "Visit with Dr. Eleanor Thorne",
        date: "Jun 23, 2026",
        time: "2:00 PM",
        status: "upcoming",
      },
    ],
    medications: [
      { id: "m4", name: "Amlodipine", detail: "5 mg · Once daily morning" },
      { id: "m5", name: "Metoprolol succinate", detail: "25 mg · Twice daily" },
      { id: "m6", name: "Atorvastatin", detail: "10 mg · At bedtime" },
    ],
    reports: [
      { id: "r2", title: "Cardiac MRI Summary", type: "Imaging", date: "Sep 12, 2024" },
    ],
    lastVisit: "Jun 10, 2026",
    medsTakenToday: 2,
    medsTotalToday: 3,
    medicationsTodayList: [
      { id: "t4", name: "Amlodipine", detail: "5mg · Morning", taken: true },
      { id: "t5", name: "Metoprolol", detail: "25mg · Morning & evening", taken: true },
      { id: "t6", name: "Atorvastatin", detail: "10mg · Bedtime", taken: false },
    ],
    vitals: [
      { label: "BP", value: "128/82", at: "Today 8:10 AM" },
      { label: "HR", value: "72 bpm", at: "Today 8:10 AM" },
    ],
    emergencyContact: "Jyothirmayudu S · +1 555-012-3456",
    insurance: "FAM-ARTHUR-2201",
    careNotes: "Monitor blood pressure daily. Cardiac rehab sessions twice weekly.",
  },
];

export function getDependent(id: string): Dependent | undefined {
  return DEPENDENTS.find((d) => d.id === id);
}

export function relationTag(dep: Dependent) {
  return `${dep.relation.toUpperCase()} · ${dep.age}Y`;
}
