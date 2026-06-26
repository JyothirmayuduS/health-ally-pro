import type { Doctor } from "@/lib/mock-data";

export type DoctorGender = "male" | "female";

const FEMALE_FIRST_NAMES = new Set([
  "eleanor",
  "mira",
  "saanvi",
  "sarah",
  "emma",
  "olivia",
  "sophia",
  "priya",
  "lisa",
  "maria",
]);

export function doctorGenderFor(doctor: Pick<Doctor, "name" | "gender">): DoctorGender {
  if (doctor.gender) return doctor.gender;
  const first = doctor.name.replace(/^Dr\.?\s*/i, "").split(/\s+/)[0]?.toLowerCase() ?? "";
  return FEMALE_FIRST_NAMES.has(first) ? "female" : "male";
}
