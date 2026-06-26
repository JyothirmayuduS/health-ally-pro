import { getSharedPatient } from "@/lib/shared/patients";

export type DoctorPatient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  bloodGroup: string;
  photoUrl: string;
  initials: string;
  avatarColor: string;
  lastVisit: string;
};

export type DoctorAppointment = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  notes?: string;
};

export type QueueItem = {
  id: string;
  tokenNumber: number;
  patientId: string;
  status: "waiting" | "in-consultation" | "completed";
  checkInTime: string;
  waitMinutes: number;
};

export type Supplement = {
  id: string;
  index: string;
  name: string;
  tint: string;
  variant?: "jar" | "dropper" | "tube" | "capsule";
  color?: "yellow" | "brown" | "green" | "red" | "blue";
};

export type LabResult = {
  id: string;
  patientId: string;
  testName: string;
  date: string;
  status: "pending" | "abnormal" | "normal";
  summary: string;
};

export const currentDoctor = {
  name: "Tyra Dhillon",
  role: "Doctor",
  specialty: "General Physician",
  initials: "TD",
  photoUrl:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face",
  bio: "Board-certified physician with 12 years of experience in preventive care and chronic disease management.",
};

function ageFromDob(dob?: string) {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const DOCTOR_PATIENT_META: Record<
  string,
  { condition: string; photoUrl: string; avatarColor: string; lastVisit: string }
> = {
  dp1: {
    condition: "Heart failure follow-up",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
    avatarColor: "#E8B4B8",
    lastVisit: "2025-06-15",
  },
  dp2: {
    condition: "Diabetes management",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
    avatarColor: "#B4C8E8",
    lastVisit: "2025-06-18",
  },
  dp3: {
    condition: "Annual wellness check",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
    avatarColor: "#C8E8B4",
    lastVisit: "2025-06-20",
  },
  dp4: {
    condition: "Orthopedic follow-up",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face",
    avatarColor: "#D4B4E8",
    lastVisit: "2025-06-21",
  },
};

export const doctorPatients: DoctorPatient[] = Object.entries(DOCTOR_PATIENT_META).map(
  ([dpId, meta]) => {
    const shared = getSharedPatient(dpId)!;
    return {
      id: dpId,
      name: shared.name,
      age: ageFromDob(shared.dob),
      gender: shared.gender,
      condition: meta.condition,
      bloodGroup: shared.bloodGroup ?? "—",
      photoUrl: meta.photoUrl,
      initials: initials(shared.name),
      avatarColor: meta.avatarColor,
      lastVisit: meta.lastVisit,
    };
  },
);

export const doctorAppointments: DoctorAppointment[] = [
  {
    id: "da1",
    patientId: "dp1",
    date: "2025-06-22",
    time: "09:00",
    duration: 30,
    type: "Follow-up",
    status: "in-progress",
  },
  {
    id: "da2",
    patientId: "dp2",
    date: "2025-06-22",
    time: "09:45",
    duration: 45,
    type: "Follow-up",
    status: "scheduled",
  },
  {
    id: "da3",
    patientId: "dp3",
    date: "2025-06-22",
    time: "10:30",
    duration: 30,
    type: "New Visit",
    status: "scheduled",
  },
  {
    id: "da4",
    patientId: "dp4",
    date: "2025-06-22",
    time: "11:15",
    duration: 20,
    type: "Follow-up",
    status: "scheduled",
  },
];

export const doctorQueue: QueueItem[] = [
  {
    id: "dq1",
    tokenNumber: 101,
    patientId: "dp1",
    status: "in-consultation",
    checkInTime: "08:55",
    waitMinutes: 0,
  },
  {
    id: "dq2",
    tokenNumber: 102,
    patientId: "dp2",
    status: "waiting",
    checkInTime: "09:30",
    waitMinutes: 12,
  },
  {
    id: "dq3",
    tokenNumber: 103,
    patientId: "dp3",
    status: "waiting",
    checkInTime: "10:05",
    waitMinutes: 8,
  },
];

export const supplements: Supplement[] = [
  { id: "s1", index: "01", name: "Fish Oil", tint: "#F5F2ED", variant: "jar", color: "yellow" },
  { id: "s2", index: "02", name: "Vitamin B", tint: "#F5F2ED", variant: "jar", color: "brown" },
  { id: "s3", index: "03", name: "Stamina Booster", tint: "#F5F2ED", variant: "capsule", color: "green" },
  { id: "s4", index: "04", name: "Blood Booster", tint: "#F5F2ED", variant: "tube", color: "red" },
  { id: "s5", index: "05", name: "Skin Medication", tint: "#F5F2ED", variant: "dropper", color: "brown" },
  { id: "s6", index: "06", name: "Bone Medication", tint: "#F5F2ED", variant: "jar", color: "blue" },
];

export type SupplementVariant = "jar" | "dropper" | "tube" | "capsule";

export type LatestVisitDoctor = {
  id: string;
  name: string;
  specialty: string;
  date: string;
  photoUrl: string;
};

export const latestVisitDoctors: LatestVisitDoctor[] = [
  {
    id: "lv1",
    name: "Dr. Naresh Kumar",
    specialty: "Cardiologist",
    date: "15 Nov 2024",
    photoUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&crop=face",
  },
  {
    id: "lv2",
    name: "Dr. Jane Cooper",
    specialty: "Pediatrician",
    date: "2 Nov 2024",
    photoUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=face",
  },
  {
    id: "lv3",
    name: "Dr. Jenny Wilson",
    specialty: "GP",
    date: "13 Oct 2024",
    photoUrl:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=120&h=120&fit=crop&crop=face",
  },
  {
    id: "lv4",
    name: "Dr. Devon Lane",
    specialty: "Neurologist",
    date: "11 Aug 2024",
    photoUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&crop=face",
  },
];

export const labResults: LabResult[] = [
  {
    id: "lr1",
    patientId: "dp1",
    testName: "Lipid Panel",
    date: "2025-06-20",
    status: "abnormal",
    summary: "LDL elevated — review statin therapy",
  },
  {
    id: "lr2",
    patientId: "dp2",
    testName: "HbA1c",
    date: "2025-06-19",
    status: "normal",
    summary: "6.2% — within target range",
  },
];

export const upcomingPatient = {
  name: "Dr. Priscilla",
  specialty: "Dentist",
  photoUrl:
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&h=650&fit=crop&crop=top",
  bio: "Dr. Priscilla is a highly skilled and experienced dentist who has been providing exceptional dental care to her patients for over 10 years.",
  date: "23 Nov",
  time: "12:30 PM",
  duration: 30,
};

export function getDoctorPatient(id: string) {
  return doctorPatients.find((p) => p.id === id);
}
