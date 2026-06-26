import { patientMedications, type PatientMedication } from "@/lib/mock-data";

export type PatientExerciseContext = {
  medications: PatientMedication[];
  medNames: string[];
  conditions: string[];
  restrictions: string[];
  takesThyroidMeds: boolean;
  needsVitaminD: boolean;
  needsMagnesiumRecovery: boolean;
  timingNotes: string[];
};

export function getPatientExerciseContext(): PatientExerciseContext {
  const medications = patientMedications.filter((m) => m.status !== "past");
  const medNames = medications.map((m) => m.name);
  const takesThyroidMeds = medNames.some((n) => /levothyroxine|thyroid/i.test(n));
  const needsVitaminD = medNames.some((n) => /vitamin d/i.test(n));
  const needsMagnesiumRecovery = medNames.some((n) => /magnesium/i.test(n));

  const restrictions: string[] = [];
  if (takesThyroidMeds) {
    restrictions.push("Wait 60+ minutes after levothyroxine before moderate exercise");
    restrictions.push("Avoid high-intensity cardio within 4 hours of thyroid dose");
    restrictions.push("Monitor heart rate — palpitations may signal dose issues");
  }
  if (needsVitaminD) {
    restrictions.push("Combine D3 supplement with safe outdoor light exposure when possible");
  }
  if (needsMagnesiumRecovery) {
    restrictions.push("Schedule evening mobility 1–2 hours before magnesium dose");
  }

  const conditions = medications
    .map((m) => m.clinicalReason)
    .filter((c): c is string => !!c);

  const timingNotes = medications.map((m) => `${m.name}: ${m.instructionTag ?? m.reason}`);

  return {
    medications,
    medNames,
    conditions: [...new Set(conditions)],
    restrictions,
    takesThyroidMeds,
    needsVitaminD,
    needsMagnesiumRecovery,
    timingNotes,
  };
}
