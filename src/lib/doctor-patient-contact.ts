/** Demo contact details for panel patients */
const PATIENT_PHONES: Record<string, string> = {
  p1: "+919876543210",
  p2: "+919812345678",
  p3: "+919900112233",
  p4: "+919811223344",
  p5: "+919877665544",
};

export function getPatientPhone(patientId: string): string | null {
  return PATIENT_PHONES[patientId] ?? null;
}

export function patientTelHref(patientId: string): string | null {
  const phone = getPatientPhone(patientId);
  return phone ? `tel:${phone.replace(/\s/g, "")}` : null;
}
