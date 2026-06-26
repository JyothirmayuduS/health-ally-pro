import type { Doctor } from "@/lib/mock-data";
import { patientMedications } from "@/lib/mock-data";

export const BOOK_SPECIALTIES = [
  "All",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Orthopedics",
  "General Physician",
  "Endocrinology",
] as const;

export type BookSort = "top_rated" | "lowest_fee" | "experience";
export type BookMinRating = 0 | 4 | 4.5 | 4.8;
export type BookMaxFee = 150 | 250 | 350 | 500;

export type BookFilters = {
  sort: BookSort;
  minRating: BookMinRating;
  maxFee: BookMaxFee;
  availableToday: boolean;
};

export const DEFAULT_BOOK_FILTERS: BookFilters = {
  sort: "top_rated",
  minRating: 0,
  maxFee: 500,
  availableToday: false,
};

export const BOOK_DAYS = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

export const VISIT_TYPES = [
  { id: "in_person", label: "In Person" },
  { id: "video", label: "Video Call" },
  { id: "follow_up", label: "Follow-up" },
] as const;

export function doctorFeeRangeInr(doctor: Doctor) {
  const min = Math.min(800, doctor.fee * 6);
  const max = Math.max(900, doctor.fee * 7);
  return { min, max };
}

export function filtersAreActive(filters: BookFilters): boolean {
  return (
    filters.sort !== DEFAULT_BOOK_FILTERS.sort ||
    filters.minRating !== DEFAULT_BOOK_FILTERS.minRating ||
    filters.maxFee !== DEFAULT_BOOK_FILTERS.maxFee ||
    filters.availableToday !== DEFAULT_BOOK_FILTERS.availableToday
  );
}

export function filterDoctors(
  doctors: Doctor[],
  query: string,
  specialty: string,
  filters: BookFilters,
) {
  const q = query.trim().toLowerCase();
  let list = doctors.filter((d) => {
    const matchQ =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.hospital.toLowerCase().includes(q);
    const matchS = specialty === "All" || d.specialty === specialty;
    const matchRating = filters.minRating === 0 || d.rating >= filters.minRating;
    const matchFee = d.fee <= filters.maxFee;
    const matchToday =
      !filters.availableToday || d.nextSlot.toLowerCase().includes("today");
    return matchQ && matchS && matchRating && matchFee && matchToday;
  });

  list = [...list].sort((a, b) => {
    if (filters.sort === "lowest_fee") return a.fee - b.fee;
    if (filters.sort === "experience") return b.experience - a.experience;
    return b.rating - a.rating;
  });

  return list;
}

export function getPastMedsByDoctor(doctorName?: string) {
  return patientMedications.filter(
    (m) =>
      m.status === "past" && (!doctorName || m.prescribedBy === doctorName),
  );
}

export function activeFilterLabels(filters: BookFilters): string[] {
  const labels: string[] = [];
  if (filters.sort !== DEFAULT_BOOK_FILTERS.sort) {
    const map: Record<BookSort, string> = {
      top_rated: "Top rated",
      lowest_fee: "Lowest fee",
      experience: "Experience",
    };
    labels.push(map[filters.sort]);
  }
  if (filters.minRating > 0) labels.push(`${filters.minRating}+ rating`);
  if (filters.maxFee < 500) labels.push(`Under $${filters.maxFee}`);
  if (filters.availableToday) labels.push("Available today");
  return labels;
}
