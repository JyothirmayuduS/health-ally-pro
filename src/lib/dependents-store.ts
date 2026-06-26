import type { QueuePersona } from "@/lib/patient-queue";
import {
  DEPENDENTS as SEED_DEPENDENTS,
  type Dependent,
  type DependentRelation,
} from "@/lib/patient-profile-data";

const STORAGE_KEY = "medora-dependents-v1";
export const DEPENDENTS_CHANGED = "medora-dependents-changed";

function read(): Dependent[] {
  if (typeof localStorage === "undefined") return [...SEED_DEPENDENTS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SEED_DEPENDENTS];
    const parsed = JSON.parse(raw) as Dependent[];
    const list = parsed.length ? parsed : [...SEED_DEPENDENTS];
    return list.map(normalizeDependent);
  } catch {
    return [...SEED_DEPENDENTS];
  }
}

const FALLBACK_PERSONA: Record<DependentRelation, QueuePersona> = {
  Child: "boy",
  Parent: "elderly-man",
  Spouse: "adult-woman",
  Other: "adult-man",
};

function normalizeDependent(dep: Dependent): Dependent {
  if (dep.persona) return dep;
  const seed = SEED_DEPENDENTS.find((s) => s.id === dep.id);
  return {
    ...dep,
    persona: seed?.persona ?? FALLBACK_PERSONA[dep.relation],
  };
}

let cache: Dependent[] = read();

function persist(next: Dependent[]) {
  cache = next;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DEPENDENTS_CHANGED));
  }
}

export function listDependents(): Dependent[] {
  return cache;
}

export function getDependent(id: string): Dependent | undefined {
  return cache.find((d) => d.id === id);
}

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const RELATION_PERSONA: Record<DependentRelation, QueuePersona> = {
  Child: "boy",
  Parent: "elderly-man",
  Spouse: "adult-woman",
  Other: "adult-man",
};

const RELATION_COLOR: Record<DependentRelation, string> = {
  Child: "bg-[#5B8DB8]",
  Parent: "bg-[#8B6BB8]",
  Spouse: "bg-[#B8735D]",
  Other: "bg-[#6B8F71]",
};

export type NewDependentInput = {
  name: string;
  relation: DependentRelation;
  age: number;
  bloodGroup?: string;
  persona?: QueuePersona;
};

function resolvePersona(input: NewDependentInput): QueuePersona {
  if (input.persona) return input.persona;
  return RELATION_PERSONA[input.relation];
}

export function markMedicationTaken(dependentId: string, medId: string, taken: boolean) {
  const next = cache.map((d) => {
    if (d.id !== dependentId) return d;
    const medicationsTodayList = d.medicationsTodayList.map((m) =>
      m.id === medId ? { ...m, taken } : m,
    );
    const medsTakenToday = medicationsTodayList.filter((m) => m.taken).length;
    const names = medicationsTodayList.map((m) => m.name.split(" ")[0]).join(", ");
    return {
      ...d,
      medicationsTodayList,
      medsTakenToday,
      medicationsToday: `${medsTakenToday}/${d.medsTotalToday} taken · ${names}…`,
    };
  });
  persist(next);
}

export function addDependent(input: NewDependentInput): Dependent {
  const id = slugify(input.name) || `dep-${Date.now()}`;
  const dep: Dependent = {
    id,
    name: input.name.trim(),
    initials: initials(input.name),
    relation: input.relation,
    age: input.age,
    bloodGroup: input.bloodGroup ?? "—",
    persona: resolvePersona(input),
    avatarColor: RELATION_COLOR[input.relation],
    adherence: 0,
    carePlan: "Profile setup in progress",
    primaryDoctor: "Not assigned yet",
    primarySpecialty: "—",
    nextConsultation: "No visit scheduled",
    medicationsToday: "No medications logged",
    conditions: [],
    allergies: [],
    appointments: [],
    medications: [],
    reports: [],
    lastVisit: "—",
    medsTakenToday: 0,
    medsTotalToday: 0,
    medicationsTodayList: [],
    vitals: [],
    emergencyContact: "Add emergency contact in profile",
    insurance: "Pending enrollment",
    careNotes: "Complete this profile with your care team at the next visit.",
  };
  persist([...cache, dep]);
  return dep;
}

export function refreshDependentsFromStorage() {
  cache = read();
}
