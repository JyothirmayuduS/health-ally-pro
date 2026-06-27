export function getPatient(patients, id) {
  return patients.find((p) => p.id === id);
}

export function getDoctor(doctors, id) {
  return doctors.find((d) => d.id === id);
}
