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
  SPECIALTY_ANATOMY,
  getSpecialtyAnatomy,
  specialtySeedMarkers,
  type SpecialtyAnatomyFocus,
} from "./anatomy-focus";

export {
  loadHospitalDoctors,
  saveHospitalDoctors,
  subscribeHospitalDoctors,
  hydrateHospitalDoctorsFromRemote,
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
  hydrateSpecialtyChartsFromRemote,
  type SpecialtyChartNote,
} from "./chart-store";

export * from "./remote-sync";
