import { getPanelPatient, type PanelPatient } from "@/lib/doctor-patients-apk-data";

export type CalendarVisitStatus = "scheduled" | "in-progress" | "completed" | "cancelled";
export type CalendarVisitMode = "in-person" | "video";

export type DoctorCalendarVisit = {
  id: string;
  date: string;
  time: string;
  durationMin: number;
  patientId: string;
  type: string;
  status: CalendarVisitStatus;
  mode: CalendarVisitMode;
  notes?: string;
  room?: string;
};

/** Seed dates are authored relative to this anchor day; shifted to real "today" at runtime. */
const DEMO_ANCHOR_DATE = "2025-06-22";

const SEED_CALENDAR_VISITS: DoctorCalendarVisit[] = [
  {
    id: "cv-1",
    date: "2025-06-22",
    time: "09:00",
    durationMin: 30,
    patientId: "p4",
    type: "Follow-up",
    status: "in-progress",
    mode: "in-person",
    notes: "Post-PCI rehab clearance · review meds",
    room: "Room 3",
  },
  {
    id: "cv-2",
    date: "2025-06-22",
    time: "09:45",
    durationMin: 30,
    patientId: "p3",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "HbA1c review · adjust metformin",
    room: "Room 3",
  },
  {
    id: "cv-3",
    date: "2025-06-22",
    time: "10:30",
    durationMin: 20,
    patientId: "p1",
    type: "Urgent review",
    status: "scheduled",
    mode: "in-person",
    notes: "Asthma exacerbation · O2 sat check",
    room: "Room 3",
  },
  {
    id: "cv-4",
    date: "2025-06-22",
    time: "11:15",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "scheduled",
    mode: "video",
    notes: "Lipid panel discussion · lifestyle plan",
  },
  {
    id: "cv-5",
    date: "2025-06-20",
    time: "10:00",
    durationMin: 30,
    patientId: "p3",
    type: "Lab review",
    status: "completed",
    mode: "in-person",
    notes: "HbA1c drawn · counselling documented",
    room: "Room 3",
  },
  {
    id: "cv-6",
    date: "2025-06-20",
    time: "11:00",
    durationMin: 20,
    patientId: "p5",
    type: "New visit",
    status: "completed",
    mode: "in-person",
    notes: "COPD action plan · spirometry ordered",
    room: "Room 3",
  },
  {
    id: "cv-7",
    date: "2025-06-18",
    time: "09:30",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "Peak flow diary reviewed",
    room: "Room 3",
  },
  {
    id: "cv-8",
    date: "2025-06-18",
    time: "14:00",
    durationMin: 45,
    patientId: "p2",
    type: "Review",
    status: "completed",
    mode: "video",
    notes: "BP log · amlodipine titration",
  },
  {
    id: "cv-9",
    date: "2025-06-25",
    time: "09:00",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Post-exacerbation check",
    room: "Room 3",
  },
  {
    id: "cv-10",
    date: "2025-06-25",
    time: "10:00",
    durationMin: 30,
    patientId: "p5",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Spirometry results",
    room: "Room 3",
  },
  {
    id: "cv-11",
    date: "2025-06-26",
    time: "11:30",
    durationMin: 20,
    patientId: "p4",
    type: "Review",
    status: "scheduled",
    mode: "in-person",
    notes: "Cardiac rehab progress",
    room: "Room 3",
  },
  {
    id: "cv-12",
    date: "2025-06-28",
    time: "09:15",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "scheduled",
    mode: "video",
    notes: "Repeat lipid panel",
  },
  {
    id: "cv-13",
    date: "2025-06-15",
    time: "10:30",
    durationMin: 30,
    patientId: "p3",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "Diabetes education session",
    room: "Room 3",
  },
  {
    id: "cv-14",
    date: "2025-06-15",
    time: "15:00",
    durationMin: 20,
    patientId: "p4",
    type: "Procedure review",
    status: "completed",
    mode: "in-person",
    notes: "Wound check post-PCI",
    room: "Room 3",
  },
  {
    id: "cv-15",
    date: "2025-06-30",
    time: "09:00",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Maintenance inhaler review",
    room: "Room 3",
  },
  // —— More June 2025 ——
  {
    id: "cv-16",
    date: "2025-06-22",
    time: "14:00",
    durationMin: 30,
    patientId: "p5",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "COPD rescue pack · inhaler technique",
    room: "Room 3",
  },
  {
    id: "cv-17",
    date: "2025-06-22",
    time: "15:00",
    durationMin: 20,
    patientId: "p3",
    type: "Lab review",
    status: "scheduled",
    mode: "video",
    notes: "Fasting glucose log · diet counselling",
  },
  {
    id: "cv-18",
    date: "2025-06-23",
    time: "09:00",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Home BP readings · salt intake review",
    room: "Room 3",
  },
  {
    id: "cv-19",
    date: "2025-06-23",
    time: "10:30",
    durationMin: 45,
    patientId: "p4",
    type: "Cardiac review",
    status: "scheduled",
    mode: "in-person",
    notes: "ECG on file · statin adherence",
    room: "Room 3",
  },
  {
    id: "cv-20",
    date: "2025-06-23",
    time: "14:30",
    durationMin: 30,
    patientId: "p1",
    type: "Nebuliser check",
    status: "scheduled",
    mode: "in-person",
    notes: "Technique review after exacerbation",
    room: "Room 3",
  },
  {
    id: "cv-21",
    date: "2025-06-24",
    time: "09:15",
    durationMin: 30,
    patientId: "p3",
    type: "Diabetes clinic",
    status: "scheduled",
    mode: "in-person",
    notes: "Insulin pen training · foot exam",
    room: "Room 3",
  },
  {
    id: "cv-22",
    date: "2025-06-24",
    time: "11:00",
    durationMin: 20,
    patientId: "p5",
    type: "Review",
    status: "scheduled",
    mode: "video",
    notes: "Rescue inhaler use · action plan update",
  },
  {
    id: "cv-23",
    date: "2025-06-24",
    time: "16:00",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "cancelled",
    mode: "video",
    notes: "Patient requested reschedule — travel conflict",
  },
  {
    id: "cv-24",
    date: "2025-06-25",
    time: "11:30",
    durationMin: 30,
    patientId: "p3",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "CGM download · hypoglycaemia diary",
    room: "Room 3",
  },
  {
    id: "cv-25",
    date: "2025-06-25",
    time: "14:00",
    durationMin: 20,
    patientId: "p4",
    type: "Review",
    status: "scheduled",
    mode: "in-person",
    notes: "Antiplatelet therapy · bruising check",
    room: "Room 3",
  },
  {
    id: "cv-26",
    date: "2025-06-26",
    time: "09:00",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Renal panel review · ACE inhibitor dose",
    room: "Room 3",
  },
  {
    id: "cv-27",
    date: "2025-06-26",
    time: "10:15",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Steroid taper plan · peak flow targets",
    room: "Room 3",
  },
  {
    id: "cv-28",
    date: "2025-06-27",
    time: "09:30",
    durationMin: 45,
    patientId: "p5",
    type: "New visit",
    status: "scheduled",
    mode: "in-person",
    notes: "Post-hospital discharge · COPD bundle",
    room: "Room 3",
  },
  {
    id: "cv-29",
    date: "2025-06-27",
    time: "11:00",
    durationMin: 30,
    patientId: "p3",
    type: "Lab review",
    status: "scheduled",
    mode: "video",
    notes: "Repeat HbA1c · shared care with endocrine",
  },
  {
    id: "cv-30",
    date: "2025-06-28",
    time: "10:00",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Allergy review · avoid aspirin discussion",
    room: "Room 3",
  },
  {
    id: "cv-31",
    date: "2025-06-28",
    time: "11:30",
    durationMin: 20,
    patientId: "p4",
    type: "Review",
    status: "scheduled",
    mode: "in-person",
    notes: "Cardiac rehab week 2 · exercise tolerance",
    room: "Room 3",
  },
  {
    id: "cv-32",
    date: "2025-06-29",
    time: "10:00",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "scheduled",
    mode: "video",
    notes: "Lifestyle goals · weight and activity log",
  },
  {
    id: "cv-33",
    date: "2025-06-16",
    time: "09:00",
    durationMin: 30,
    patientId: "p1",
    type: "Urgent review",
    status: "completed",
    mode: "in-person",
    notes: "Presented with wheeze · nebuliser given",
    room: "Room 3",
  },
  {
    id: "cv-34",
    date: "2025-06-16",
    time: "11:30",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "24h ambulatory BP results discussed",
    room: "Room 3",
  },
  {
    id: "cv-35",
    date: "2025-06-17",
    time: "14:00",
    durationMin: 30,
    patientId: "p5",
    type: "Review",
    status: "completed",
    mode: "in-person",
    notes: "Smoking cessation counselling · patch started",
    room: "Room 3",
  },
  {
    id: "cv-36",
    date: "2025-06-19",
    time: "09:30",
    durationMin: 30,
    patientId: "p4",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "Chest discomfort ruled out · stress test planned",
    room: "Room 3",
  },
  {
    id: "cv-37",
    date: "2025-06-19",
    time: "10:45",
    durationMin: 20,
    patientId: "p1",
    type: "Review",
    status: "completed",
    mode: "in-person",
    notes: "Inhaler spacer technique reinforced",
    room: "Room 3",
  },
  {
    id: "cv-38",
    date: "2025-06-21",
    time: "09:00",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "completed",
    mode: "video",
    notes: "Medication sync · amlodipine refill",
  },
  {
    id: "cv-39",
    date: "2025-06-21",
    time: "11:00",
    durationMin: 30,
    patientId: "p5",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "Rescue pack issued · flu vaccine discussed",
    room: "Room 3",
  },
  {
    id: "cv-40",
    date: "2025-06-30",
    time: "10:30",
    durationMin: 30,
    patientId: "p3",
    type: "Quarterly review",
    status: "scheduled",
    mode: "in-person",
    notes: "Full diabetes review · retinal screen due",
    room: "Room 3",
  },
  {
    id: "cv-41",
    date: "2025-06-30",
    time: "14:00",
    durationMin: 45,
    patientId: "p4",
    type: "Cardiac review",
    status: "scheduled",
    mode: "in-person",
    notes: "Month-1 post-PCI · lipid targets",
    room: "Room 3",
  },
  {
    id: "cv-42",
    date: "2025-06-30",
    time: "15:30",
    durationMin: 20,
    patientId: "p2",
    type: "Review",
    status: "scheduled",
    mode: "video",
    notes: "Home monitoring setup · BP cuff calibration",
  },
  // —— Early July ——
  {
    id: "cv-43",
    date: "2025-07-01",
    time: "09:00",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Post-exacerbation week 2 check",
    room: "Room 3",
  },
  {
    id: "cv-44",
    date: "2025-07-01",
    time: "10:30",
    durationMin: 30,
    patientId: "p5",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Spirometry walk-in slot · results review",
    room: "Room 3",
  },
  {
    id: "cv-45",
    date: "2025-07-02",
    time: "09:15",
    durationMin: 30,
    patientId: "p3",
    type: "Follow-up",
    status: "scheduled",
    mode: "video",
    notes: "Endocrine shared-care handoff",
  },
  {
    id: "cv-46",
    date: "2025-07-03",
    time: "11:00",
    durationMin: 30,
    patientId: "p2",
    type: "Annual review",
    status: "scheduled",
    mode: "in-person",
    notes: "CV risk score · lifestyle prescription",
    room: "Room 3",
  },
  {
    id: "cv-47",
    date: "2025-07-03",
    time: "14:30",
    durationMin: 30,
    patientId: "p4",
    type: "Follow-up",
    status: "scheduled",
    mode: "in-person",
    notes: "Rehab graduation · return-to-work letter",
    room: "Room 3",
  },
  {
    id: "cv-48",
    date: "2025-07-05",
    time: "09:30",
    durationMin: 20,
    patientId: "p1",
    type: "Review",
    status: "scheduled",
    mode: "in-person",
    notes: "Allergy clinic referral follow-up",
    room: "Room 3",
  },
  {
    id: "cv-49",
    date: "2025-06-12",
    time: "10:00",
    durationMin: 30,
    patientId: "p2",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "Initial hypertension workup · labs ordered",
    room: "Room 3",
  },
  {
    id: "cv-50",
    date: "2025-06-12",
    time: "14:00",
    durationMin: 30,
    patientId: "p5",
    type: "New visit",
    status: "completed",
    mode: "in-person",
    notes: "Chronic cough · CXR ordered",
    room: "Room 3",
  },
  {
    id: "cv-51",
    date: "2025-06-14",
    time: "09:30",
    durationMin: 30,
    patientId: "p1",
    type: "Follow-up",
    status: "completed",
    mode: "in-person",
    notes: "Seasonal asthma plan updated",
    room: "Room 3",
  },
  {
    id: "cv-52",
    date: "2025-06-14",
    time: "11:00",
    durationMin: 30,
    patientId: "p3",
    type: "Lab review",
    status: "completed",
    mode: "video",
    notes: "Fasting glucose trend · metformin continued",
  },
];

export function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function shiftSeedDateKey(seedDateKey: string, referenceDate = new Date()) {
  const anchor = parseDateKey(DEMO_ANCHOR_DATE);
  const seed = parseDateKey(seedDateKey);
  if (!anchor || !seed) return seedDateKey;

  const dayOffset = Math.round(
    (startOfDay(seed).getTime() - startOfDay(anchor).getTime()) / 86_400_000,
  );
  const shifted = startOfDay(referenceDate);
  shifted.setDate(shifted.getDate() + dayOffset);
  return formatDateKey(shifted);
}

/** Visits with dates aligned so the demo anchor day is always "today". */
export function getCalendarVisits(referenceDate = new Date()): DoctorCalendarVisit[] {
  return SEED_CALENDAR_VISITS.map((visit) => ({
    ...visit,
    date: shiftSeedDateKey(visit.date, referenceDate),
  }));
}

export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (formatDateKey(date) !== key) return null;
  return date;
}

export function visitsForDate(dateKey: string, referenceDate = new Date()) {
  return getCalendarVisits(referenceDate)
    .filter((v) => v.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function visitCountByDate(referenceDate = new Date()) {
  const counts = new Map<string, number>();
  for (const visit of getCalendarVisits(referenceDate)) {
    counts.set(visit.date, (counts.get(visit.date) ?? 0) + 1);
  }
  return counts;
}

export function patientIdsForDate(dateKey: string, referenceDate = new Date()) {
  const ids = new Set<string>();
  for (const visit of visitsForDate(dateKey, referenceDate)) {
    ids.add(visit.patientId);
  }
  return [...ids];
}

export type CalendarVisitWithPatient = DoctorCalendarVisit & { patient: PanelPatient };

export function visitsWithPatients(
  dateKey: string,
  referenceDate = new Date(),
): CalendarVisitWithPatient[] {
  return visitsForDate(dateKey, referenceDate)
    .map((visit) => {
      const patient = getPanelPatient(visit.patientId);
      if (!patient) return null;
      return { ...visit, patient };
    })
    .filter((v): v is CalendarVisitWithPatient => v != null);
}

export function formatVisitTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
