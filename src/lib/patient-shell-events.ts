export const PATIENT_MENU_OPEN_EVENT = "medora-patient-open-menu";

export function openPatientMenu() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PATIENT_MENU_OPEN_EVENT));
  }
}
