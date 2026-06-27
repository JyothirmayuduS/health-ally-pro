export interface CriticalThreshold {
  key: string;
  name: string;
  unit: string;
  low?: number;
  high?: number;
}

export const CRITICAL_THRESHOLDS: Record<string, CriticalThreshold> = {
  k: { key: "k", name: "Potassium", unit: "mmol/L", low: 2.5, high: 6.5 },
  na: { key: "na", name: "Sodium", unit: "mmol/L", low: 120, high: 160 },
  hb: { key: "hb", name: "Hemoglobin", unit: "g/dL", low: 5.0 },
  hgb: { key: "hgb", name: "Hemoglobin", unit: "g/dL", low: 5.0 },
  glu: { key: "glu", name: "Glucose", unit: "mg/dL", low: 40, high: 500 },
  glucose: { key: "glucose", name: "Glucose", unit: "mg/dL", low: 40, high: 500 },
  plt: { key: "plt", name: "Platelets", unit: "10³/µL", low: 20, high: 1000 },
  wbc: { key: "wbc", name: "WBC", unit: "10³/µL", low: 1.0, high: 30.0 },
  inr: { key: "inr", name: "INR", unit: "", high: 5.0 },
  ph: { key: "ph", name: "pH (ABG)", unit: "", low: 7.20, high: 7.60 },
  po2: { key: "po2", name: "pO2", unit: "mmHg", low: 40 },
  creatinine: { key: "creatinine", name: "Creatinine", unit: "mg/dL", high: 10.0 },
  creat: { key: "creat", name: "Creatinine", unit: "mg/dL", high: 10.0 },
  troponin: { key: "troponin", name: "Troponin I", unit: "ng/mL", high: 2.0 },
  trop: { key: "trop", name: "Troponin I", unit: "ng/mL", high: 2.0 },
  bilirubin: { key: "bilirubin", name: "Bilirubin (Total)", unit: "mg/dL", high: 15.0 },
  bili: { key: "bili", name: "Bilirubin (Total)", unit: "mg/dL", high: 15.0 },
  calcium: { key: "calcium", name: "Calcium", unit: "mg/dL", low: 6.0, high: 13.0 },
  ca: { key: "ca", name: "Calcium", unit: "mg/dL", low: 6.0, high: 13.0 },
  lactate: { key: "lactate", name: "Lactate", unit: "mmol/L", high: 4.0 },
  csf_wbc: { key: "csf_wbc", name: "CSF WBC", unit: "cells/µL", high: 5 },
};
