/** Multi-specialty hospital clinical catalog — types */

export type SpecialtyId =
  | "ophthalmology"
  | "cardiology"
  | "pediatrics"
  | "orthopedics"
  | "neurology"
  | "dermatology"
  | "ent"
  | "gastroenterology"
  | "nephrology"
  | "pulmonology"
  | "oncology"
  | "obgyn"
  | "psychiatry"
  | "emergency"
  | "icu"
  | "dental"
  | "urology"
  | "endocrinology"
  | "rheumatology"
  | "general_medicine"
  | "physiotherapy"
  | "anesthesia"
  | "radiology"
  | "neonatology"
  | "plastic_surgery"
  | "neurosurgery"
  | "cardiac_surgery"
  | "hepatology"
  | "hematology"
  | "infectious_disease";

export type SpecialtyModuleKind =
  | "intake"
  | "exam"
  | "scores"
  | "orders"
  | "procedures"
  | "imaging"
  | "growth"
  | "vitals_extended"
  | "operative"
  | "followup"
  | "consent"
  | "devices"
  | "chemo"
  | "dialysis"
  | "triage"
  | "ventilator"
  | "dental_chart"
  | "visual_acuity"
  | "ecg"
  | "echo"
  | "fracture"
  | "antenatal"
  | "mental_status";

export type SpecialtyFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "boolean"
  | "date"
  | "time"
  | "od_os" // laterality eye
  | "laterality" // L/R/bilateral
  | "scale"
  | "checklist";

export type SpecialtyField = {
  id: string;
  label: string;
  type: SpecialtyFieldType;
  unit?: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** Eye: OD / OS / OU */
  laterality?: boolean;
};

export type SpecialtyScore = {
  id: string;
  name: string;
  description: string;
  max?: number;
  items: { id: string; label: string; max: number }[];
};

export type SpecialtyOrderSet = {
  id: string;
  name: string;
  category: "lab" | "imaging" | "procedure" | "therapy" | "consult";
  items: string[];
};

export type SpecialtyProcedure = {
  id: string;
  name: string;
  durationMin: number;
  requiresConsent: boolean;
  implantPossible?: boolean;
};

export type SpecialtyModule = {
  id: string;
  kind: SpecialtyModuleKind;
  title: string;
  description?: string;
  fields?: SpecialtyField[];
  scores?: SpecialtyScore[];
  orderSets?: SpecialtyOrderSet[];
  procedures?: SpecialtyProcedure[];
};

export type SpecialtyDefinition = {
  id: SpecialtyId;
  name: string;
  shortName: string;
  department: string;
  icon: string; // lucide icon key
  accent: string;
  accentSoft: string;
  tagline: string;
  /** Clinical modules shown on doctor specialty desk */
  modules: SpecialtyModule[];
  /** Common ICD-style presentation labels (demo) */
  commonPresentations: string[];
  /** Default consult fee suggestion */
  defaultFee: number;
  /** Room / unit type label */
  unitLabel: string;
};

export type HospitalDoctorRecord = {
  doctorId: string;
  name: string;
  email: string;
  specialtyId: SpecialtyId;
  room: string;
  fee: number;
  phone?: string;
  registrationNo?: string;
  active: boolean;
  /** Links demo login userId when present */
  authUserId?: string;
  createdAt: string;
  updatedAt: string;
};
