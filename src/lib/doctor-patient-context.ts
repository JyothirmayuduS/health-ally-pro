import { doctorPatients } from "@/lib/doctor-mock-data";
import { getPanelPatient, PANEL_PATIENTS, type PanelPatient } from "@/lib/doctor-patients-apk-data";

/** Resolve panel id (p1) or encounter id (dp1) to a display patient */
export function resolveDoctorPatient(patientId: string): PanelPatient | null {
  const panel = getPanelPatient(patientId);
  if (panel) return panel;

  const mock = doctorPatients.find((p) => p.id === patientId);
  if (!mock) return null;

  return {
    id: mock.id,
    name: mock.name,
    initials: mock.initials,
    condition: mock.condition,
    age: mock.age,
    gender: mock.gender.startsWith("F") ? "F" : "M",
    patientRef: mock.id.toUpperCase(),
    status: "Stable",
    timeline: mock.lastVisit,
    accent: mock.avatarColor,
    categories: ["all"],
    pills: [],
    priority: 5,
    visits: 0,
    rxCount: 0,
    lastSeen: mock.lastVisit,
  };
}

/** Map panel chart id → encounter / vitals mock id by patient name */
export function toEncounterPatientId(patientId: string): string {
  const panel = getPanelPatient(patientId);
  if (!panel) return patientId;
  const match = doctorPatients.find((p) => p.name === panel.name);
  return match?.id ?? patientId;
}

/** Patients for clinical module pickers — panel is canonical */
export function listClinicalPatients() {
  return PANEL_PATIENTS.map((p) => ({ id: p.id, name: p.name, encounterId: toEncounterPatientId(p.id) }));
}

export function clinicalSearchParams(patientId: string) {
  return { patientId };
}
