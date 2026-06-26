// Ported from health-ally-pro lab branch

export type LabOrderStatus = 'ordered' | 'collected' | 'processing' | 'validation' | 'validated' | 'cancelled';
export type LabPriority = 'routine' | 'urgent' | 'stat';
export type LabSource = 'doctor' | 'reception' | 'walk-in';

export type CatalogParameter = {
  key: string;
  label: string;
  unit: string;
  ref_low?: number;
  ref_high?: number;
  ref_text?: string;
  critical_low?: number;
  critical_high?: number;
};

export type LabCatalogItem = {
  code: string;
  name: string;
  section: string;
  sample_type: string;
  tube: string;
  tat_hours: number;
  fasting: boolean;
  price: number;
  parameters: CatalogParameter[];
};

export type LabPatient = { id: string; name: string; mrn: string; age: number; sex: string; phone: string };
export type LabDoctor = { id: string; name: string; specialty: string };
export type OrderHistoryEntry = { at: string; actor: string; action: string; note?: string };
export type LabOrder = {
  id: string;
  accession: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  test_code: string;
  test_name: string;
  status: LabOrderStatus;
  priority: LabPriority;
  source: LabSource;
  notes?: string;
  fasting: boolean;
  ordered_at: string;
  collected_at: string | null;
  completed_at: string | null;
  validated_at: string | null;
  released_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  assigned_to: string | null;
  collector: string | null;
  /** Demo / RBAC: which technician owns this order on the bench */
  bench_tech_email?: string | null;
  /** Physical specimen details — set at collection */
  specimen?: {
    tube: string;
    sample_type: string;
    volume_ml: number;
    storage_rack: string;
    storage_slot: string;
    temp: "Room" | "2–8 °C" | "Frozen";
    condition: "Acceptable" | "Hemolyzed" | "Lipemic";
  };
  validated_by?: string;
  results?: Record<string, string>;
  history: OrderHistoryEntry[];
  /** Lab billing — price from catalog at order time */
  price?: number;
  payment_status?: "unpaid" | "paid" | "reception";
  lab_invoice_id?: string;
};

export const SECTIONS = [
  {
    "id": "hematology",
    "label": "Hematology"
  },
  {
    "id": "biochemistry",
    "label": "Biochemistry"
  },
  {
    "id": "microbiology",
    "label": "Microbiology"
  },
  {
    "id": "serology",
    "label": "Serology"
  },
  {
    "id": "urinalysis",
    "label": "Urinalysis"
  },
  {
    "id": "endocrinology",
    "label": "Endocrinology"
  }
] as const;

export const LAB_CATALOG: LabCatalogItem[] = [
  {
    "code": "CBC",
    "name": "Complete Blood Count",
    "section": "hematology",
    "sample_type": "Whole blood (EDTA)",
    "tube": "Lavender",
    "tat_hours": 2,
    "fasting": false,
    "price": 18,
    "parameters": [
      {
        "key": "WBC",
        "label": "White Blood Cells",
        "unit": "10^9/L",
        "ref_low": 4,
        "ref_high": 11,
        "critical_low": 2,
        "critical_high": 30
      },
      {
        "key": "RBC",
        "label": "Red Blood Cells",
        "unit": "10^12/L",
        "ref_low": 4.2,
        "ref_high": 5.9
      },
      {
        "key": "HGB",
        "label": "Hemoglobin",
        "unit": "g/dL",
        "ref_low": 12,
        "ref_high": 17.5,
        "critical_low": 7,
        "critical_high": 20
      },
      {
        "key": "HCT",
        "label": "Hematocrit",
        "unit": "%",
        "ref_low": 36,
        "ref_high": 52
      },
      {
        "key": "PLT",
        "label": "Platelets",
        "unit": "10^9/L",
        "ref_low": 150,
        "ref_high": 400,
        "critical_low": 50,
        "critical_high": 1000
      }
    ]
  },
  {
    "code": "LIPID",
    "name": "Lipid Panel",
    "section": "biochemistry",
    "sample_type": "Serum",
    "tube": "Gold (SST)",
    "tat_hours": 4,
    "fasting": true,
    "price": 32,
    "parameters": [
      {
        "key": "TC",
        "label": "Total Cholesterol",
        "unit": "mg/dL",
        "ref_low": 0,
        "ref_high": 200
      },
      {
        "key": "LDL",
        "label": "LDL Cholesterol",
        "unit": "mg/dL",
        "ref_low": 0,
        "ref_high": 130
      },
      {
        "key": "HDL",
        "label": "HDL Cholesterol",
        "unit": "mg/dL",
        "ref_low": 40,
        "ref_high": 100
      },
      {
        "key": "TG",
        "label": "Triglycerides",
        "unit": "mg/dL",
        "ref_low": 0,
        "ref_high": 150
      }
    ]
  },
  {
    "code": "HBA1C",
    "name": "HbA1c",
    "section": "biochemistry",
    "sample_type": "Whole blood (EDTA)",
    "tube": "Lavender",
    "tat_hours": 4,
    "fasting": false,
    "price": 24,
    "parameters": [
      {
        "key": "HBA1C",
        "label": "Glycated Hemoglobin",
        "unit": "%",
        "ref_low": 4,
        "ref_high": 5.6,
        "critical_high": 14
      }
    ]
  },
  {
    "code": "TFT",
    "name": "Thyroid Function Test",
    "section": "endocrinology",
    "sample_type": "Serum",
    "tube": "Gold (SST)",
    "tat_hours": 6,
    "fasting": false,
    "price": 38,
    "parameters": [
      {
        "key": "TSH",
        "label": "TSH",
        "unit": "mIU/L",
        "ref_low": 0.4,
        "ref_high": 4
      },
      {
        "key": "T3",
        "label": "Free T3",
        "unit": "pg/mL",
        "ref_low": 2.3,
        "ref_high": 4.2
      },
      {
        "key": "T4",
        "label": "Free T4",
        "unit": "ng/dL",
        "ref_low": 0.8,
        "ref_high": 1.8
      }
    ]
  },
  {
    "code": "UA",
    "name": "Urinalysis",
    "section": "urinalysis",
    "sample_type": "Urine (mid-stream)",
    "tube": "Yellow cup",
    "tat_hours": 2,
    "fasting": false,
    "price": 14,
    "parameters": [
      {
        "key": "COLOR",
        "label": "Color",
        "unit": "",
        "ref_text": "Yellow"
      },
      {
        "key": "PROT",
        "label": "Protein",
        "unit": "",
        "ref_text": "Negative"
      },
      {
        "key": "GLU",
        "label": "Glucose",
        "unit": "",
        "ref_text": "Negative"
      },
      {
        "key": "PH",
        "label": "pH",
        "unit": "",
        "ref_low": 4.5,
        "ref_high": 8
      }
    ]
  },
  {
    "code": "LFT",
    "name": "Liver Function Test",
    "section": "biochemistry",
    "sample_type": "Serum",
    "tube": "Gold (SST)",
    "tat_hours": 4,
    "fasting": false,
    "price": 36,
    "parameters": [
      {
        "key": "ALT",
        "label": "ALT (SGPT)",
        "unit": "U/L",
        "ref_low": 7,
        "ref_high": 56,
        "critical_high": 500
      },
      {
        "key": "AST",
        "label": "AST (SGOT)",
        "unit": "U/L",
        "ref_low": 10,
        "ref_high": 40,
        "critical_high": 500
      },
      {
        "key": "ALP",
        "label": "Alkaline Phosphatase",
        "unit": "U/L",
        "ref_low": 44,
        "ref_high": 147
      },
      {
        "key": "TBIL",
        "label": "Total Bilirubin",
        "unit": "mg/dL",
        "ref_low": 0.1,
        "ref_high": 1.2
      },
      {
        "key": "ALB",
        "label": "Albumin",
        "unit": "g/dL",
        "ref_low": 3.5,
        "ref_high": 5
      }
    ]
  },
  {
    "code": "BMP",
    "name": "Basic Metabolic Panel",
    "section": "biochemistry",
    "sample_type": "Serum",
    "tube": "Green (Lithium Heparin)",
    "tat_hours": 2,
    "fasting": false,
    "price": 28,
    "parameters": [
      { "key": "GLU", "label": "Glucose", "unit": "mg/dL", "ref_low": 70, "ref_high": 99, "critical_low": 40, "critical_high": 500 },
      { "key": "BUN", "label": "BUN", "unit": "mg/dL", "ref_low": 7, "ref_high": 20 },
      { "key": "CREAT", "label": "Creatinine", "unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.2, "critical_high": 4 },
      { "key": "NA", "label": "Sodium", "unit": "mEq/L", "ref_low": 136, "ref_high": 145 },
      { "key": "K", "label": "Potassium", "unit": "mEq/L", "ref_low": 3.5, "ref_high": 5.1, "critical_low": 2.5, "critical_high": 6.5 },
      { "key": "CL", "label": "Chloride", "unit": "mEq/L", "ref_low": 98, "ref_high": 106 },
      { "key": "CO2", "label": "CO₂", "unit": "mEq/L", "ref_low": 23, "ref_high": 29 }
    ]
  }
];

export const PATIENTS: LabPatient[] = [];

export const DOCTORS: LabDoctor[] = [
  {
    "id": "d-201",
    "name": "Dr. Mei Tan",
    "specialty": "Internal Medicine"
  },
  {
    "id": "d-202",
    "name": "Dr. Adebayo Owens",
    "specialty": "Endocrinology"
  },
  {
    "id": "d-203",
    "name": "Dr. Priya Iyer",
    "specialty": "Cardiology"
  },
  {
    "id": "d-204",
    "name": "Dr. Henrik Vogel",
    "specialty": "Family Medicine"
  }
];

export const SEED_ORDERS_RAW: LabOrder[] = [
  {
    "id": "LO-100245",
    "accession": "ACC-A4421",
    "patient_id": "MRN-100231",
    "doctor_id": "d-201",
    "test_code": "CBC",
    "test_name": "Complete Blood Count",
    "status": "ordered",
    "priority": "stat",
    "source": "doctor",
    "notes": "Suspected anemia, fatigue 3 weeks.",
    "fasting": false,
    "ordered_at": "2026-06-22T21:09:20.752Z",
    "collected_at": null,
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": null,
    "history": [
      {
        "at": "2026-06-22T21:09:20.752Z",
        "actor": "Dr. Mei Tan",
        "action": "Order placed",
        "note": "STAT request"
      },
      {
        "at": "2026-06-22T21:10:20.752Z",
        "actor": "J. Mensah",
        "action": "Assigned to bench",
        "note": "STAT draw — priority queue"
      }
    ],
    "doctor_name": "Dr. Mei Tan"
  },
  {
    "id": "LO-100244",
    "accession": "ACC-A4420",
    "patient_id": "MRN-100232",
    "doctor_id": "d-202",
    "test_code": "HBA1C",
    "test_name": "HbA1c",
    "status": "ordered",
    "priority": "routine",
    "source": "doctor",
    "notes": "Quarterly diabetic follow-up.",
    "fasting": false,
    "ordered_at": "2026-06-22T20:35:20.752Z",
    "collected_at": null,
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": null,
    "history": [
      {
        "at": "2026-06-22T20:35:20.752Z",
        "actor": "Dr. Adebayo Owens",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T20:36:20.752Z",
        "actor": "J. Mensah",
        "action": "Assigned to bench"
      }
    ],
    "doctor_name": "Dr. Adebayo Owens"
  },
  {
    "id": "LO-100243",
    "accession": "ACC-A4419",
    "patient_id": "MRN-100233",
    "doctor_id": "d-204",
    "test_code": "LIPID",
    "test_name": "Lipid Panel",
    "status": "ordered",
    "priority": "urgent",
    "source": "reception",
    "notes": "Pre-op screening — fasting.",
    "fasting": true,
    "ordered_at": "2026-06-22T20:07:20.752Z",
    "collected_at": null,
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": null,
    "history": [
      {
        "at": "2026-06-22T20:07:20.752Z",
        "actor": "Reception (walk-in)",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T20:08:20.752Z",
        "actor": "J. Mensah",
        "action": "Assigned to bench",
        "note": "Urgent pre-op draw"
      }
    ],
    "doctor_name": "Dr. Henrik Vogel"
  },
  {
    "id": "LO-100240",
    "accession": "ACC-A4416",
    "patient_id": "MRN-100234",
    "doctor_id": "d-201",
    "test_code": "LFT",
    "test_name": "Liver Function Test",
    "status": "collected",
    "priority": "routine",
    "source": "doctor",
    "notes": "Suspected hepatitis — ready for bench.",
    "fasting": false,
    "ordered_at": "2026-06-22T19:17:20.752Z",
    "collected_at": "2026-06-22T20:42:20.752Z",
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "history": [
      {
        "at": "2026-06-22T19:17:20.752Z",
        "actor": "Dr. Mei Tan",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T20:42:20.752Z",
        "actor": "J. Mensah",
        "action": "Sample collected",
        "note": "SST tube · fasting not required"
      }
    ],
    "doctor_name": "Dr. Mei Tan"
  },
  {
    "id": "LO-100239",
    "accession": "ACC-A4415",
    "patient_id": "MRN-100235",
    "doctor_id": "d-203",
    "test_code": "TFT",
    "test_name": "Thyroid Function Test",
    "status": "collected",
    "priority": "routine",
    "source": "doctor",
    "notes": "Fatigue + weight gain workup.",
    "fasting": false,
    "ordered_at": "2026-06-22T18:17:20.752Z",
    "collected_at": "2026-06-22T19:55:20.752Z",
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "history": [
      {
        "at": "2026-06-22T18:17:20.752Z",
        "actor": "Dr. Priya Iyer",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T19:55:20.752Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      }
    ],
    "doctor_name": "Dr. Priya Iyer"
  },
  {
    "id": "LO-100236",
    "accession": "ACC-A4412",
    "patient_id": "MRN-100236",
    "doctor_id": "d-204",
    "test_code": "CBC",
    "test_name": "Complete Blood Count",
    "status": "processing",
    "priority": "routine",
    "source": "doctor",
    "notes": "Routine annual checkup.",
    "fasting": false,
    "ordered_at": "2026-06-22T16:17:20.752Z",
    "collected_at": "2026-06-22T17:17:20.752Z",
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "results": {
      "WBC": "7.2",
      "RBC": "4.8",
      "HGB": "14.1",
      "HCT": "42",
      "PLT": "260"
    },
    "history": [
      {
        "at": "2026-06-22T16:17:20.752Z",
        "actor": "Dr. Henrik Vogel",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T17:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      },
      {
        "at": "2026-06-22T18:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Processing started"
      }
    ],
    "doctor_name": "Dr. Henrik Vogel"
  },
  {
    "id": "LO-100231",
    "accession": "ACC-A4408",
    "patient_id": "MRN-100237",
    "doctor_id": "d-202",
    "test_code": "HBA1C",
    "test_name": "HbA1c",
    "status": "validated",
    "priority": "routine",
    "source": "doctor",
    "notes": "Diabetes follow-up.",
    "fasting": false,
    "ordered_at": "2026-06-22T13:17:20.752Z",
    "collected_at": "2026-06-22T14:17:20.752Z",
    "completed_at": "2026-06-22T17:17:20.752Z",
    "validated_at": "2026-06-22T18:17:20.752Z",
    "released_at": "2026-06-22T18:17:20.752Z",
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "validated_by": "Dr. Rajan (Supervisor)",
    "results": {
      "HBA1C": "8.4"
    },
    "history": [
      {
        "at": "2026-06-22T13:17:20.752Z",
        "actor": "Dr. Adebayo Owens",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T14:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      },
      {
        "at": "2026-06-22T17:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Results entered"
      },
      {
        "at": "2026-06-22T18:17:20.752Z",
        "actor": "Dr. Rajan",
        "action": "Validated & released"
      }
    ],
    "doctor_name": "Dr. Adebayo Owens"
  },
  {
    "id": "LO-100228",
    "accession": "ACC-A4405",
    "patient_id": "MRN-100238",
    "doctor_id": "d-203",
    "test_code": "LIPID",
    "test_name": "Lipid Panel",
    "status": "validated",
    "priority": "routine",
    "source": "doctor",
    "notes": "Cardio risk assessment.",
    "fasting": true,
    "ordered_at": "2026-06-22T11:17:20.752Z",
    "collected_at": "2026-06-22T12:17:20.752Z",
    "completed_at": "2026-06-22T15:17:20.752Z",
    "validated_at": "2026-06-22T16:17:20.752Z",
    "released_at": "2026-06-22T16:17:20.752Z",
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "validated_by": "Dr. Rajan (Supervisor)",
    "results": {
      "TC": "188",
      "LDL": "118",
      "HDL": "52",
      "TG": "132"
    },
    "history": [
      {
        "at": "2026-06-22T11:17:20.752Z",
        "actor": "Dr. Priya Iyer",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T12:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      },
      {
        "at": "2026-06-22T15:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Results entered"
      },
      {
        "at": "2026-06-22T16:17:20.752Z",
        "actor": "Dr. Rajan",
        "action": "Validated & released"
      }
    ],
    "doctor_name": "Dr. Priya Iyer"
  },
  {
    "id": "LO-100237",
    "accession": "ACC-A4413",
    "patient_id": "MRN-100234",
    "doctor_id": "d-201",
    "test_code": "LFT",
    "test_name": "Liver Function Test",
    "status": "validation",
    "priority": "urgent",
    "source": "doctor",
    "notes": "Elevated ALT on prior visit.",
    "fasting": false,
    "ordered_at": "2026-06-22T15:17:20.753Z",
    "collected_at": "2026-06-22T16:17:20.753Z",
    "completed_at": "2026-06-22T20:52:20.753Z",
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "results": {
      "ALT": "72",
      "AST": "42",
      "ALP": "110",
      "TBIL": "1.0",
      "ALB": "4.1"
    },
    "history": [
      {
        "at": "2026-06-22T15:17:20.753Z",
        "actor": "Dr. Mei Tan",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T16:17:20.753Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      },
      {
        "at": "2026-06-22T20:37:20.753Z",
        "actor": "J. Mensah",
        "action": "Results entered",
        "note": "Submitted for validation"
      }
    ],
    "doctor_name": "Dr. Mei Tan"
  },
  {
    "id": "LO-100246",
    "accession": "ACC-A4422",
    "patient_id": "MRN-100232",
    "doctor_id": "d-202",
    "test_code": "BMP",
    "test_name": "Basic Metabolic Panel",
    "status": "validation",
    "priority": "stat",
    "source": "doctor",
    "notes": "AKI workup — STAT BMP.",
    "fasting": false,
    "ordered_at": "2026-06-22T20:45:20.753Z",
    "collected_at": "2026-06-22T21:05:20.753Z",
    "completed_at": "2026-06-22T21:25:20.753Z",
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "results": {
      "GLU": "142",
      "BUN": "28",
      "CREAT": "1.8",
      "NA": "138",
      "K": "4.9",
      "CL": "102",
      "CO2": "22"
    },
    "history": [
      {
        "at": "2026-06-22T20:45:20.753Z",
        "actor": "Dr. Adebayo Owens",
        "action": "Order placed",
        "note": "STAT"
      },
      {
        "at": "2026-06-22T21:05:20.753Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      },
      {
        "at": "2026-06-22T21:25:20.753Z",
        "actor": "J. Mensah",
        "action": "Results entered",
        "note": "Critical creatinine — supervisor notified"
      }
    ],
    "doctor_name": "Dr. Adebayo Owens"
  },
  {
    "id": "LO-100247",
    "accession": "ACC-A4423",
    "patient_id": "MRN-100236",
    "doctor_id": "d-204",
    "test_code": "UA",
    "test_name": "Urinalysis",
    "status": "validated",
    "priority": "routine",
    "source": "doctor",
    "notes": "UTI symptoms.",
    "fasting": false,
    "ordered_at": "2026-06-22T09:17:20.752Z",
    "collected_at": "2026-06-22T10:17:20.752Z",
    "completed_at": "2026-06-22T11:47:20.752Z",
    "validated_at": "2026-06-22T12:17:20.752Z",
    "released_at": "2026-06-22T12:17:20.752Z",
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "validated_by": "Dr. Rajan (Supervisor)",
    "results": {
      "COLOR": "Yellow",
      "CLARITY": "Cloudy",
      "PH": "6.0",
      "PROTEIN": "Trace",
      "GLUCOSE": "Negative",
      "KETONES": "Negative",
      "BLOOD": "Negative",
      "LEU": "Positive",
      "NIT": "Positive"
    },
    "history": [
      {
        "at": "2026-06-22T09:17:20.752Z",
        "actor": "Dr. Henrik Vogel",
        "action": "Order placed"
      },
      {
        "at": "2026-06-22T10:17:20.752Z",
        "actor": "J. Mensah",
        "action": "Sample collected"
      },
      {
        "at": "2026-06-22T11:47:20.752Z",
        "actor": "J. Mensah",
        "action": "Results entered"
      },
      {
        "at": "2026-06-22T12:17:20.752Z",
        "actor": "Dr. Rajan",
        "action": "Validated & released"
      }
    ],
    "doctor_name": "Dr. Henrik Vogel"
  },
  {
    "id": "LO-100248",
    "accession": "ACC-A4424",
    "patient_id": "MRN-100237",
    "doctor_id": "d-202",
    "test_code": "CBC",
    "test_name": "Complete Blood Count",
    "status": "collected",
    "priority": "urgent",
    "source": "doctor",
    "notes": "Post-chemo count check.",
    "fasting": false,
    "ordered_at": "2026-06-22T18:45:20.752Z",
    "collected_at": "2026-06-22T19:30:20.752Z",
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "bench_tech_email": "lab@oakhaven.demo",
    "history": [
      { "at": "2026-06-22T18:45:20.752Z", "actor": "Dr. Adebayo Owens", "action": "Order placed" },
      { "at": "2026-06-22T19:30:20.752Z", "actor": "J. Mensah", "action": "Sample collected", "note": "Lavender tube" }
    ],
    "doctor_name": "Dr. Adebayo Owens"
  },
  {
    "id": "LO-100249",
    "accession": "ACC-A4425",
    "patient_id": "MRN-100233",
    "doctor_id": "d-204",
    "test_code": "TFT",
    "test_name": "Thyroid Function Test",
    "status": "processing",
    "priority": "routine",
    "source": "doctor",
    "notes": "Recheck TSH after dose change.",
    "fasting": false,
    "ordered_at": "2026-06-22T17:30:20.752Z",
    "collected_at": "2026-06-22T18:15:20.752Z",
    "completed_at": null,
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "bench_tech_email": "lab@oakhaven.demo",
    "results": { "TSH": "4.8", "FT4": "1.1", "FT3": "3.0" },
    "history": [
      { "at": "2026-06-22T17:30:20.752Z", "actor": "Dr. Henrik Vogel", "action": "Order placed" },
      { "at": "2026-06-22T18:15:20.752Z", "actor": "J. Mensah", "action": "Sample collected" },
      { "at": "2026-06-22T19:00:20.752Z", "actor": "J. Mensah", "action": "Processing started" }
    ],
    "doctor_name": "Dr. Henrik Vogel"
  },
  {
    "id": "LO-100250",
    "accession": "ACC-A4426",
    "patient_id": "MRN-100231",
    "doctor_id": "d-201",
    "test_code": "UA",
    "test_name": "Urinalysis",
    "status": "validated",
    "priority": "routine",
    "source": "doctor",
    "notes": "Recurrent UTI symptoms.",
    "fasting": false,
    "ordered_at": "2026-06-21T14:17:20.752Z",
    "collected_at": "2026-06-21T15:17:20.752Z",
    "completed_at": "2026-06-21T16:47:20.752Z",
    "validated_at": "2026-06-21T17:17:20.752Z",
    "released_at": "2026-06-21T17:17:20.752Z",
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "bench_tech_email": "lab@oakhaven.demo",
    "validated_by": "Dr. Rajan (Supervisor)",
    "results": {
      "COLOR": "Yellow",
      "CLARITY": "Clear",
      "PH": "6.5",
      "PROTEIN": "Negative",
      "GLUCOSE": "Negative",
      "LEU": "Negative",
      "NIT": "Negative"
    },
    "history": [
      { "at": "2026-06-21T14:17:20.752Z", "actor": "Dr. Mei Tan", "action": "Order placed" },
      { "at": "2026-06-21T15:17:20.752Z", "actor": "J. Mensah", "action": "Sample collected" },
      { "at": "2026-06-21T16:47:20.752Z", "actor": "J. Mensah", "action": "Results entered" },
      { "at": "2026-06-21T17:17:20.752Z", "actor": "Dr. Rajan", "action": "Validated & released" }
    ],
    "doctor_name": "Dr. Mei Tan"
  },
  {
    "id": "LO-100251",
    "accession": "ACC-A4427",
    "patient_id": "MRN-100235",
    "doctor_id": "d-203",
    "test_code": "LFT",
    "test_name": "Liver Function Test",
    "status": "validation",
    "priority": "routine",
    "source": "doctor",
    "notes": "Statin monitoring.",
    "fasting": false,
    "ordered_at": "2026-06-22T14:17:20.752Z",
    "collected_at": "2026-06-22T15:17:20.752Z",
    "completed_at": "2026-06-22T17:47:20.752Z",
    "validated_at": null,
    "released_at": null,
    "cancelled_at": null,
    "cancel_reason": null,
    "assigned_to": "Tech: J. Mensah",
    "collector": "J. Mensah",
    "bench_tech_email": "lab@oakhaven.demo",
    "results": { "ALT": "38", "AST": "32", "ALP": "88", "TBIL": "0.8", "ALB": "4.2" },
    "history": [
      { "at": "2026-06-22T14:17:20.752Z", "actor": "Dr. Priya Iyer", "action": "Order placed" },
      { "at": "2026-06-22T15:17:20.752Z", "actor": "J. Mensah", "action": "Sample collected" },
      { "at": "2026-06-22T17:47:20.752Z", "actor": "J. Mensah", "action": "Results entered", "note": "Submitted for validation" }
    ],
    "doctor_name": "Dr. Priya Iyer"
  }
];

const DEMO_TECH_EMAIL = "lab@oakhaven.demo";

export const SEED_ORDERS: LabOrder[] = SEED_ORDERS_RAW.map((o) => ({
  ...o,
  bench_tech_email:
    o.bench_tech_email ??
    (o.assigned_to?.includes("J. Mensah") ||
    o.collector?.includes("Mensah") ||
    o.history.some((h) => h.actor.includes("Mensah"))
      ? DEMO_TECH_EMAIL
      : null),
}));

export const STAFF = [
  {
    "id": "s-0",
    "name": "J. Mensah",
    "role": "lab_technician",
    "section": "general",
    "shift": "Morning"
  },
  {
    "id": "s-1",
    "name": "Marcus Lin",
    "role": "lab_technician",
    "section": "hematology",
    "shift": "Morning"
  },
  {
    "id": "s-2",
    "name": "Imani Russo",
    "role": "lab_technician",
    "section": "biochemistry",
    "shift": "Morning"
  },
  {
    "id": "s-3",
    "name": "Nia Brooks",
    "role": "phlebotomist",
    "section": "collection",
    "shift": "Morning"
  },
  {
    "id": "s-4",
    "name": "Dr. Rajan",
    "role": "lab_supervisor",
    "section": "all",
    "shift": "Day"
  }
];

export const HOSPITAL = {
  "name": "Maple Hospital",
  "tagline": "Clinical laboratory services",
  "address": "412 Linden Way · Suite 2200 · Auckland 1010",
  "phone": "+64 9 555 0188",
  "email": "lab@medora.health",
  "lab_director": "Dr. Rajan, MD · Lab Director",
  "clia": "CLIA #74D2204918"
};

export function findCatalog(code: string) {
  return LAB_CATALOG.find((t) => t.code === code);
}
