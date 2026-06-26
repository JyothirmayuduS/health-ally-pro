export type PatientRxSyncLine = {
  drug_id: string;
  drug_name: string;
  strength: string;
  sig: string;
  qty_prescribed: number;
  days_supply: number;
};

export type PatientRxSyncEnvelope = {
  id: string;
  rx_number: string;
  patientId: string;
  patientRef: string;
  patientName: string;
  diagnosis: string;
  diagnosisIcd?: string;
  lines: PatientRxSyncLine[];
  doctor_name: string;
  doctor_specialty: string;
  patientInstructions?: string;
  sent_at: string;
  status: "active" | "dispensed" | "expired";
};
