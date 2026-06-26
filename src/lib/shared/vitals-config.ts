export type CoreVitalKey = "bp" | "hr" | "rr" | "temp" | "spo2" | "weight";

export type CoreVitalField = {
  key: CoreVitalKey;
  label: string;
  unit: string;
  placeholder: string;
  inputMode?: "numeric" | "decimal";
};

export const CORE_VITAL_FIELDS: CoreVitalField[] = [
  { key: "bp", label: "Blood pressure", unit: "mmHg", placeholder: "120/80" },
  { key: "hr", label: "Heart rate", unit: "bpm", placeholder: "72", inputMode: "numeric" },
  { key: "rr", label: "Resp. rate", unit: "/min", placeholder: "16", inputMode: "numeric" },
  { key: "temp", label: "Temperature", unit: "°C", placeholder: "36.8", inputMode: "decimal" },
  { key: "spo2", label: "SpO₂", unit: "%", placeholder: "98", inputMode: "numeric" },
  { key: "weight", label: "Weight", unit: "kg", placeholder: "68", inputMode: "decimal" },
];

export type ExtraVitalPreset = {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
};

export const EXTRA_VITAL_PRESETS: ExtraVitalPreset[] = [
  { id: "glucose", label: "Blood glucose", unit: "mg/dL", placeholder: "110" },
  { id: "peak-flow", label: "Peak flow", unit: "L/min", placeholder: "320" },
  { id: "pain", label: "Pain score", unit: "/10", placeholder: "3" },
  { id: "height", label: "Height", unit: "cm", placeholder: "165" },
  { id: "bmi", label: "BMI", unit: "kg/m²", placeholder: "24.2" },
  { id: "gcs", label: "GCS", unit: "/15", placeholder: "15" },
];

export type ExtraVitalEntry = {
  id: string;
  label: string;
  value: string;
  unit: string;
};
