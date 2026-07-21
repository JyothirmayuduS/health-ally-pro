export type {
  SpecialtyId,
  SpecialtyDefinition,
  SpecialtyModule,
  SpecialtyField,
  SpecialtyScore,
  SpecialtyOrderSet,
  SpecialtyProcedure,
  HospitalDoctorRecord,
} from "./types";

export {
  SPECIALTY_CATALOG,
  SPECIALTY_LIST,
  getSpecialty,
  specialtyName,
  resolveSpecialtyId,
} from "./catalog";

export {
  loadHospitalDoctors,
  saveHospitalDoctors,
  subscribeHospitalDoctors,
  addHospitalDoctor,
  updateHospitalDoctor,
  setDoctorSpecialty,
  findDoctorByAuthUserId,
  findDoctorByEmail,
  getDoctorSpecialtyId,
  type AddDoctorInput,
} from "./doctor-registry";

export { useDoctorSpecialty, type DoctorSpecialtyContext } from "./use-doctor-specialty";

export {
  loadSpecialtyCharts,
  saveSpecialtyChartNote,
  chartsForSpecialty,
  subscribeSpecialtyCharts,
  type SpecialtyChartNote,
} from "./chart-store";
