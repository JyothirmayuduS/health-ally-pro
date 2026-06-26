export type PatientStatus = "Urgent" | "Stable" | "Monitoring" | "Critical";
export type FilterTab = "all" | "today" | "urgent" | "follow-up" | "upcoming" | "past";
export type PanelView = "panel" | "today" | "urgent";

export type PanelPatient = {
  id: string;
  name: string;
  initials: string;
  condition: string;
  age: number;
  gender: "M" | "F";
  patientRef: string;
  status: PatientStatus;
  alert?: string;
  timeline: string;
  accent: string;
  categories: FilterTab[];
  pills: string[];
  priority: number;
  visits: number;
  rxCount: number;
  lastSeen: string;
  allergyWarning?: string;
};

export type PanelTask = {
  id: string;
  title: string;
  patientId: string;
  patientName: string;
  due: string;
  urgent?: boolean;
  done?: boolean;
};

export type ChartMedication = {
  id: string;
  patientId: string;
  name: string;
  strength: string;
  frequency: string;
  route: string;
  duration: string;
  status: "ACTIVE" | "PAST";
  condition: string;
  icd: string;
  whyPrescribed: string;
  clinicalNotes?: string;
  patientInstructions?: string;
  chartDate: string;
  chartSubtitle: string;
  chartBody: string;
  prescribedBy?: string;
  prescribedOn?: string;
  pharmacy?: string;
  lastFilled?: string;
  refillsRemaining?: string;
  interactions?: string;
  monitoring?: string;
};

export type ChartOpenItem = {
  id: string;
  patientId: string;
  kind: string;
  title: string;
  subtitle: string;
  icon: "message" | "lab";
  detailTitle: string;
  detailBody: string;
  detailMeta?: string;
  /** When set, tapping the open item opens the full document report sheet. */
  documentId?: string;
};

export type ChartProblem = {
  id: string;
  patientId: string;
  label: string;
  icd: string;
  status: string;
  since: string;
  notes: string;
};

export type HistoryTimelineEntry = {
  id: string;
  patientId: string;
  month: string;
  day: string;
  monthShort: string;
  title: string;
  meta: string;
  note?: string;
  detailSections?: { title: string; body: string }[];
};

export type HistoryRxEntry = HistoryTimelineEntry & {
  medicationId: string;
};

export type HistoryVisitEntry = HistoryTimelineEntry;

export type DocumentFilterCategory = "lab" | "imaging" | "shared" | "clinical";
export type DocumentIconType = "document" | "imaging" | "lab";
export type DocumentFilterTab = "all" | "lab" | "imaging" | "shared";

export type ReportField = {
  label: string;
  value: string;
  accent?: boolean;
};

export type DocumentReportDetail = {
  headerLabel: string;
  status: string;
  accent: "terracotta" | "forest" | "amber";
  reportFields: ReportField[];
  findings?: ReportField[];
  sections: { title: string; body: string }[];
};

export type HistoryDocumentEntry = HistoryTimelineEntry & {
  docType: string;
  filterCategory: DocumentFilterCategory;
  icon: DocumentIconType;
  report: DocumentReportDetail;
};

export type HistoryVitalEntry = HistoryTimelineEntry & {
  readings: { label: string; value: string }[];
};

export const PANEL_PATIENTS: PanelPatient[] = [
  {
    id: "p1",
    name: "Sneha Rao",
    initials: "SR",
    condition: "Asthma",
    age: 29,
    gender: "F",
    patientRef: "P-3188",
    status: "Urgent",
    alert: "Acute exacerbation, O2 sat 91%",
    timeline: "9 days ago · Follow-up due · Lab pending",
    accent: "#C45C4A",
    categories: ["all", "today", "urgent", "follow-up"],
    pills: ["Overview", "Open items", "Labs", "Unread"],
    priority: 1,
    visits: 1,
    rxCount: 1,
    lastSeen: "9 days ago",
    allergyWarning: "Aspirin",
  },
  {
    id: "p2",
    name: "Arjun Kapoor",
    initials: "AK",
    condition: "Hypertension",
    age: 45,
    gender: "M",
    patientRef: "P-2041",
    status: "Stable",
    timeline: "2 months ago · Follow-up due · Lab pending",
    accent: "#E9A820",
    categories: ["all", "follow-up"],
    pills: ["Overview", "Open items", "Labs"],
    priority: 3,
    visits: 2,
    rxCount: 2,
    lastSeen: "2 months ago",
  },
  {
    id: "p3",
    name: "Priya Sharma",
    initials: "PS",
    condition: "Diabetes",
    age: 38,
    gender: "F",
    patientRef: "P-2910",
    status: "Monitoring",
    timeline: "14 days ago · HbA1c due · Rx expiring",
    accent: "#B8735D",
    categories: ["all", "today", "follow-up"],
    pills: ["Overview", "Open items", "Labs"],
    priority: 2,
    visits: 3,
    rxCount: 2,
    lastSeen: "14 days ago",
  },
  {
    id: "p4",
    name: "Mohammed Ali",
    initials: "MA",
    condition: "Cardiac",
    age: 62,
    gender: "M",
    patientRef: "P-1102",
    status: "Stable",
    timeline: "Today · Post-PCI follow-up · Cleared for rehab",
    accent: "#1B3B2E",
    categories: ["all", "today", "upcoming"],
    pills: ["Overview", "Open items", "Labs"],
    priority: 4,
    visits: 4,
    rxCount: 3,
    lastSeen: "Today",
  },
  {
    id: "p5",
    name: "Jane Cooper",
    initials: "JC",
    condition: "COPD",
    age: 55,
    gender: "F",
    patientRef: "P-3374",
    status: "Monitoring",
    timeline: "3 weeks ago · Spirometry pending",
    accent: "#8A8F8C",
    categories: ["all", "upcoming", "past"],
    pills: ["Overview", "Open items"],
    priority: 5,
    visits: 1,
    rxCount: 1,
    lastSeen: "3 weeks ago",
  },
];

export const PANEL_TASKS: PanelTask[] = [
  {
    id: "tk1",
    title: "Review Priya Sharma lab results",
    patientId: "p3",
    patientName: "Priya Sharma",
    due: "Due today",
    urgent: true,
  },
  {
    id: "tk2",
    title: "Sign off Arjun Kapoor referral",
    patientId: "p2",
    patientName: "Arjun Kapoor",
    due: "Due today",
    urgent: true,
  },
  {
    id: "tk3",
    title: "Call Sneha Rao for inhaler refill",
    patientId: "p1",
    patientName: "Sneha Rao",
    due: "Completed",
    done: true,
  },
];

export type ChartTherapy = {
  patientId: string;
  lines: string[];
  problems: string[];
  detail: string;
  medicationIds: string[];
};

export const CHART_THERAPIES: ChartTherapy[] = [
  {
    patientId: "p1",
    lines: ["Salbutamol inhaler 100mcg · SOS", "Prednisolone 5mg · OD"],
    problems: ["Persistent Asthma (J45.9)", "Allergic rhinitis (J30.9)"],
    detail:
      "Two active therapies on chart. Salbutamol is rescue inhaler; Prednisolone is a short course started at the urgent visit.",
    medicationIds: ["p1-med-sal", "p1-med-pred"],
  },
  {
    patientId: "p2",
    lines: ["Amlodipine 5mg · OD", "Telmisartan 40mg · OD"],
    problems: ["Essential hypertension (I10)", "Hyperlipidemia (E78.5)"],
    detail: "BP controlled on dual therapy. Home BP log shows morning readings 128–134/82–86.",
    medicationIds: ["p2-med-aml", "p2-med-tel"],
  },
  {
    patientId: "p3",
    lines: ["Metformin 500mg · BD", "Glimepiride 1mg · OD"],
    problems: ["Type 2 diabetes (E11.9)", "Obesity (E66.9)"],
    detail: "HbA1c 7.8% at last visit. Reinforced diet and exercise; glimepiride dose stable.",
    medicationIds: ["p3-med-met", "p3-med-gli"],
  },
  {
    patientId: "p4",
    lines: ["Aspirin 75mg · OD", "Atorvastatin 40mg · ON", "Metoprolol 25mg · BD"],
    problems: ["CAD post-PCI (I25.10)", "Hyperlipidemia (E78.5)"],
    detail: "Post-PCI day 14. Cleared for cardiac rehab. No chest pain at rest.",
    medicationIds: ["p4-med-asp", "p4-med-ato", "p4-med-met"],
  },
  {
    patientId: "p5",
    lines: ["Tiotropium 18mcg · OD", "Salbutamol inhaler · SOS"],
    problems: ["COPD GOLD II (J44.9)", "Former smoker (Z87.891)"],
    detail: "On LAMA therapy with rescue inhaler. Spirometry overdue — open item pending.",
    medicationIds: ["p5-med-tio", "p5-med-sal"],
  },
];

/** @deprecated use getPatientTherapy */
export const CHART_THERAPY = CHART_THERAPIES[0]!;

export const CHART_PROBLEMS: ChartProblem[] = [
  {
    id: "p1-pr1",
    patientId: "p1",
    label: "Persistent Asthma",
    icd: "J45.9",
    status: "Active · poorly controlled",
    since: "Mar 2024",
    notes: "Frequent rescue inhaler use; action plan updated at last visit.",
  },
  {
    id: "p1-pr2",
    patientId: "p1",
    label: "Allergic rhinitis",
    icd: "J30.9",
    status: "Active · seasonal",
    since: "Jan 2023",
    notes: "Triggers include dust and pollen; consider immunology referral if symptoms persist.",
  },
  {
    id: "p2-pr1",
    patientId: "p2",
    label: "Essential hypertension",
    icd: "I10",
    status: "Active · controlled",
    since: "Jun 2022",
    notes: "Home BP diary reviewed; target <130/80.",
  },
  {
    id: "p2-pr2",
    patientId: "p2",
    label: "Hyperlipidemia",
    icd: "E78.5",
    status: "Active · on statin",
    since: "Aug 2023",
    notes: "LDL 98 mg/dL at last panel; continue lifestyle measures.",
  },
  {
    id: "p3-pr1",
    patientId: "p3",
    label: "Type 2 diabetes",
    icd: "E11.9",
    status: "Active · suboptimal control",
    since: "Nov 2021",
    notes: "HbA1c trending up; nutrition consult recommended.",
  },
  {
    id: "p3-pr2",
    patientId: "p3",
    label: "Obesity",
    icd: "E66.9",
    status: "Active",
    since: "Nov 2021",
    notes: "BMI 31. Weight loss goal 5 kg over 6 months.",
  },
  {
    id: "p4-pr1",
    patientId: "p4",
    label: "CAD post-PCI",
    icd: "I25.10",
    status: "Active · stable",
    since: "Jun 2026",
    notes: "DES to LAD. Dual antiplatelet therapy per protocol.",
  },
  {
    id: "p4-pr2",
    patientId: "p4",
    label: "Hyperlipidemia",
    icd: "E78.5",
    status: "Active · on high-intensity statin",
    since: "2019",
    notes: "LDL target <55 post-PCI.",
  },
  {
    id: "p5-pr1",
    patientId: "p5",
    label: "COPD GOLD II",
    icd: "J44.9",
    status: "Active · moderate",
    since: "Feb 2024",
    notes: "Dyspnea on moderate exertion; pulmonary rehab discussed.",
  },
  {
    id: "p5-pr2",
    patientId: "p5",
    label: "Former smoker",
    icd: "Z87.891",
    status: "Historical",
    since: "Quit 2023",
    notes: "20 pack-year history; quit with counselling support.",
  },
];

export const CHART_OPEN_ITEMS: ChartOpenItem[] = [
  {
    id: "p1-oi1",
    patientId: "p1",
    kind: "UNREAD MESSAGES",
    title: "Secure messages",
    subtitle: "New activity in the secure thread",
    icon: "message",
    detailTitle: "Secure message thread",
    detailBody:
      "Patient: \"Peak flow still low after 2 days on prednisolone. Should I come in?\" · Sent 2h ago.",
    detailMeta: "Reply recommended before next prescription",
  },
  {
    id: "p1-oi2",
    patientId: "p1",
    kind: "LAB DOCUMENT",
    title: "Spirometry report",
    subtitle: "Ready · about 1 month ago",
    icon: "lab",
    detailTitle: "Spirometry report — Oak Haven Pulmonary",
    detailBody: "FEV1 68% predicted · FVC 82% · moderate obstructive pattern.",
    detailMeta: "PDF · 2 pages · Uploaded 14 May 2026",
    documentId: "p1-hd4",
  },
  {
    id: "p2-oi1",
    patientId: "p2",
    kind: "REFERRAL",
    title: "Cardiology referral",
    subtitle: "Awaiting sign-off · Due today",
    icon: "message",
    detailTitle: "Cardiology referral — pending signature",
    detailBody: "Referral for stress echo due to exertional dyspnea despite controlled BP.",
    detailMeta: "Task linked · Sign off in tasks",
  },
  {
    id: "p2-oi2",
    patientId: "p2",
    kind: "LAB DOCUMENT",
    title: "Lipid panel",
    subtitle: "Ready · 2 months ago",
    icon: "lab",
    detailTitle: "Lipid panel results",
    detailBody: "Total chol 198 · LDL 98 · HDL 52 · TG 142. At goal on current therapy.",
    detailMeta: "PDF · Oak Haven Lab",
    documentId: "p2-hd1",
  },
  {
    id: "p3-oi1",
    patientId: "p3",
    kind: "LAB DOCUMENT",
    title: "HbA1c result",
    subtitle: "Ready · 14 days ago",
    icon: "lab",
    detailTitle: "HbA1c — 7.8%",
    detailBody: "Up from 7.2% six months ago. Fasting glucose 142 mg/dL on same draw.",
    detailMeta: "Review before next visit",
    documentId: "p3-hd1",
  },
  {
    id: "p3-oi2",
    patientId: "p3",
    kind: "RX EXPIRING",
    title: "Metformin refill",
    subtitle: "Expires in 5 days",
    icon: "message",
    detailTitle: "Prescription expiring",
    detailBody: "Metformin 500mg BD — 3 days supply left. Patient messaged pharmacy.",
    detailMeta: "Renew if labs acceptable",
  },
  {
    id: "p4-oi1",
    patientId: "p4",
    kind: "FOLLOW-UP",
    title: "Post-PCI check-in",
    subtitle: "Today · Cleared for rehab",
    icon: "message",
    detailTitle: "Post-PCI day 14 visit",
    detailBody: "No angina. Incision healing well. Cardiac rehab referral sent.",
    detailMeta: "Continue DAPT per cardiology",
  },
  {
    id: "p4-oi2",
    patientId: "p4",
    kind: "LAB DOCUMENT",
    title: "Troponin trend",
    subtitle: "Resolved · admission labs",
    icon: "lab",
    detailTitle: "Serial troponins — normalized",
    detailBody: "Peak trop 0.08 ng/mL · down to <0.01 at discharge. ECG unchanged.",
    detailMeta: "PDF · Cardiology",
    documentId: "p4-hd5",
  },
  {
    id: "p5-oi1",
    patientId: "p5",
    kind: "LAB ORDER",
    title: "Spirometry",
    subtitle: "Pending · ordered 3 weeks ago",
    icon: "lab",
    detailTitle: "Spirometry order outstanding",
    detailBody: "Pre- and post-bronchodilator spirometry ordered at last visit. Not yet scheduled.",
    detailMeta: "Call patient to book",
    documentId: "p5-hd1",
  },
];

export const CHART_MEDICATIONS: ChartMedication[] = [
  {
    id: "p1-med-sal",
    patientId: "p1",
    name: "Salbutamol inhaler",
    strength: "100mcg",
    frequency: "SOS",
    route: "Inhaled",
    duration: "90 days",
    status: "ACTIVE",
    condition: "Persistent Asthma",
    icd: "ICD-10 J45.9",
    whyPrescribed:
      "Rescue bronchodilator for breakthrough wheeze and exercise-induced symptoms. Patient demonstrated correct inhaler technique; peak flow baseline recorded.",
    patientInstructions: "1–2 puffs as needed; max 8 puffs/day. Seek urgent care if no relief.",
    chartDate: "20 Jun 2026",
    chartSubtitle: "As needed · 90 days",
    chartBody: "For wheeze",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "20 Jun 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "18 Jun 2026",
    refillsRemaining: "2 of 3 remaining",
    interactions: "No significant interactions flagged",
    monitoring: "Peak flow diary reviewed · technique confirmed",
  },
  {
    id: "p1-med-pred",
    patientId: "p1",
    name: "Prednisolone",
    strength: "5mg",
    frequency: "OD",
    route: "Oral",
    duration: "5 days",
    status: "ACTIVE",
    condition: "Acute asthma exacerbation",
    icd: "ICD-10 J45.9",
    whyPrescribed:
      "Urgent visit — reduced peak flow (65% best), audible wheeze, no fever. Short course oral steroid to prevent admission.",
    clinicalNotes: "Discussed steroid side effects; return if no improvement in 48h.",
    patientInstructions: "Take with food in the morning. Do not stop early.",
    chartDate: "14 May 2026",
    chartSubtitle: "Acute asthma exacerbation · OD",
    chartBody: "Short course for acute exacerbation.",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "14 May 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "14 May 2026",
    refillsRemaining: "No refills (short course)",
    interactions: "Monitor glucose · avoid NSAIDs",
    monitoring: "Re-check peak flow in 48h",
  },
  {
    id: "p2-med-aml",
    patientId: "p2",
    name: "Amlodipine",
    strength: "5mg",
    frequency: "OD",
    route: "Oral",
    duration: "90 days",
    status: "ACTIVE",
    condition: "Essential hypertension",
    icd: "ICD-10 I10",
    whyPrescribed: "First-line calcium channel blocker for BP control. Well tolerated; no peripheral edema reported.",
    patientInstructions: "Take at the same time each morning.",
    chartDate: "12 Apr 2026",
    chartSubtitle: "Once daily · 90 days",
    chartBody: "For hypertension",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "12 Apr 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "10 Apr 2026",
    refillsRemaining: "3 of 3 remaining",
    interactions: "None significant",
    monitoring: "Home BP log reviewed monthly",
  },
  {
    id: "p2-med-tel",
    patientId: "p2",
    name: "Telmisartan",
    strength: "40mg",
    frequency: "OD",
    route: "Oral",
    duration: "90 days",
    status: "ACTIVE",
    condition: "Essential hypertension",
    icd: "ICD-10 I10",
    whyPrescribed: "Added for dual therapy when BP remained above target on monotherapy.",
    patientInstructions: "Avoid potassium supplements unless directed.",
    chartDate: "12 Apr 2026",
    chartSubtitle: "Once daily · 90 days",
    chartBody: "For hypertension",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "12 Apr 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "10 Apr 2026",
    refillsRemaining: "3 of 3 remaining",
    interactions: "Monitor renal function with ACE/ARB combo",
    monitoring: "BMP in 3 months",
  },
  {
    id: "p3-med-met",
    patientId: "p3",
    name: "Metformin",
    strength: "500mg",
    frequency: "BD",
    route: "Oral",
    duration: "90 days",
    status: "ACTIVE",
    condition: "Type 2 diabetes",
    icd: "ICD-10 E11.9",
    whyPrescribed: "First-line oral agent. GI tolerance good at current dose.",
    patientInstructions: "Take with meals to reduce GI upset.",
    chartDate: "08 Jun 2026",
    chartSubtitle: "Twice daily · 90 days",
    chartBody: "For glycemic control",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "08 Jun 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "05 Jun 2026",
    refillsRemaining: "1 of 3 remaining",
    interactions: "Hold before contrast imaging",
    monitoring: "HbA1c every 3 months",
  },
  {
    id: "p3-med-gli",
    patientId: "p3",
    name: "Glimepiride",
    strength: "1mg",
    frequency: "OD",
    route: "Oral",
    duration: "90 days",
    status: "ACTIVE",
    condition: "Type 2 diabetes",
    icd: "ICD-10 E11.9",
    whyPrescribed: "Added when HbA1c rose above 7.5% on metformin alone.",
    patientInstructions: "Take before breakfast. Recognize hypoglycemia symptoms.",
    chartDate: "08 Jun 2026",
    chartSubtitle: "Once daily · 90 days",
    chartBody: "For glycemic control",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "08 Jun 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "05 Jun 2026",
    refillsRemaining: "2 of 3 remaining",
    interactions: "Hypoglycemia risk with sulfonylureas",
    monitoring: "Fasting glucose log",
  },
  {
    id: "p4-med-asp",
    patientId: "p4",
    name: "Aspirin",
    strength: "75mg",
    frequency: "OD",
    route: "Oral",
    duration: "365 days",
    status: "ACTIVE",
    condition: "CAD post-PCI",
    icd: "ICD-10 I25.10",
    whyPrescribed: "Secondary prevention post-PCI per cardiology protocol.",
    patientInstructions: "Take after food. Report any unusual bleeding.",
    chartDate: "22 Jun 2026",
    chartSubtitle: "Once daily · DAPT",
    chartBody: "Antiplatelet therapy",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "08 Jun 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "20 Jun 2026",
    refillsRemaining: "5 of 5 remaining",
    interactions: "Bleeding risk with anticoagulants",
    monitoring: "DAPT duration per cardiology",
  },
  {
    id: "p4-med-ato",
    patientId: "p4",
    name: "Atorvastatin",
    strength: "40mg",
    frequency: "ON",
    route: "Oral",
    duration: "365 days",
    status: "ACTIVE",
    condition: "Hyperlipidemia",
    icd: "ICD-10 E78.5",
    whyPrescribed: "High-intensity statin post-PCI. LDL at goal last check.",
    patientInstructions: "Take at bedtime.",
    chartDate: "22 Jun 2026",
    chartSubtitle: "At night · ongoing",
    chartBody: "Lipid lowering",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "08 Jun 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "20 Jun 2026",
    refillsRemaining: "5 of 5 remaining",
    interactions: "Avoid grapefruit juice",
    monitoring: "LFTs at 3 months",
  },
  {
    id: "p4-med-met",
    patientId: "p4",
    name: "Metoprolol",
    strength: "25mg",
    frequency: "BD",
    route: "Oral",
    duration: "90 days",
    status: "ACTIVE",
    condition: "CAD post-PCI",
    icd: "ICD-10 I25.10",
    whyPrescribed: "Beta-blocker for rate control and post-MI/PCI cardioprotection.",
    patientInstructions: "Do not stop abruptly.",
    chartDate: "22 Jun 2026",
    chartSubtitle: "Twice daily",
    chartBody: "Cardioprotection",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "08 Jun 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "20 Jun 2026",
    refillsRemaining: "4 of 4 remaining",
    interactions: "Bradycardia with other rate-lowering agents",
    monitoring: "Resting HR at visits",
  },
  {
    id: "p5-med-tio",
    patientId: "p5",
    name: "Tiotropium",
    strength: "18mcg",
    frequency: "OD",
    route: "Inhaled",
    duration: "90 days",
    status: "ACTIVE",
    condition: "COPD",
    icd: "ICD-10 J44.9",
    whyPrescribed: "LAMA for moderate COPD. Handihaler technique demonstrated.",
    patientInstructions: "One capsule inhaled daily via Handihaler.",
    chartDate: "28 May 2026",
    chartSubtitle: "Once daily · 90 days",
    chartBody: "Maintenance bronchodilator",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "28 May 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "26 May 2026",
    refillsRemaining: "2 of 3 remaining",
    interactions: "Anticholinergic effects cumulative with others",
    monitoring: "Spirometry annually",
  },
  {
    id: "p5-med-sal",
    patientId: "p5",
    name: "Salbutamol inhaler",
    strength: "100mcg",
    frequency: "SOS",
    route: "Inhaled",
    duration: "90 days",
    status: "ACTIVE",
    condition: "COPD",
    icd: "ICD-10 J44.9",
    whyPrescribed: "Rescue bronchodilator for breakthrough dyspnea.",
    patientInstructions: "1–2 puffs as needed; max 8 puffs/day.",
    chartDate: "28 May 2026",
    chartSubtitle: "As needed · 90 days",
    chartBody: "Rescue inhaler",
    prescribedBy: "Dr. Rajesh",
    prescribedOn: "28 May 2026",
    pharmacy: "Oak Haven Central Pharmacy",
    lastFilled: "26 May 2026",
    refillsRemaining: "2 of 3 remaining",
    interactions: "Tremor at high doses",
    monitoring: "Rescue use frequency",
  },
];

export const HISTORY_VISITS: HistoryVisitEntry[] = [
  {
    id: "p1-hv1",
    patientId: "p1",
    month: "MAY 2026",
    day: "14",
    monthShort: "MAY",
    title: "Urgent follow-up — asthma exacerbation",
    meta: "In-person · Dr. Rajesh · 18 min",
    note: "Peak flow 65% best · O2 sat 91% · Prednisolone started",
    detailSections: [
      { title: "CHIEF COMPLAINT", body: "Worsening wheeze and shortness of breath for 3 days." },
      { title: "ASSESSMENT", body: "Acute asthma exacerbation, moderate. SpO₂ 91% on room air." },
      { title: "PLAN", body: "Prednisolone 5mg OD × 5 days. Continue salbutamol SOS." },
    ],
  },
  {
    id: "p2-hv1",
    patientId: "p2",
    month: "APR 2026",
    day: "12",
    monthShort: "APR",
    title: "Hypertension follow-up",
    meta: "In-person · Dr. Rajesh · 15 min",
    note: "BP 132/84 · dual therapy continued",
    detailSections: [
      { title: "CHIEF COMPLAINT", body: "Routine BP review. No headaches or chest pain." },
      { title: "PLAN", body: "Continue amlodipine and telmisartan. Repeat lipids in 3 months." },
    ],
  },
  {
    id: "p2-hv2",
    patientId: "p2",
    month: "JAN 2026",
    day: "08",
    monthShort: "JAN",
    title: "BP medication adjustment",
    meta: "Telehealth · 10 min",
    note: "Added telmisartan for suboptimal control",
    detailSections: [
      { title: "ASSESSMENT", body: "Home readings averaging 138/88 on amlodipine alone." },
      { title: "PLAN", body: "Start telmisartan 40mg OD. Cardiology referral for stress echo." },
    ],
  },
  {
    id: "p3-hv1",
    patientId: "p3",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Diabetes review",
    meta: "In-person · Dr. Rajesh · 20 min",
    note: "HbA1c 7.8% · discussed intensification",
    detailSections: [
      { title: "ASSESSMENT", body: "Suboptimal glycemic control. Adherent to metformin." },
      { title: "PLAN", body: "Continue current regimen. Nutrition referral. Repeat HbA1c in 3 months." },
    ],
  },
  {
    id: "p3-hv2",
    patientId: "p3",
    month: "MAR 2026",
    day: "15",
    monthShort: "MAR",
    title: "Annual diabetes check",
    meta: "In-person · 25 min",
    note: "HbA1c 7.2% · foot exam normal",
    detailSections: [
      { title: "PLAN", body: "Continue metformin. Added glimepiride when HbA1c rose at next visit." },
    ],
  },
  {
    id: "p3-hv3",
    patientId: "p3",
    month: "DEC 2025",
    day: "02",
    monthShort: "DEC",
    title: "New diagnosis counselling",
    meta: "In-person · 30 min",
    note: "Type 2 DM confirmed · lifestyle plan started",
    detailSections: [
      { title: "PLAN", body: "Start metformin 500mg BD. Dietitian referral." },
    ],
  },
  {
    id: "p4-hv1",
    patientId: "p4",
    month: "JUN 2026",
    day: "22",
    monthShort: "JUN",
    title: "Post-PCI follow-up",
    meta: "In-person · Dr. Rajesh · 22 min",
    note: "Cleared for cardiac rehab · no angina",
    detailSections: [
      { title: "ASSESSMENT", body: "Stable post-PCI day 14. Wound healing well." },
      { title: "PLAN", body: "Continue DAPT, statin, beta-blocker. Cardiac rehab referral." },
    ],
  },
  {
    id: "p4-hv2",
    patientId: "p4",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Discharge visit",
    meta: "In-person · 15 min",
    note: "Post-PCI discharge medications reconciled",
    detailSections: [
      { title: "PLAN", body: "Started aspirin, atorvastatin, metoprolol per cardiology." },
    ],
  },
  {
    id: "p5-hv1",
    patientId: "p5",
    month: "MAY 2026",
    day: "28",
    monthShort: "MAY",
    title: "COPD follow-up",
    meta: "In-person · Dr. Rajesh · 18 min",
    note: "Dyspnea stable on tiotropium · spirometry ordered",
    detailSections: [
      { title: "ASSESSMENT", body: "GOLD II COPD. Rescue inhaler use 2×/week." },
      { title: "PLAN", body: "Continue LAMA + rescue. Order spirometry." },
    ],
  },
];

export const HISTORY_RX: HistoryRxEntry[] = [
  {
    id: "p1-hx1",
    patientId: "p1",
    medicationId: "p1-med-sal",
    month: "JUNE 2026",
    day: "20",
    monthShort: "JUN",
    title: "Salbutamol inhaler 2 puffs",
    meta: "As needed · 90 days",
    note: "For wheeze",
  },
  {
    id: "p2-hx1",
    patientId: "p2",
    medicationId: "p2-med-aml",
    month: "APR 2026",
    day: "12",
    monthShort: "APR",
    title: "Amlodipine 5mg",
    meta: "Once daily · 90 days",
    note: "For hypertension",
  },
  {
    id: "p2-hx2",
    patientId: "p2",
    medicationId: "p2-med-tel",
    month: "JAN 2026",
    day: "08",
    monthShort: "JAN",
    title: "Telmisartan 40mg",
    meta: "Once daily · 90 days",
    note: "Added for BP control",
  },
  {
    id: "p3-hx1",
    patientId: "p3",
    medicationId: "p3-med-met",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Metformin 500mg BD",
    meta: "Twice daily · 90 days",
    note: "Renewed",
  },
  {
    id: "p3-hx2",
    patientId: "p3",
    medicationId: "p3-med-gli",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Glimepiride 1mg",
    meta: "Once daily · 90 days",
    note: "For glycemic control",
  },
  {
    id: "p4-hx1",
    patientId: "p4",
    medicationId: "p4-med-asp",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Aspirin 75mg",
    meta: "Once daily · DAPT",
    note: "Post-PCI",
  },
  {
    id: "p4-hx2",
    patientId: "p4",
    medicationId: "p4-med-ato",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Atorvastatin 40mg",
    meta: "At night",
    note: "High-intensity statin",
  },
  {
    id: "p4-hx3",
    patientId: "p4",
    medicationId: "p4-med-met",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Metoprolol 25mg BD",
    meta: "Twice daily",
    note: "Rate control",
  },
  {
    id: "p5-hx1",
    patientId: "p5",
    medicationId: "p5-med-tio",
    month: "MAY 2026",
    day: "28",
    monthShort: "MAY",
    title: "Tiotropium 18mcg",
    meta: "Once daily · Handihaler",
    note: "COPD maintenance",
  },
];

export const HISTORY_DOCUMENTS: HistoryDocumentEntry[] = [
  {
    id: "p1-hd1",
    patientId: "p1",
    month: "MAY 2026",
    day: "12",
    monthShort: "MAY",
    title: "PFT referral letter",
    meta: "PDF · Pulmonary referral",
    docType: "REFERRAL",
    filterCategory: "shared",
    icon: "document",
    report: {
      headerLabel: "REFERRAL LETTER",
      status: "SHARED",
      accent: "forest",
      reportFields: [
        { label: "FILE TYPE", value: "PDF" },
        { label: "REFERRED TO", value: "Oak Haven Pulmonary" },
        { label: "REFERRED BY", value: "Dr. Rajesh" },
        { label: "DATE", value: "12 May 2026" },
      ],
      sections: [
        {
          title: "REASON FOR REFERRAL",
          body: "Full pulmonary function testing and peak flow assessment for persistent asthma with recent exacerbation.",
        },
        {
          title: "CLINICAL NOTES",
          body: "Patient on salbutamol SOS and short course prednisolone. Peak flow diary attached separately.",
        },
      ],
    },
  },
  {
    id: "p1-hd2",
    patientId: "p1",
    month: "MAY 2026",
    day: "10",
    monthShort: "MAY",
    title: "Peak flow diary (7 days)",
    meta: "PDF · Patient shared",
    docType: "CLINICAL",
    filterCategory: "clinical",
    icon: "document",
    report: {
      headerLabel: "PATIENT DOCUMENT",
      status: "SHARED",
      accent: "forest",
      reportFields: [
        { label: "FILE TYPE", value: "PDF" },
        { label: "UPLOADED BY", value: "Patient portal" },
        { label: "PERIOD", value: "7 days" },
        { label: "DATE", value: "10 May 2026" },
      ],
      findings: [
        { label: "LOWEST", value: "240 L/min", accent: true },
        { label: "HIGHEST", value: "310 L/min" },
        { label: "LOWEST DAY", value: "Day 4 post-exacerbation" },
      ],
      sections: [
        {
          title: "SUMMARY",
          body: "Seven-day peak flow log with morning and evening readings submitted via secure message.",
        },
        {
          title: "TREND",
          body: "Values improved after steroid course but remain below personal best baseline.",
        },
      ],
    },
  },
  {
    id: "p1-hd3",
    patientId: "p1",
    month: "MAY 2026",
    day: "08",
    monthShort: "MAY",
    title: "Chest X-Ray",
    meta: "DICOM · Oak Haven Imaging",
    docType: "IMAGING",
    filterCategory: "imaging",
    icon: "imaging",
    report: {
      headerLabel: "IMAGING REPORT",
      status: "FINAL",
      accent: "amber",
      reportFields: [
        { label: "MODALITY", value: "X-Ray" },
        { label: "SOURCE", value: "Oak Haven Imaging" },
        { label: "STUDY DATE", value: "8 May 2026" },
        { label: "STATUS", value: "Final" },
      ],
      sections: [
        {
          title: "FINDINGS",
          body: "Hyperinflation without focal consolidation. No pleural effusion. Cardiomediastinal silhouette within normal limits.",
        },
        {
          title: "IMPRESSION",
          body: "Findings consistent with obstructive lung disease. No acute infiltrate.",
        },
        { title: "SIGNED BY", body: "Dr. Anand · Oak Haven Imaging · 8 May 2026" },
      ],
    },
  },
  {
    id: "p1-hd4",
    patientId: "p1",
    month: "MAY 2026",
    day: "14",
    monthShort: "MAY",
    title: "Spirometry report",
    meta: "PDF · Oak Haven Pulmonary",
    docType: "LAB",
    filterCategory: "lab",
    icon: "lab",
    report: {
      headerLabel: "LAB REPORT",
      status: "FINAL",
      accent: "terracotta",
      reportFields: [
        { label: "FILE TYPE", value: "PDF", accent: true },
        { label: "SOURCE", value: "Oak Haven Pulmonary" },
        { label: "COLLECTED", value: "14 May 2026" },
        { label: "STATUS", value: "Final" },
      ],
      findings: [
        { label: "FEV₁", value: "68% predicted", accent: true },
        { label: "FVC", value: "82% predicted" },
        { label: "FEV₁/FVC", value: "0.71" },
        { label: "POST-BRONCHODILATOR", value: "+14% improvement" },
      ],
      sections: [
        {
          title: "IMPRESSION",
          body: "Moderate obstructive ventilatory defect consistent with asthma. Post-bronchodilator improvement noted.",
        },
        {
          title: "INTERPRETATION",
          body: "Pattern supports persistent asthma with reversible component. Correlate with symptoms and peak flow diary.",
        },
        { title: "SIGNED BY", body: "Dr. Mehta · Oak Haven Pulmonary · 14 May 2026" },
      ],
    },
  },
  {
    id: "p2-hd1",
    patientId: "p2",
    month: "APR 2026",
    day: "12",
    monthShort: "APR",
    title: "Lipid panel",
    meta: "PDF · Oak Haven Lab",
    docType: "LAB",
    filterCategory: "lab",
    icon: "lab",
    report: {
      headerLabel: "LAB REPORT",
      status: "FINAL",
      accent: "terracotta",
      reportFields: [
        { label: "FILE TYPE", value: "PDF" },
        { label: "SOURCE", value: "Oak Haven Lab" },
        { label: "COLLECTED", value: "12 Apr 2026" },
        { label: "STATUS", value: "Final" },
      ],
      findings: [
        { label: "TOTAL CHOL", value: "198 mg/dL" },
        { label: "LDL", value: "98 mg/dL", accent: true },
        { label: "HDL", value: "52 mg/dL" },
        { label: "TRIGLYCERIDES", value: "142 mg/dL" },
      ],
      sections: [{ title: "INTERPRETATION", body: "Lipid panel at goal on current antihypertensive and lifestyle therapy." }],
    },
  },
  {
    id: "p2-hd2",
    patientId: "p2",
    month: "JAN 2026",
    day: "08",
    monthShort: "JAN",
    title: "Cardiology referral",
    meta: "PDF · Sent to Cardiology",
    docType: "REFERRAL",
    filterCategory: "shared",
    icon: "document",
    report: {
      headerLabel: "REFERRAL LETTER",
      status: "SHARED",
      accent: "forest",
      reportFields: [
        { label: "FILE TYPE", value: "PDF" },
        { label: "REFERRED TO", value: "Oak Haven Cardiology" },
        { label: "DATE", value: "8 Jan 2026" },
      ],
      sections: [{ title: "REASON", body: "Stress echo for exertional dyspnea despite controlled blood pressure." }],
    },
  },
  {
    id: "p3-hd1",
    patientId: "p3",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "HbA1c report",
    meta: "PDF · Oak Haven Lab",
    docType: "LAB",
    filterCategory: "lab",
    icon: "lab",
    report: {
      headerLabel: "LAB REPORT",
      status: "FINAL",
      accent: "terracotta",
      reportFields: [
        { label: "SOURCE", value: "Oak Haven Lab" },
        { label: "COLLECTED", value: "8 Jun 2026" },
        { label: "STATUS", value: "Final" },
      ],
      findings: [
        { label: "HbA1c", value: "7.8%", accent: true },
        { label: "FASTING GLUCOSE", value: "142 mg/dL" },
      ],
      sections: [{ title: "INTERPRETATION", body: "Glycemic control suboptimal; up from 7.2% six months ago." }],
    },
  },
  {
    id: "p3-hd2",
    patientId: "p3",
    month: "MAR 2026",
    day: "15",
    monthShort: "MAR",
    title: "Retinopathy screening",
    meta: "PDF · Ophthalmology",
    docType: "CLINICAL",
    filterCategory: "imaging",
    icon: "imaging",
    report: {
      headerLabel: "IMAGING REPORT",
      status: "FINAL",
      accent: "amber",
      reportFields: [
        { label: "SOURCE", value: "Oak Haven Ophthalmology" },
        { label: "STUDY DATE", value: "15 Mar 2026" },
      ],
      sections: [{ title: "IMPRESSION", body: "No diabetic retinopathy identified on screening exam." }],
    },
  },
  {
    id: "p4-hd1",
    patientId: "p4",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "PCI procedure note",
    meta: "PDF · Cardiology",
    docType: "CLINICAL",
    filterCategory: "clinical",
    icon: "document",
    report: {
      headerLabel: "PROCEDURE NOTE",
      status: "FINAL",
      accent: "forest",
      reportFields: [
        { label: "PROCEDURE", value: "PCI with DES" },
        { label: "LOCATION", value: "LAD" },
        { label: "DATE", value: "8 Jun 2026" },
      ],
      sections: [{ title: "SUMMARY", body: "Successful PCI with drug-eluting stent to LAD. No complications." }],
    },
  },
  {
    id: "p4-hd2",
    patientId: "p4",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Discharge summary",
    meta: "PDF · Cardiology ward",
    docType: "CLINICAL",
    filterCategory: "shared",
    icon: "document",
    report: {
      headerLabel: "DISCHARGE SUMMARY",
      status: "FINAL",
      accent: "forest",
      reportFields: [
        { label: "WARD", value: "Cardiology" },
        { label: "DISCHARGE DATE", value: "8 Jun 2026" },
      ],
      sections: [{ title: "FOLLOW-UP", body: "PCP in 2 weeks · cardiology in 4 weeks. Continue DAPT and cardiac rehab." }],
    },
  },
  {
    id: "p4-hd3",
    patientId: "p4",
    month: "JUN 2026",
    day: "06",
    monthShort: "JUN",
    title: "Echo report",
    meta: "PDF · Cardiology",
    docType: "IMAGING",
    filterCategory: "imaging",
    icon: "imaging",
    report: {
      headerLabel: "IMAGING REPORT",
      status: "FINAL",
      accent: "amber",
      reportFields: [
        { label: "MODALITY", value: "Echocardiogram" },
        { label: "DATE", value: "6 Jun 2026" },
      ],
      findings: [
        { label: "LVEF", value: "55%", accent: true },
        { label: "WALL MOTION", value: "Improved regional" },
      ],
      sections: [{ title: "IMPRESSION", body: "Left ventricular function preserved post-PCI." }],
    },
  },
  {
    id: "p4-hd4",
    patientId: "p4",
    month: "MAY 2026",
    day: "30",
    monthShort: "MAY",
    title: "Cath lab images",
    meta: "DICOM · Cardiology",
    docType: "IMAGING",
    filterCategory: "imaging",
    icon: "imaging",
    report: {
      headerLabel: "IMAGING REPORT",
      status: "FINAL",
      accent: "amber",
      reportFields: [
        { label: "MODALITY", value: "Coronary angiography" },
        { label: "DATE", value: "30 May 2026" },
      ],
      findings: [{ label: "LAD STENOSIS", value: "90%", accent: true }],
      sections: [{ title: "FINDINGS", body: "Significant LAD stenosis treated with drug-eluting stent." }],
    },
  },
  {
    id: "p4-hd5",
    patientId: "p4",
    month: "JUN 2026",
    day: "07",
    monthShort: "JUN",
    title: "Troponin trend",
    meta: "PDF · Cardiology",
    docType: "LAB",
    filterCategory: "lab",
    icon: "lab",
    report: {
      headerLabel: "LAB REPORT",
      status: "FINAL",
      accent: "terracotta",
      reportFields: [
        { label: "FILE TYPE", value: "PDF", accent: true },
        { label: "SOURCE", value: "Cardiology ward" },
        { label: "COLLECTED", value: "6–8 Jun 2026" },
        { label: "STATUS", value: "Final" },
      ],
      findings: [
        { label: "PEAK TROP", value: "0.08 ng/mL", accent: true },
        { label: "DISCHARGE", value: "<0.01 ng/mL" },
        { label: "ECG", value: "Unchanged from admission" },
      ],
      sections: [
        {
          title: "INTERPRETATION",
          body: "Serial troponins normalized over admission. No ongoing ischemic pattern on ECG.",
        },
        { title: "SIGNED BY", body: "Dr. Kapoor · Cardiology · 8 Jun 2026" },
      ],
    },
  },
  {
    id: "p5-hd1",
    patientId: "p5",
    month: "MAY 2026",
    day: "28",
    monthShort: "MAY",
    title: "Spirometry order",
    meta: "PDF · Pulmonary",
    docType: "LAB",
    filterCategory: "lab",
    icon: "lab",
    report: {
      headerLabel: "LAB ORDER",
      status: "PENDING",
      accent: "terracotta",
      reportFields: [
        { label: "ORDERED", value: "28 May 2026" },
        { label: "STATUS", value: "Not yet completed", accent: true },
        { label: "LOCATION", value: "Oak Haven Pulmonary" },
      ],
      sections: [{ title: "INDICATION", body: "COPD follow-up · pre- and post-bronchodilator spirometry." }],
    },
  },
];

export const HISTORY_VITALS: HistoryVitalEntry[] = [
  {
    id: "p1-hvt1",
    patientId: "p1",
    month: "MAY 2026",
    day: "14",
    monthShort: "MAY",
    title: "Urgent visit vitals",
    meta: "Recorded at check-in",
    readings: [
      { label: "BP", value: "118/76" },
      { label: "HR", value: "92 bpm" },
      { label: "SpO₂", value: "91%" },
      { label: "Peak flow", value: "280 L/min" },
    ],
    detailSections: [
      { title: "CONTEXT", body: "Recorded at urgent visit. Audible wheeze." },
      { title: "NURSING NOTE", body: "SpO₂ improved to 94% after bronchodilator." },
    ],
  },
  {
    id: "p1-hvt2",
    patientId: "p1",
    month: "MAR 2026",
    day: "18",
    monthShort: "MAR",
    title: "Routine follow-up vitals",
    meta: "Nursing station",
    readings: [
      { label: "BP", value: "122/80" },
      { label: "HR", value: "78 bpm" },
      { label: "SpO₂", value: "97%" },
      { label: "Weight", value: "58 kg" },
    ],
    detailSections: [{ title: "TREND", body: "Baseline SpO₂ 96–98% at prior visits." }],
  },
  {
    id: "p2-hvt1",
    patientId: "p2",
    month: "APR 2026",
    day: "12",
    monthShort: "APR",
    title: "Clinic vitals",
    meta: "Nursing station",
    readings: [
      { label: "BP", value: "132/84" },
      { label: "HR", value: "72 bpm" },
      { label: "Weight", value: "82 kg" },
    ],
    detailSections: [{ title: "NOTE", body: "BP at target on dual therapy." }],
  },
  {
    id: "p2-hvt2",
    patientId: "p2",
    month: "JAN 2026",
    day: "08",
    monthShort: "JAN",
    title: "Telehealth vitals (home)",
    meta: "Patient-reported",
    readings: [
      { label: "BP", value: "138/88" },
      { label: "HR", value: "76 bpm" },
    ],
    detailSections: [{ title: "NOTE", body: "Home cuff validated at prior visit." }],
  },
  {
    id: "p3-hvt1",
    patientId: "p3",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Diabetes visit vitals",
    meta: "Nursing station",
    readings: [
      { label: "BP", value: "128/82" },
      { label: "HR", value: "80 bpm" },
      { label: "Weight", value: "74 kg" },
      { label: "BMI", value: "31" },
    ],
    detailSections: [{ title: "NOTE", body: "Weight up 1 kg since last visit." }],
  },
  {
    id: "p3-hvt2",
    patientId: "p3",
    month: "MAR 2026",
    day: "15",
    monthShort: "MAR",
    title: "Annual check vitals",
    meta: "Nursing station",
    readings: [
      { label: "BP", value: "124/78" },
      { label: "HR", value: "74 bpm" },
      { label: "Weight", value: "73 kg" },
    ],
    detailSections: [{ title: "NOTE", body: "Foot exam normal." }],
  },
  {
    id: "p4-hvt1",
    patientId: "p4",
    month: "JUN 2026",
    day: "22",
    monthShort: "JUN",
    title: "Post-PCI follow-up vitals",
    meta: "Clinic",
    readings: [
      { label: "BP", value: "118/70" },
      { label: "HR", value: "62 bpm" },
      { label: "SpO₂", value: "98%" },
    ],
    detailSections: [{ title: "NOTE", body: "HR appropriate on metoprolol." }],
  },
  {
    id: "p4-hvt2",
    patientId: "p4",
    month: "JUN 2026",
    day: "08",
    monthShort: "JUN",
    title: "Discharge vitals",
    meta: "Ward",
    readings: [
      { label: "BP", value: "126/78" },
      { label: "HR", value: "68 bpm" },
      { label: "SpO₂", value: "97%" },
    ],
    detailSections: [{ title: "NOTE", body: "Stable for discharge." }],
  },
  {
    id: "p5-hvt1",
    patientId: "p5",
    month: "MAY 2026",
    day: "28",
    monthShort: "MAY",
    title: "COPD visit vitals",
    meta: "Nursing station",
    readings: [
      { label: "BP", value: "130/80" },
      { label: "HR", value: "84 bpm" },
      { label: "SpO₂", value: "94%" },
      { label: "RR", value: "18/min" },
    ],
    detailSections: [{ title: "NOTE", body: "SpO₂ baseline 93–95% on room air." }],
  },
];

export function getPanelPatient(id: string) {
  return PANEL_PATIENTS.find((p) => p.id === id);
}

export function patientsForView(view: PanelView) {
  if (view === "today") return PANEL_PATIENTS.filter((p) => p.categories.includes("today"));
  if (view === "urgent") return PANEL_PATIENTS.filter((p) => p.status === "Urgent");
  return PANEL_PATIENTS;
}

export function getChartMedication(id: string) {
  return CHART_MEDICATIONS.find((m) => m.id === id);
}

export function getPatientTherapy(patientId: string) {
  return CHART_THERAPIES.find((t) => t.patientId === patientId);
}

export function getPatientProblems(patientId: string) {
  return CHART_PROBLEMS.filter((p) => p.patientId === patientId);
}

export function getPatientOpenItems(patientId: string) {
  return CHART_OPEN_ITEMS.filter((o) => o.patientId === patientId);
}

export function getPatientMedications(patientId: string) {
  return CHART_MEDICATIONS.filter((m) => m.patientId === patientId);
}

export function getPatientHistoryVisits(patientId: string) {
  return HISTORY_VISITS.filter((v) => v.patientId === patientId);
}

export function getPatientHistoryRx(patientId: string) {
  return HISTORY_RX.filter((r) => r.patientId === patientId);
}

export function getPatientHistoryDocuments(patientId: string) {
  return HISTORY_DOCUMENTS.filter((d) => d.patientId === patientId);
}

export function getDocumentFilterCounts(patientId: string) {
  const docs = getPatientHistoryDocuments(patientId);
  return {
    all: docs.length,
    lab: docs.filter((d) => d.filterCategory === "lab").length,
    imaging: docs.filter((d) => d.filterCategory === "imaging").length,
    shared: docs.filter((d) => d.filterCategory === "shared").length,
  };
}

export function filterPatientDocuments(patientId: string, filter: DocumentFilterTab) {
  const docs = getPatientHistoryDocuments(patientId);
  if (filter === "all") return docs;
  return docs.filter((d) => d.filterCategory === filter);
}

export function getPatientHistoryVitals(patientId: string) {
  return HISTORY_VITALS.filter((v) => v.patientId === patientId);
}

export function getHistoryVisit(id: string) {
  return HISTORY_VISITS.find((v) => v.id === id);
}

export function getHistoryDocument(id: string) {
  return HISTORY_DOCUMENTS.find((d) => d.id === id);
}

export function getHistoryVital(id: string) {
  return HISTORY_VITALS.find((v) => v.id === id);
}

export function getOpenItem(id: string) {
  return CHART_OPEN_ITEMS.find((o) => o.id === id);
}
