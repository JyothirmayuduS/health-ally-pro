export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  reviews: number;
  experience: number;
  fee: number;
  nextSlot: string;
  initials: string;
  bio: string;
  gender?: "male" | "female";
};

export type Appointment = {
  id: string;
  doctorId: string;
  date: string; // ISO
  time: string;
  reason: string;
  status: "upcoming" | "in-queue" | "completed" | "cancelled";
  queuePosition?: number;
  queueTotal?: number;
  estimatedWait?: number; // minutes
  room?: string;
  checkInStatus?: string;
};

export type PatientMedication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
  frequency: string;
  /** Short instruction chip e.g. "Empty stomach" */
  reason: string;
  prescribedBy: string;
  clinicalReason?: string;
  instructionTag?: string;
  bestWayToTake?: string;
  sideEffects?: string[];
  interactions?: string[];
  alternatives?: string[];
  pillsRemaining?: number;
  totalPills?: number;
  status?: "active" | "past";
};

export type Report = {
  id: string;
  title: string;
  type: "Lab" | "Imaging" | "Prescription" | "Summary";
  date: string;
  size: string;
  doctor: string;
  shared: string[]; // doctor ids
  notes?: string;
};

export const doctors: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Eleanor Thorne",
    specialty: "Cardiology",
    hospital: "Oakhaven Medical",
    rating: 4.9,
    reviews: 312,
    experience: 14,
    fee: 120,
    nextSlot: "Today, 2:30 PM",
    initials: "ET",
    bio: "Interventional cardiologist focused on preventive heart health and post-operative care.",
    gender: "female",
  },
  {
    id: "d2",
    name: "Dr. Aris Vance",
    specialty: "Neurology",
    hospital: "Riverbend Clinic",
    rating: 4.8,
    reviews: 188,
    experience: 11,
    fee: 140,
    nextSlot: "Tomorrow, 10:00 AM",
    initials: "AV",
    bio: "Specialist in headache disorders, sleep medicine, and cognitive wellness.",
    gender: "male",
  },
  {
    id: "d3",
    name: "Dr. Mira Okafor",
    specialty: "Dermatology",
    hospital: "Sage Wellness",
    rating: 4.95,
    reviews: 421,
    experience: 9,
    fee: 95,
    nextSlot: "Today, 5:15 PM",
    initials: "MO",
    bio: "Cosmetic and medical dermatology with an integrative skin-health approach.",
    gender: "female",
  },
  {
    id: "d4",
    name: "Dr. Henrik Vogel",
    specialty: "Orthopedics",
    hospital: "Oakhaven Medical",
    rating: 4.7,
    reviews: 156,
    experience: 18,
    fee: 160,
    nextSlot: "Fri, 11:30 AM",
    initials: "HV",
    bio: "Joint reconstruction and sports medicine specialist.",
    gender: "male",
  },
  {
    id: "d5",
    name: "Dr. Saanvi Reddy",
    specialty: "General Physician",
    hospital: "Sage Wellness",
    rating: 4.85,
    reviews: 502,
    experience: 7,
    fee: 60,
    nextSlot: "Today, 3:00 PM",
    initials: "SR",
    bio: "Primary care with focus on preventive medicine and chronic care.",
    gender: "female",
  },
  {
    id: "d6",
    name: "Dr. Lucien Park",
    specialty: "Endocrinology",
    hospital: "Riverbend Clinic",
    rating: 4.75,
    reviews: 97,
    experience: 13,
    fee: 130,
    nextSlot: "Mon, 9:45 AM",
    initials: "LP",
    bio: "Diabetes, thyroid, and hormonal health specialist.",
    gender: "male",
  },
];

export const appointments: Appointment[] = [
  {
    id: "a1",
    doctorId: "d3",
    date: "2026-05-28T10:15:00.000Z",
    time: "3:15 PM",
    reason: "Dermatology consultation",
    status: "in-queue",
    queuePosition: 3,
    queueTotal: 6,
    estimatedWait: 12,
    room: "Derm Suite 4B",
    checkInStatus: "Checked in · Vitals complete",
  },
  {
    id: "a2",
    doctorId: "d3",
    date: "2026-05-29T12:15:00.000Z",
    time: "5:15 PM",
    reason: "Annual skin screening",
    status: "upcoming",
  },
  {
    id: "a3",
    doctorId: "d5",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    time: "11:00 AM",
    reason: "General check-up",
    status: "completed",
  },
];

export const patientMedications: PatientMedication[] = [
  {
    id: "m1",
    name: "Levothyroxine",
    dosage: "50mcg",
    time: "8:00 AM",
    taken: true,
    frequency: "Daily",
    reason: "Empty stomach",
    clinicalReason: "Hypothyroidism management",
    instructionTag: "Empty stomach",
    prescribedBy: "Dr. Lucien Park",
    bestWayToTake:
      "Take on a strictly empty stomach, at least 30 to 60 minutes before breakfast. Separate from any calcium, iron, or magnesium supplements by at least 4 hours.",
    sideEffects: [
      "Palpitations (if dose exceeds need)",
      "Heat sensitivity / excessive sweating",
      "Mild insomnia or tremors",
    ],
    interactions: [
      "Calcium, Iron, and Magnesium supplements",
      "Proton Pump Inhibitors (PPIs)",
      "Coffee (reduces absorption by 20%)",
    ],
    alternatives: ["Liothyronine (T3)", "Desiccated Thyroid Extract (DTE)"],
    pillsRemaining: 4,
    totalPills: 30,
  },
  {
    id: "m2",
    name: "Vitamin D3 (Cholecalciferol)",
    dosage: "2000 IU",
    time: "8:00 AM",
    taken: false,
    frequency: "Daily",
    reason: "With food",
    clinicalReason: "Vitamin D deficiency",
    instructionTag: "With food",
    prescribedBy: "Dr. Saanvi Reddy",
    bestWayToTake:
      "Vitamin D is fat-soluble. Take it alongside a meal containing healthy fats for best absorption.",
    sideEffects: ["Nausea at excessive doses", "Hypercalcemia (rare)"],
    interactions: ["Thiazide diuretics", "Steroids (prednisone)"],
    alternatives: ["Increased sunlight exposure", "Fatty fish (Salmon)"],
    pillsRemaining: 45,
    totalPills: 60,
  },
  {
    id: "m3",
    name: "Magnesium Glycinate",
    dosage: "200mg",
    time: "9:00 PM",
    taken: false,
    frequency: "Daily",
    reason: "Before bed",
    clinicalReason: "Sleep & muscle recovery",
    instructionTag: "Before bed",
    prescribedBy: "Dr. Saanvi Reddy",
    bestWayToTake: "Take 1 to 2 hours before bedtime. Gentle on the stomach.",
    sideEffects: ["Mild GI upset (rare with glycinate)"],
    interactions: ["Antibiotics", "Bisphosphonates"],
    alternatives: ["Magnesium Citrate", "Magnesium L-Threonate"],
    pillsRemaining: 18,
    totalPills: 30,
  },
  {
    id: "m4",
    name: "Metformin ER",
    dosage: "500mg",
    time: "Dinner",
    taken: false,
    frequency: "Daily",
    reason:
      "Insulin resistance management often linked with Hashimoto's metabolic decline.",
    clinicalReason:
      "Insulin resistance management often linked with Hashimoto's metabolic decline.",
    prescribedBy: "Dr. Eleanor Thorne",
    status: "past",
  },
  {
    id: "m5",
    name: "Selenium (Selenomethionine)",
    dosage: "200mcg",
    time: "Morning",
    taken: true,
    frequency: "Daily",
    reason: "Antibody reduction (TPO) and cellular antioxidant defense.",
    clinicalReason: "Antibody reduction (TPO) and cellular antioxidant defense.",
    prescribedBy: "Dr. Saanvi Reddy",
    status: "past",
  },
];

export const reports: Report[] = [
  {
    id: "r1",
    title: "Comprehensive Metabolic Panel",
    type: "Lab",
    date: "2024-10-08",
    size: "2.4 MB",
    doctor: "Dr. Saanvi Reddy",
    shared: [],
  },
  {
    id: "r2",
    title: "Cardiac MRI Summary",
    type: "Imaging",
    date: "2024-09-12",
    size: "18.1 MB",
    doctor: "Dr. Eleanor Thorne",
    shared: [],
  },
  {
    id: "r3",
    title: "Lipid Profile Analysis",
    type: "Lab",
    date: "2024-08-02",
    size: "1.1 MB",
    doctor: "Dr. Saanvi Reddy",
    shared: ["d1", "d6"],
  },
  {
    id: "r4",
    title: "Dermoscopy Imaging",
    type: "Imaging",
    date: "2024-07-19",
    size: "12.6 MB",
    doctor: "Dr. Mira Okafor",
    shared: [],
  },
  {
    id: "r5",
    title: "Vitamin D & B12 Panel",
    type: "Lab",
    date: "2024-06-04",
    size: "0.8 MB",
    doctor: "Dr. Saanvi Reddy",
    shared: ["d5"],
  },
];

export const patient = {
  name: "Jyothirmayudu S",
  initials: "JS",
  email: "jyothirmayudu@medora.health",
  memberSince: "2023",
  age: 28,
  bloodGroup: "B+",
};
