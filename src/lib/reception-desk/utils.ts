export function getPatient<T extends { id: string }>(patients: T[], id: string): T | undefined {
  return patients.find((p) => p.id === id);
}

export function getDoctor<T extends { id: string }>(doctors: T[], id: string): T | undefined {
  return doctors.find((d) => d.id === id);
}
