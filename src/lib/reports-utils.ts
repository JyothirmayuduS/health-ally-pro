import type { Report } from "@/lib/mock-data";

export const REPORT_FILTERS = ["All", "Lab", "Imaging", "Prescription"] as const;
export type ReportFilter = (typeof REPORT_FILTERS)[number];

export type LabResultRow = {
  name: string;
  value: string;
  status: "Normal" | "Borderline" | "Optimal" | "High" | "Low";
};

export type ShareableDoctor = {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  initials: string;
};

export const SHAREABLE_DOCTORS: ShareableDoctor[] = [
  {
    id: "dr-rm",
    name: "Dr. Rajesh Mehta",
    specialty: "Internal Medicine",
    hospital: "Medora Clinic",
    rating: 4.9,
    initials: "RM",
  },
  {
    id: "d1",
    name: "Dr. Eleanor Thorne",
    specialty: "Cardiology",
    hospital: "Oakhaven Medical",
    rating: 4.9,
    initials: "ET",
  },
  {
    id: "d2",
    name: "Dr. Aris Vance",
    specialty: "Neurology",
    hospital: "Riverbend Clinic",
    rating: 4.8,
    initials: "AV",
  },
  {
    id: "d3",
    name: "Dr. Mira Okafor",
    specialty: "Dermatology",
    hospital: "Sage Wellness",
    rating: 4.95,
    initials: "MO",
  },
  {
    id: "d6",
    name: "Dr. Lucien Park",
    specialty: "Endocrinology",
    hospital: "Riverbend Clinic",
    rating: 4.75,
    initials: "LP",
  },
];

const LAB_RESULTS: Record<string, LabResultRow[]> = {
  r1: [
    { name: "Glucose", value: "92 mg/dL", status: "Normal" },
    { name: "HbA1c", value: "5.4 %", status: "Normal" },
    { name: "Cholesterol", value: "186 mg/dL", status: "Normal" },
    { name: "LDL", value: "118 mg/dL", status: "Borderline" },
    { name: "HDL", value: "61 mg/dL", status: "Optimal" },
  ],
  r3: [
    { name: "Total cholesterol", value: "186 mg/dL", status: "Normal" },
    { name: "Triglycerides", value: "98 mg/dL", status: "Normal" },
    { name: "LDL", value: "118 mg/dL", status: "Borderline" },
    { name: "HDL", value: "61 mg/dL", status: "Optimal" },
  ],
  r5: [
    { name: "TSH", value: "6.8 mIU/L", status: "High" },
    { name: "Free T4", value: "0.9 ng/dL", status: "Low" },
    { name: "Vitamin D", value: "28 ng/mL", status: "Borderline" },
    { name: "Vitamin B12", value: "412 pg/mL", status: "Normal" },
  ],
};

export function getLabResultsForReport(reportId: string): LabResultRow[] {
  return LAB_RESULTS[reportId] ?? [];
}

export function reportTypeStyle(type: Report["type"]) {
  if (type === "Lab") {
    return {
      dot: "bg-[#4A8F6A]",
      badge: "bg-[#E8F3EE] text-[#2D6B4F]",
      iconBg: "bg-[#E8F3EE]",
      icon: "text-[#4A8F6A]",
      label: "LAB",
    };
  }
  if (type === "Imaging") {
    return {
      dot: "bg-[#5B8DB8]",
      badge: "bg-[#E8EEF5] text-[#3D6A8F]",
      iconBg: "bg-[#E8EEF5]",
      icon: "text-[#5B8DB8]",
      label: "IMAGING",
    };
  }
  if (type === "Prescription") {
    return {
      dot: "bg-[#B8735D]",
      badge: "bg-clay/15 text-clay",
      iconBg: "bg-clay/10",
      icon: "text-clay",
      label: "RX",
    };
  }
  return {
    dot: "bg-ink-muted",
    badge: "bg-[#F0EDE8] text-ink-muted",
    iconBg: "bg-[#F0EDE8]",
    icon: "text-ink-muted",
    label: type.toUpperCase(),
  };
}

export function labStatusStyle(status: LabResultRow["status"]) {
  if (status === "Borderline") {
    return "bg-[#FFF0E8] text-[#C47A52]";
  }
  if (status === "High" || status === "Low") {
    return "bg-red-50 text-red-600";
  }
  return "bg-[#E8F3EE] text-[#2D6B4F]";
}

export function formatReportDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatReportDateLong(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function filterReports(
  reports: Report[],
  query: string,
  type: ReportFilter,
): Report[] {
  const q = query.trim().toLowerCase();
  return reports.filter((r) => {
    const matchQ =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.doctor.toLowerCase().includes(q);
    const matchT = type === "All" || r.type === type;
    return matchQ && matchT;
  });
}

export function sharedDoctorNames(report: Report, doctors: ShareableDoctor[]): string {
  const names = report.shared
    .map((id) => doctors.find((d) => d.id === id)?.name.split(" ").pop())
    .filter(Boolean);
  return names.join(", ");
}

export function countSharedReports(reports: Report[]): number {
  return reports.filter((r) => r.shared.length > 0).length;
}

/** True for report detail and share-doctor flows (hide mobile bottom nav). */
export function isReportDetailRoute(pathname: string): boolean {
  if (/^\/reports\/share\/[^/]+$/.test(pathname)) return true;
  const match = pathname.match(/^\/reports\/([^/]+)$/);
  if (!match) return false;
  const segment = match[1];
  return segment !== "history" && segment !== "share";
}

export function isDependentDetailRoute(pathname: string): boolean {
  return /^\/profile\/dependents\/[^/]+$/.test(pathname);
}
