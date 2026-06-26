export type QueueStatus = "waiting" | "in-consultation" | "completed" | "cancelled";

export type ReceptionPatient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  address: string;
  insuranceProvider: string;
  insuranceId: string;
  balanceDue: number;
  condition: string;
  visitStatus: QueueStatus;
  registeredAt: string;
  avatarColor: string;
  initials: string;
  photoUrl: string;
  emergencyContact: string;
  notes?: string;
};

export type ReceptionDoctor = {
  id: string;
  name: string;
  specialty: string;
  room: string;
  initials: string;
  avatarColor: string;
  photoUrl: string;
  bio?: string;
};

export type QueueEntry = {
  id: string;
  tokenNumber: number;
  patientId: string;
  doctorId: string;
  status: QueueStatus;
  checkInTime: string;
  waitMinutes: number;
  appointmentId?: string;
};

export type ReceptionAppointment = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  type: "New Visit" | "Follow-up" | "Emergency" | "Lab Review";
  status: "scheduled" | "checked-in" | "in-progress" | "completed" | "cancelled" | "no-show";
  notes?: string;
};

export const receptionist = {
  name: "Priya Sharma",
  role: "Receptionist",
  initials: "PS",
  email: "priya.sharma@medora.health",
};

export const receptionDoctors: ReceptionDoctor[] = [
  {
    id: "rd1",
    name: "Dr. Eleanor Pena",
    specialty: "Cardiology",
    room: "201",
    initials: "EP",
    avatarColor: "#7C9EB2",
    photoUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=520&fit=crop&crop=face",
    bio: "Interventional cardiologist focused on preventive heart health and compassionate outpatient care.",
  },
  {
    id: "rd2",
    name: "Dr. Marcus Chen",
    specialty: "General Medicine",
    room: "105",
    initials: "MC",
    avatarColor: "#8B9DC3",
    photoUrl:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=520&fit=crop&crop=face",
    bio: "Primary care physician specializing in chronic disease management and wellness visits.",
  },
  {
    id: "rd3",
    name: "Dr. Sarah Williams",
    specialty: "Pediatrics",
    room: "302",
    initials: "SW",
    avatarColor: "#A8C686",
    photoUrl:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=520&fit=crop&crop=face",
    bio: "Pediatrician dedicated to family-centered care and developmental health.",
  },
  {
    id: "rd4",
    name: "Dr. James Okonkwo",
    specialty: "Orthopedics",
    room: "210",
    initials: "JO",
    avatarColor: "#C4A882",
    photoUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=520&fit=crop&crop=face",
    bio: "Orthopedic specialist in sports medicine and joint rehabilitation.",
  },
];

export const receptionPatients: ReceptionPatient[] = [
  {
    id: "p1",
    name: "Jane Cooper",
    phone: "+1 (555) 234-8901",
    email: "jane.cooper@email.com",
    dateOfBirth: "1985-03-12",
    gender: "Female",
    bloodGroup: "A+",
    address: "742 Evergreen Terrace, Springfield",
    insuranceProvider: "BlueCross Premier",
    insuranceId: "BC-8847291",
    balanceDue: 0,
    condition: "Heart failure follow-up",
    visitStatus: "waiting",
    registeredAt: "2025-06-22",
    avatarColor: "#E8B4B8",
    initials: "JC",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
    emergencyContact: "Robert Cooper — +1 (555) 234-8902",
    notes: "Prefers morning appointments. Allergic to penicillin.",
  },
  {
    id: "p2",
    name: "Robert Fox",
    phone: "+1 (555) 876-5432",
    email: "robert.fox@email.com",
    dateOfBirth: "1972-08-24",
    gender: "Male",
    bloodGroup: "O+",
    address: "128 Oak Street, Portland",
    insuranceProvider: "Aetna Health",
    insuranceId: "AE-3321045",
    balanceDue: 150,
    condition: "Diabetes management",
    visitStatus: "in-consultation",
    registeredAt: "2025-06-20",
    avatarColor: "#B4C8E8",
    initials: "RF",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
    emergencyContact: "Linda Fox — +1 (555) 876-5433",
  },
  {
    id: "p3",
    name: "Leslie Alexander",
    phone: "+1 (555) 445-6677",
    email: "leslie.alex@email.com",
    dateOfBirth: "1990-11-05",
    gender: "Female",
    bloodGroup: "B+",
    address: "55 Maple Ave, Austin",
    insuranceProvider: "United Healthcare",
    insuranceId: "UH-9912034",
    balanceDue: 0,
    condition: "Annual wellness check",
    visitStatus: "waiting",
    registeredAt: "2025-06-22",
    avatarColor: "#C8E8B4",
    initials: "LA",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
    emergencyContact: "Mark Alexander — +1 (555) 445-6678",
  },
  {
    id: "p4",
    name: "Jacob Jones",
    phone: "+1 (555) 112-3344",
    email: "jacob.jones@email.com",
    dateOfBirth: "1968-01-18",
    gender: "Male",
    bloodGroup: "AB-",
    address: "901 Pine Road, Denver",
    insuranceProvider: "Cigna",
    insuranceId: "CI-4456789",
    balanceDue: 320,
    condition: "Chronic back pain",
    visitStatus: "completed",
    registeredAt: "2025-06-18",
    avatarColor: "#E8D4B4",
    initials: "JJ",
    photoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",
    emergencyContact: "Susan Jones — +1 (555) 112-3345",
  },
  {
    id: "p5",
    name: "Kristin Watson",
    phone: "+1 (555) 998-7766",
    email: "kristin.w@email.com",
    dateOfBirth: "1995-07-30",
    gender: "Female",
    bloodGroup: "A-",
    address: "33 Birch Lane, Seattle",
    insuranceProvider: "Kaiser Permanente",
    insuranceId: "KP-2234567",
    balanceDue: 0,
    condition: "Pediatric follow-up",
    visitStatus: "waiting",
    registeredAt: "2025-06-22",
    avatarColor: "#D4B4E8",
    initials: "KW",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face",
    emergencyContact: "Tom Watson — +1 (555) 998-7767",
  },
  {
    id: "p6",
    name: "Cameron Williamson",
    phone: "+1 (555) 667-8899",
    email: "cam.williamson@email.com",
    dateOfBirth: "1980-12-14",
    gender: "Male",
    bloodGroup: "O-",
    address: "412 Cedar Blvd, Chicago",
    insuranceProvider: "Humana",
    insuranceId: "HU-7789012",
    balanceDue: 75,
    condition: "Orthopedic consultation",
    visitStatus: "cancelled",
    registeredAt: "2025-06-15",
    avatarColor: "#B4E8E8",
    initials: "CW",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
    emergencyContact: "Diana Williamson — +1 (555) 667-8900",
  },
];

export const initialQueue: QueueEntry[] = [
  {
    id: "q1",
    tokenNumber: 101,
    patientId: "p1",
    doctorId: "rd1",
    status: "in-consultation",
    checkInTime: "09:15",
    waitMinutes: 0,
    appointmentId: "a1",
  },
  {
    id: "q2",
    tokenNumber: 102,
    patientId: "p3",
    doctorId: "rd1",
    status: "waiting",
    checkInTime: "09:42",
    waitMinutes: 18,
    appointmentId: "a3",
  },
  {
    id: "q3",
    tokenNumber: 103,
    patientId: "p5",
    doctorId: "rd3",
    status: "waiting",
    checkInTime: "10:05",
    waitMinutes: 12,
    appointmentId: "a5",
  },
  {
    id: "q4",
    tokenNumber: 104,
    patientId: "p2",
    doctorId: "rd2",
    status: "in-consultation",
    checkInTime: "09:30",
    waitMinutes: 0,
    appointmentId: "a2",
  },
  {
    id: "q5",
    tokenNumber: 105,
    patientId: "p4",
    doctorId: "rd4",
    status: "waiting",
    checkInTime: "10:18",
    waitMinutes: 8,
    appointmentId: "a4",
  },
  {
    id: "q6",
    tokenNumber: 106,
    patientId: "p6",
    doctorId: "rd2",
    status: "waiting",
    checkInTime: "10:25",
    waitMinutes: 5,
    appointmentId: "a6",
  },
];

export const receptionAppointments: ReceptionAppointment[] = [
  {
    id: "a1",
    patientId: "p1",
    doctorId: "rd1",
    date: "2025-06-22",
    time: "09:00",
    duration: 30,
    type: "Follow-up",
    status: "in-progress",
  },
  {
    id: "a2",
    patientId: "p2",
    doctorId: "rd2",
    date: "2025-06-22",
    time: "09:30",
    duration: 45,
    type: "Follow-up",
    status: "in-progress",
  },
  {
    id: "a3",
    patientId: "p3",
    doctorId: "rd1",
    date: "2025-06-22",
    time: "10:00",
    duration: 30,
    type: "New Visit",
    status: "checked-in",
  },
  {
    id: "a4",
    patientId: "p4",
    doctorId: "rd4",
    date: "2025-06-22",
    time: "10:15",
    duration: 30,
    type: "Follow-up",
    status: "checked-in",
  },
  {
    id: "a5",
    patientId: "p5",
    doctorId: "rd3",
    date: "2025-06-22",
    time: "10:30",
    duration: 20,
    type: "Follow-up",
    status: "checked-in",
  },
  {
    id: "a6",
    patientId: "p6",
    doctorId: "rd2",
    date: "2025-06-22",
    time: "10:45",
    duration: 30,
    type: "New Visit",
    status: "checked-in",
  },
  {
    id: "a7",
    patientId: "p1",
    doctorId: "rd1",
    date: "2025-06-22",
    time: "14:00",
    duration: 30,
    type: "Lab Review",
    status: "scheduled",
  },
  {
    id: "a8",
    patientId: "p3",
    doctorId: "rd3",
    date: "2025-06-22",
    time: "15:30",
    duration: 30,
    type: "New Visit",
    status: "scheduled",
  },
];

export function getPatientById(id: string) {
  return receptionPatients.find((p) => p.id === id);
}

export function getDoctorById(id: string) {
  return receptionDoctors.find((d) => d.id === id);
}

export function getTodayStats() {
  const today = "2025-06-22";
  const todayAppts = receptionAppointments.filter((a) => a.date === today);
  return {
    totalAppointments: todayAppts.length,
    checkedIn: todayAppts.filter((a) =>
      ["checked-in", "in-progress", "completed"].includes(a.status),
    ).length,
    waiting: initialQueue.filter((q) => q.status === "waiting").length,
    inConsultation: initialQueue.filter((q) => q.status === "in-consultation").length,
    completed: todayAppts.filter((a) => a.status === "completed").length,
    newPatients: receptionPatients.filter((p) => p.registeredAt === today).length,
  };
}

export const statusLabels: Record<QueueStatus, string> = {
  waiting: "Waiting",
  "in-consultation": "In Consultation",
  completed: "Completed",
  cancelled: "Cancelled",
};
