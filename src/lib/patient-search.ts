import { dietMeals } from "@/lib/diet-mock-data";
import { formatMacroSummary, getMealNutrition } from "@/lib/diet-nutrition";
import { exerciseRoutines } from "@/lib/exercise-mock-data";
import {
  doctors,
  patientMedications,
  reports,
  type Doctor,
  type PatientMedication,
  type Report,
} from "@/lib/mock-data";

export type PatientSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  category: "doctor" | "report" | "medication" | "diet" | "exercise";
  to: string;
  params?: Record<string, string>;
};

function score(haystack: string, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const h = haystack.toLowerCase();
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 50;
  const tokens = q.split(/\s+/).filter(Boolean);
  const hits = tokens.filter((t) => h.includes(t)).length;
  return hits ? (hits / tokens.length) * 40 : 0;
}

function doctorResults(query: string, list: Doctor[]): PatientSearchResult[] {
  return list
    .map((d) => ({
      item: {
        id: `doc-${d.id}`,
        title: d.name,
        subtitle: `${d.specialty} · ${d.hospital}`,
        category: "doctor" as const,
        to: "/doctors",
      },
      score: score(`${d.name} ${d.specialty} ${d.hospital} ${d.bio}`, query),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

function reportResults(query: string, list: Report[]): PatientSearchResult[] {
  return list
    .map((r) => ({
      item: {
        id: `rep-${r.id}`,
        title: r.title,
        subtitle: `${r.type} · ${r.doctor}`,
        category: "report" as const,
        to: "/reports/$reportId",
        params: { reportId: r.id },
      },
      score: score(`${r.title} ${r.type} ${r.doctor}`, query),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

function medResults(query: string, list: PatientMedication[]): PatientSearchResult[] {
  return list
    .map((m) => ({
      item: {
        id: `med-${m.id}`,
        title: m.name,
        subtitle: `${m.dosage} · ${m.frequency}`,
        category: "medication" as const,
        to: "/medications/$medId",
        params: { medId: m.id },
      },
      score: score(`${m.name} ${m.dosage} ${m.prescribedBy} ${m.reason}`, query),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

function dietResults(query: string): PatientSearchResult[] {
  return dietMeals
    .map((m) => {
      const n = getMealNutrition(m);
      return {
      item: {
        id: `diet-${m.id}`,
        title: m.name,
        subtitle: `${m.mealType} · ${n.calories} kcal · ${formatMacroSummary(n)}`,
        category: "diet" as const,
        to: "/diet/$mealId",
        params: { mealId: m.id },
      },
      score: score(
        `${m.name} ${m.ingredients.join(" ")} ${m.nutrients.join(" ")} ${m.type} ${m.budget}`,
        query,
      ),
    };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

function exerciseResults(query: string): PatientSearchResult[] {
  return exerciseRoutines
    .map((r) => ({
      item: {
        id: `ex-${r.id}`,
        title: r.name,
        subtitle: `${r.category} · ${r.durationMinutes} min · ${r.intensity}`,
        category: "exercise" as const,
        to: "/exercise/$routineId",
        params: { routineId: r.id },
      },
      score: score(
        `${r.name} ${r.clinicalRationale} ${r.targetConditions.join(" ")} ${r.syncedMeds.join(" ")} ${r.keywords.join(" ")}`,
        query,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}

export function searchPatientRecords(
  query: string,
  options?: {
    doctors?: Doctor[];
    reports?: Report[];
    medications?: PatientMedication[];
  },
): PatientSearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const docList = options?.doctors ?? doctors;
  const repList = options?.reports ?? reports;
  const medList =
    options?.medications ?? patientMedications.filter((m) => m.status !== "past");

  return [
    ...doctorResults(q, docList),
    ...reportResults(q, repList),
    ...medResults(q, medList),
    ...dietResults(q),
    ...exerciseResults(q),
  ]
    .slice(0, 12);
}

export const PATIENT_SEARCH_EVENT = "medora-patient-open-search";

export function openPatientSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PATIENT_SEARCH_EVENT));
  }
}
