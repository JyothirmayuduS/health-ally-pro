import { getPanelPatient } from "@/lib/doctor-patients-apk-data";

export type ResultFilterTab = "all" | "review" | "patient-shared" | "imaging";

export type ResultAnalyte = {
  name: string;
  ref: string;
  value: string;
  flag?: "Borderline" | "High" | "Low" | "Critical";
};

export type ResultReferral = {
  id: string;
  specialty: string;
  facility: string;
  status: "Pending" | "Accepted" | "Declined";
  statusDetail: string;
  linkedDocument: string;
};

export type ResultHistoryEntry = {
  id: string;
  action: string;
  detail?: string;
  actor: string;
  relativeTime: string;
  absoluteTime: string;
  isLatest?: boolean;
};

export type ResultDocument = {
  id: string;
  patientId: string;
  title: string;
  modality: string;
  modalityClass: string;
  channel: "Lab" | "Patient shared" | "Imaging" | "Clinical";
  description: string;
  source: string;
  relativeTime: string;
  needsReview: boolean;
  flagged: boolean;
  status: "Processing" | "Final" | "Signed off";
  statusNote?: string;
  accent: string;
  iconKind: "lab" | "document" | "imaging" | "patient";
  footerNote?: string;
  filterTabs: ResultFilterTab[];
  pageCount: number;
  fileFormat: string;
  payloadSize: string;
  structuredAnalyteCount?: number;
  analytes?: ResultAnalyte[];
  clinicalImpression?: string;
  referrals?: ResultReferral[];
  history: ResultHistoryEntry[];
  chartStatus?: string;
  riskStratification?: string;
  lastClinicVisit?: string;
  specimenDate?: string;
  receivedAt?: string;
  orderingClinician?: string;
  interfaceSource?: string;
  inboxStatus?: string;
  indexSummary?: string;
  chartAttachment?: string;
  documentRecordId: string;
  integrity?: string;
  retention?: string;
  /** Set when channel is Patient shared — controls intake gate */
  patientUploadIntake?: PatientUploadIntake | null;
};

export type PatientUploadIntake = "pending" | "accepted" | "declined";

export type ResultsImagingState = {
  signedOff: string[];
  openedAt: Record<string, string>;
  patientUploadIntake: Record<string, PatientUploadIntake>;
};

const STORAGE_KEY = "medora-doctor-results-v1";
export const RESULTS_IMAGING_EVENT = "medora-doctor-results-updated";

const SEED_DOCUMENTS: ResultDocument[] = [
  {
    id: "R7",
    patientId: "p2",
    title: "Lipid panel",
    modality: "LAB",
    modalityClass: "Lab",
    channel: "Lab",
    description: "Fasting sample received; LDL and triglycerides pending verification.",
    source: "Thyrocare — Koramangala",
    relativeTime: "about 1 month ago",
    needsReview: true,
    flagged: true,
    status: "Processing",
    accent: "#F0DDD6",
    iconKind: "lab",
    footerNote: "Referral initiated · Internal medicine / Endocrinology",
    filterTabs: ["all", "review"],
    pageCount: 1,
    fileFormat: "PDF + structured lab data",
    payloadSize: "980 KB",
    structuredAnalyteCount: 3,
    analytes: [
      { name: "Total cholesterol", ref: "Ref <200", value: "218 mg/dL", flag: "Borderline" },
      { name: "LDL", ref: "Ref <100", value: "Pending", flag: "Borderline" },
      { name: "Triglycerides", ref: "Ref <150", value: "Pending mg/dL" },
    ],
    clinicalImpression:
      "Preliminary fasting panel — await verified LDL/TG before statin adjustment.",
    referrals: [
      {
        id: "ref1",
        specialty: "Cardiology",
        facility: "Thyrocare — Koramangala",
        status: "Pending",
        statusDetail: "Referral sent · To Cardiology · Thyrocare — Koramangala",
        linkedDocument: "Lipid panel",
      },
      {
        id: "ref2",
        specialty: "Radiology",
        facility: "Metro Imaging",
        status: "Accepted",
        statusDetail: "Accepted · Patient & referring teams notified",
        linkedDocument: "Lumbar MRI report",
      },
    ],
    history: [
      {
        id: "h1",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "less than a minute ago",
        absoluteTime: "24 Jun · 9:22 PM",
        isLatest: true,
      },
      {
        id: "h2",
        action: "Referral initiated",
        detail: "Internal medicine / Endocrinology",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "10 days ago",
        absoluteTime: "14 Jun · 3:18 PM",
      },
      {
        id: "h3",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "10 days ago",
        absoluteTime: "14 Jun · 3:18 PM",
      },
      {
        id: "h4",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "27 days ago",
        absoluteTime: "28 May · 7:33 PM",
      },
      {
        id: "h5",
        action: "Referral initiated",
        detail: "Internal medicine / Endocrinology",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "about 1 month ago",
        absoluteTime: "24 May · 5:26 PM",
      },
      {
        id: "h6",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "about 1 month ago",
        absoluteTime: "24 May · 5:26 PM",
      },
      {
        id: "h7",
        action: "Document received",
        detail: "Lab · 980 KB",
        actor: "Thyrocare — Koramangala",
        relativeTime: "about 1 month ago",
        absoluteTime: "23 May · 10:53 PM",
      },
      {
        id: "h8",
        action: "Result finalized",
        detail: "Flagged — abnormal values suspected",
        actor: "Thyrocare — Koramangala",
        relativeTime: "about 1 month ago",
        absoluteTime: "23 May · 11:10 PM",
      },
    ],
    chartStatus: "Stable",
    riskStratification: "LOW",
    lastClinicVisit: "13 Apr 2026",
    specimenDate: "Saturday, 23 May 2026",
    receivedAt: "23 May 2026 · 10:53 PM",
    orderingClinician: "Dr. Rajesh Mehta · Medora Clinic",
    interfaceSource: "HL7 / lab interface (demo)",
    inboxStatus: "Pending verification",
    indexSummary: "Fasting sample received; LDL and triglycerides pending verification.",
    chartAttachment: "Not yet filed",
    documentRecordId: "R7",
    integrity: "SHA-256 anchored · demo ledger",
    retention: "7 years · clinic policy (demo)",
  },
  {
    id: "R1",
    patientId: "p3",
    title: "Food diary photos",
    modality: "PATIENT",
    modalityClass: "Patient shared",
    channel: "Patient shared",
    description: "7-day meal log with portion photos for diabetes review.",
    source: "Patient app upload",
    relativeTime: "3 days ago",
    needsReview: true,
    flagged: true,
    status: "Processing",
    accent: "#E8EFE6",
    iconKind: "patient",
    footerNote: "Awaiting clinician review",
    filterTabs: ["all", "review", "patient-shared"],
    pageCount: 14,
    fileFormat: "JPEG bundle",
    payloadSize: "4.2 MB",
    history: [
      {
        id: "h1",
        action: "Patient shared document",
        actor: "Priya Sharma",
        relativeTime: "3 days ago",
        absoluteTime: "21 Jun · 2:15 PM",
        isLatest: true,
      },
    ],
    documentRecordId: "R1",
    inboxStatus: "Pending verification",
    chartAttachment: "Not yet filed",
  },
  {
    id: "R2",
    patientId: "p3",
    title: "HbA1c + fasting glucose",
    modality: "LAB",
    modalityClass: "Lab",
    channel: "Lab",
    description: "HbA1c 7.8% · fasting glucose 142 mg/dL — above target.",
    source: "Oak Haven Lab",
    relativeTime: "14 days ago",
    needsReview: true,
    flagged: true,
    status: "Final",
    accent: "#F0DDD6",
    iconKind: "lab",
    footerNote: "Flagged for diabetes review",
    filterTabs: ["all", "review"],
    pageCount: 2,
    fileFormat: "PDF + structured lab data",
    payloadSize: "1.1 MB",
    structuredAnalyteCount: 2,
    analytes: [
      { name: "HbA1c", ref: "Ref <7.0%", value: "7.8%", flag: "High" },
      { name: "Fasting glucose", ref: "Ref 70–99", value: "142 mg/dL", flag: "High" },
    ],
    clinicalImpression: "Glycemic control worsened — discuss medication intensification.",
    history: [
      {
        id: "h1",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "2 days ago",
        absoluteTime: "22 Jun · 11:00 AM",
        isLatest: true,
      },
    ],
    chartStatus: "Monitoring",
    documentRecordId: "R2",
    inboxStatus: "Pending sign-off",
    chartAttachment: "Not yet filed",
  },
  {
    id: "R3",
    patientId: "p1",
    title: "Spirometry report",
    modality: "LAB",
    modalityClass: "Lab",
    channel: "Lab",
    description: "Moderate obstructive pattern · post-bronchodilator improvement.",
    source: "Oak Haven Pulmonary",
    relativeTime: "14 days ago",
    needsReview: true,
    flagged: false,
    status: "Final",
    accent: "#F5E6B8",
    iconKind: "lab",
    filterTabs: ["all", "review"],
    pageCount: 3,
    fileFormat: "PDF",
    payloadSize: "620 KB",
    history: [
      {
        id: "h1",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "5 days ago",
        absoluteTime: "19 Jun · 4:30 PM",
        isLatest: true,
      },
    ],
    documentRecordId: "R3",
    inboxStatus: "Pending sign-off",
    chartAttachment: "Not yet filed",
  },
  {
    id: "R4",
    patientId: "p4",
    title: "Lumbar MRI report",
    modality: "IMAGING",
    modalityClass: "Imaging",
    channel: "Imaging",
    description: "Degenerative disc disease L4-L5 · no cord compression.",
    source: "Metro Imaging",
    relativeTime: "Today",
    needsReview: false,
    flagged: false,
    status: "Signed off",
    accent: "#E8EFE6",
    iconKind: "imaging",
    filterTabs: ["all", "imaging"],
    pageCount: 4,
    fileFormat: "PDF + DICOM link",
    payloadSize: "2.8 MB",
    history: [
      {
        id: "h1",
        action: "Signed off & filed",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "2 hours ago",
        absoluteTime: "24 Jun · 7:15 PM",
        isLatest: true,
      },
    ],
    documentRecordId: "R4",
    inboxStatus: "Filed in chart",
    chartAttachment: "Filed · Cardiology tab",
  },
  {
    id: "R5",
    patientId: "p2",
    title: "Home BP log export",
    modality: "PATIENT",
    modalityClass: "Patient shared",
    channel: "Patient shared",
    description: "30-day home readings · avg 138/88 mmHg.",
    source: "Patient app",
    relativeTime: "1 week ago",
    needsReview: false,
    flagged: false,
    status: "Final",
    accent: "#EDEAE6",
    iconKind: "patient",
    filterTabs: ["all", "patient-shared"],
    pageCount: 1,
    fileFormat: "CSV + chart",
    payloadSize: "48 KB",
    history: [
      {
        id: "h1",
        action: "Reviewed",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "6 days ago",
        absoluteTime: "18 Jun · 9:00 AM",
        isLatest: true,
      },
    ],
    documentRecordId: "R5",
    inboxStatus: "Reviewed",
    chartAttachment: "Filed · Vitals",
  },
  {
    id: "R6",
    patientId: "p5",
    title: "Chest X-ray",
    modality: "IMAGING",
    modalityClass: "Imaging",
    channel: "Imaging",
    description: "No acute infiltrate · hyperinflation consistent with COPD.",
    source: "Oak Haven Radiology",
    relativeTime: "3 weeks ago",
    needsReview: false,
    flagged: false,
    status: "Signed off",
    accent: "#F0DDD6",
    iconKind: "imaging",
    filterTabs: ["all", "imaging"],
    pageCount: 2,
    fileFormat: "PDF + DICOM",
    payloadSize: "3.1 MB",
    history: [
      {
        id: "h1",
        action: "Signed off & filed",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "3 weeks ago",
        absoluteTime: "3 Jun · 2:00 PM",
        isLatest: true,
      },
    ],
    documentRecordId: "R6",
    inboxStatus: "Filed in chart",
    chartAttachment: "Filed",
  },
  {
    id: "R8",
    patientId: "p1",
    title: "Peak flow diary",
    modality: "PATIENT",
    modalityClass: "Patient shared",
    channel: "Patient shared",
    description: "2-week peak flow readings with symptom notes.",
    source: "Patient app",
    relativeTime: "9 days ago",
    needsReview: true,
    flagged: true,
    status: "Processing",
    accent: "#FCE8E6",
    iconKind: "patient",
    filterTabs: ["all", "review", "patient-shared"],
    pageCount: 1,
    fileFormat: "PDF",
    payloadSize: "210 KB",
    clinicalImpression:
      "Variable peak flow with morning dipping — suggests suboptimal control. Review inhaler technique and adherence.",
    history: [
      {
        id: "h1",
        action: "Flagged for follow-up",
        actor: "System",
        relativeTime: "9 days ago",
        absoluteTime: "15 Jun · 8:00 AM",
        isLatest: true,
      },
    ],
    documentRecordId: "R8",
    inboxStatus: "Pending verification",
    chartAttachment: "Not yet filed",
  },
  {
    id: "R9",
    patientId: "p4",
    title: "Troponin trend",
    modality: "LAB",
    modalityClass: "Lab",
    channel: "Lab",
    description: "Serial troponins normalized post-PCI.",
    source: "Cardiology lab",
    relativeTime: "Today",
    needsReview: false,
    flagged: false,
    status: "Final",
    accent: "#E8EFE6",
    iconKind: "lab",
    filterTabs: ["all"],
    pageCount: 1,
    fileFormat: "Structured data",
    payloadSize: "120 KB",
    history: [
      {
        id: "h1",
        action: "Auto-filed",
        actor: "System",
        relativeTime: "Today",
        absoluteTime: "24 Jun · 10:00 AM",
        isLatest: true,
      },
    ],
    documentRecordId: "R9",
    inboxStatus: "Filed in chart",
    chartAttachment: "Filed",
  },
  {
    id: "R10",
    patientId: "p3",
    title: "Retinal screening",
    modality: "IMAGING",
    modalityClass: "Imaging",
    channel: "Imaging",
    description: "Mild non-proliferative diabetic retinopathy.",
    source: "Vision Care Partners",
    relativeTime: "1 month ago",
    needsReview: true,
    flagged: true,
    status: "Final",
    accent: "#F5E6B8",
    iconKind: "imaging",
    filterTabs: ["all", "review", "imaging"],
    pageCount: 2,
    fileFormat: "PDF + images",
    payloadSize: "5.4 MB",
    history: [
      {
        id: "h1",
        action: "Opened for review",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "12 days ago",
        absoluteTime: "12 Jun · 3:00 PM",
        isLatest: true,
      },
    ],
    documentRecordId: "R10",
    inboxStatus: "Pending sign-off",
    chartAttachment: "Not yet filed",
  },
  {
    id: "R11",
    patientId: "p2",
    title: "ECG — 12 lead",
    modality: "IMAGING",
    modalityClass: "Imaging",
    channel: "Imaging",
    description: "Normal sinus rhythm · no ST changes.",
    source: "Oak Haven Cardiology",
    relativeTime: "2 months ago",
    needsReview: false,
    flagged: false,
    status: "Signed off",
    accent: "#EDEAE6",
    iconKind: "imaging",
    filterTabs: ["all", "imaging"],
    pageCount: 1,
    fileFormat: "PDF",
    payloadSize: "340 KB",
    history: [
      {
        id: "h1",
        action: "Signed off & filed",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "2 months ago",
        absoluteTime: "24 Apr · 11:30 AM",
        isLatest: true,
      },
    ],
    documentRecordId: "R11",
    inboxStatus: "Filed in chart",
    chartAttachment: "Filed",
  },
  {
    id: "R12",
    patientId: "p5",
    title: "PFT summary",
    modality: "LAB",
    modalityClass: "Lab",
    channel: "Lab",
    description: "Moderate COPD · FEV1 58% predicted.",
    source: "Oak Haven Pulmonary",
    relativeTime: "3 weeks ago",
    needsReview: false,
    flagged: false,
    status: "Final",
    accent: "#F0DDD6",
    iconKind: "lab",
    filterTabs: ["all"],
    pageCount: 2,
    fileFormat: "PDF",
    payloadSize: "890 KB",
    history: [
      {
        id: "h1",
        action: "Reviewed",
        actor: "Dr. Rajesh Mehta",
        relativeTime: "3 weeks ago",
        absoluteTime: "3 Jun · 4:00 PM",
        isLatest: true,
      },
    ],
    documentRecordId: "R12",
    inboxStatus: "Reviewed",
    chartAttachment: "Filed",
  },
];

function loadState(): ResultsImagingState {
  if (typeof window === "undefined") {
    return { signedOff: [], openedAt: {}, patientUploadIntake: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { signedOff: [], openedAt: {}, patientUploadIntake: {} };
    const parsed = JSON.parse(raw) as Partial<ResultsImagingState>;
    return {
      signedOff: parsed.signedOff ?? [],
      openedAt: parsed.openedAt ?? {},
      patientUploadIntake: parsed.patientUploadIntake ?? {},
    };
  } catch {
    return { signedOff: [], openedAt: {}, patientUploadIntake: {} };
  }
}

function saveState(state: ResultsImagingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(RESULTS_IMAGING_EVENT));
}

function resolvePatientUploadIntake(
  doc: ResultDocument,
  state: ResultsImagingState,
): PatientUploadIntake | null {
  if (doc.channel !== "Patient shared") return null;
  const stored = state.patientUploadIntake[doc.id];
  if (stored) return stored;
  if (state.patientUploadIntake[doc.id] === undefined && !doc.needsReview) {
    return "accepted";
  }
  return "pending";
}

export function isPatientUploadGated(doc: ResultDocument): boolean {
  return doc.patientUploadIntake === "pending";
}

export function acceptPatientUpload(id: string) {
  const state = loadState();
  state.patientUploadIntake[id] = "accepted";
  saveState(state);
}

export function declinePatientUpload(id: string) {
  const state = loadState();
  state.patientUploadIntake[id] = "declined";
  saveState(state);
}

/** Read validated lab results published by the lab supervisor from shared storage */
function loadPublishedLabResults(): Array<{
  id: string;
  patientId: string;
  doctorPatientId: string;
  orderId: string;
  testName: string;
  testCode: string;
  date: string;
  status: "normal" | "abnormal" | "pending";
  summary: string;
  results?: Record<string, string>;
  doctorName?: string;
  doctorId?: string;
  patientName?: string;
}> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("medora-lab-results-v1");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Convert a published lab result into a ResultDocument for the doctor's inbox */
function publishedResultToDocument(r: ReturnType<typeof loadPublishedLabResults>[number]): ResultDocument {
  const isAbnormal = r.status === "abnormal";
  const analytes: ResultAnalyte[] = r.results
    ? Object.entries(r.results).map(([key, value]) => ({
        name: key,
        ref: "—",
        value: String(value),
        flag: isAbnormal ? ("High" as const) : undefined,
      }))
    : [];

  const relativeTime = r.date
    ? (() => {
        const diff = Date.now() - new Date(r.date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 2) return "Just now";
        if (mins < 60) return `${mins} minutes ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
      })()
    : "Recently";

  const doctorLabel = r.doctorName ? `Dr. ${r.doctorName.replace(/^Dr\.?\s*/i, "")}` : "Ordering Clinician";
  const patientLabel = r.patientName || "Patient";

  return {
    id: r.id,
    patientId: r.doctorPatientId || r.patientId,
    title: r.testName,
    modality: "LAB",
    modalityClass: "Lab",
    channel: "Lab",
    description: r.summary || `${r.testName} results validated and released by Oakhaven Laboratory.`,
    source: "Oakhaven Laboratory",
    relativeTime,
    needsReview: isAbnormal,
    flagged: isAbnormal,
    status: "Final",
    accent: isAbnormal ? "#F0DDD6" : "#E8EFE6",
    iconKind: "lab",
    filterTabs: ["all"],
    pageCount: 1,
    fileFormat: "PDF",
    payloadSize: "—",
    analytes: analytes.length > 0 ? analytes : undefined,
    structuredAnalyteCount: analytes.length || undefined,
    history: [
      {
        id: `h-${r.id}`,
        action: "Validated & released by Lab Supervisor",
        detail: `Ordered by ${doctorLabel} for ${patientLabel}`,
        actor: "Oakhaven Laboratory",
        relativeTime,
        absoluteTime: r.date ? new Date(r.date).toLocaleString() : relativeTime,
        isLatest: true,
      },
    ],
    documentRecordId: r.id,
    inboxStatus: isAbnormal ? "Needs review" : "Final — released",
    orderingClinician: r.doctorName || undefined,
    interfaceSource: "Lab Desk — Oakhaven",
    specimenDate: r.date,
    receivedAt: r.date,
    indexSummary: r.summary || `Ordered by ${doctorLabel}`,
  };
}

export function listResultDocuments(): ResultDocument[] {
  const state = loadState();

  // Seed documents with sign-off / intake state applied
  const seedDocs = SEED_DOCUMENTS.map((doc) => {
    const intake = resolvePatientUploadIntake(doc, state);
    const declined = intake === "declined";
    const signed = state.signedOff.includes(doc.id);

    return {
      ...doc,
      patientUploadIntake: intake,
      status: signed ? "Signed off" : declined ? "Final" : doc.status,
      needsReview: signed || declined ? false : doc.needsReview,
      chartAttachment: signed
        ? "Filed in chart"
        : declined
          ? "Declined — not filed"
          : doc.chartAttachment,
      inboxStatus: signed
        ? "Filed in chart"
        : declined
          ? "Declined by clinician"
          : intake === "pending"
            ? "Awaiting accept or decline"
            : doc.inboxStatus,
      footerNote: declined
        ? "Declined by clinician"
        : intake === "pending"
          ? "Patient upload — accept to view"
          : doc.footerNote,
    } as ResultDocument;
  });

  // Dynamic docs from validated lab results (published by lab supervisor)
  const publishedResults = loadPublishedLabResults();
  const seedIds = new Set(SEED_DOCUMENTS.map((d) => d.id));
  const dynamicDocs: ResultDocument[] = publishedResults
    .filter((r) => !seedIds.has(r.id)) // avoid duplicating any seed doc
    .map((r) => {
      const doc = publishedResultToDocument(r);
      const signed = state.signedOff.includes(doc.id);
      return {
        ...doc,
        status: signed ? ("Signed off" as const) : doc.status,
        needsReview: signed ? false : doc.needsReview,
        inboxStatus: signed ? "Filed in chart" : doc.inboxStatus,
        chartAttachment: signed ? "Filed in chart" : doc.chartAttachment,
      };
    });

  // Put dynamic (live results) first so they appear at top of inbox
  return [...dynamicDocs, ...seedDocs];
}

export function getResultDocument(id: string): ResultDocument | undefined {
  return listResultDocuments().find((d) => d.id === id);
}

export function resultFilterCounts(docs: ResultDocument[]) {
  return {
    all: docs.length,
    review: docs.filter((d) => d.needsReview).length,
    patientShared: docs.filter((d) => d.filterTabs.includes("patient-shared")).length,
    imaging: docs.filter((d) => d.filterTabs.includes("imaging")).length,
  };
}

export function awaitingSignOffCount(docs: ResultDocument[]) {
  return docs.filter((d) => d.needsReview).length;
}

export function signOffResult(id: string) {
  const state = loadState();
  if (!state.signedOff.includes(id)) {
    state.signedOff = [...state.signedOff, id];
    saveState(state);
  }
}

export function markResultOpened(id: string) {
  const state = loadState();
  state.openedAt[id] = new Date().toISOString();
  saveState(state);
}

export function getResultPatientName(patientId: string) {
  return getPanelPatient(patientId)?.name ?? "Unknown patient";
}

export function getResultPatientRef(patientId: string) {
  return getPanelPatient(patientId)?.patientRef ?? "—";
}

export type ResultSort = "priority" | "newest" | "patient" | "title";

export const RESULT_SORT_LABELS: Record<ResultSort, string> = {
  priority: "Priority",
  newest: "Newest",
  patient: "Patient",
  title: "Title",
};

export type ResultSeverity = "critical" | "high" | "borderline";

export function getResultSeverity(doc: ResultDocument): ResultSeverity | null {
  if (doc.analytes?.some((a) => a.flag === "Critical")) return "critical";
  if (doc.analytes?.some((a) => a.flag === "High" || a.flag === "Low")) return "high";
  if (doc.analytes?.some((a) => a.flag === "Borderline")) return "borderline";
  if (doc.flagged || doc.needsReview) return "high";
  return null;
}

export function isResultOpened(id: string): boolean {
  const state = loadState();
  return Boolean(state.openedAt[id]);
}

export function getResultQueueNeighbors(
  docs: ResultDocument[],
  currentId: string,
  tab: ResultFilterTab,
  query: string,
  sort: ResultSort,
) {
  const filtered = sortResultDocuments(filterResultDocuments(docs, tab, query), sort);
  const ordered = [
    ...filtered.filter((d) => d.needsReview),
    ...filtered.filter((d) => !d.needsReview),
  ];
  const idx = ordered.findIndex((d) => d.id === currentId);
  return {
    prev: idx > 0 ? ordered[idx - 1] : undefined,
    next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined,
    remainingReview: ordered.filter((d) => d.needsReview && d.id !== currentId).length,
    position: idx >= 0 ? idx + 1 : 0,
    total: ordered.length,
  };
}

export function sortResultDocuments(docs: ResultDocument[], sort: ResultSort) {
  const list = [...docs];
  if (sort === "priority") {
    return list.sort((a, b) => {
      if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
      const sev = (d: ResultDocument) => {
        if (d.analytes?.some((x) => x.flag === "Critical")) return 0;
        if (d.analytes?.some((x) => x.flag === "High" || x.flag === "Low")) return 1;
        if (d.flagged) return 2;
        return 3;
      };
      const sd = sev(a) - sev(b);
      if (sd !== 0) return sd;
      if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }
  if (sort === "patient") {
    return list.sort((a, b) =>
      getResultPatientName(a.patientId).localeCompare(getResultPatientName(b.patientId)),
    );
  }
  if (sort === "title") return list.sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

export function filterResultDocuments(
  docs: ResultDocument[],
  tab: ResultFilterTab,
  query: string,
) {
  let list = docs;
  if (tab === "review") list = list.filter((d) => d.needsReview);
  if (tab === "patient-shared") list = list.filter((d) => d.filterTabs.includes("patient-shared"));
  if (tab === "imaging") list = list.filter((d) => d.filterTabs.includes("imaging"));

  const q = query.trim().toLowerCase();
  if (q) {
    list = list.filter((d) => {
      const patient = getResultPatientName(d.patientId).toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        patient.includes(q) ||
        d.source.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    });
  }
  return list;
}

const AUTO_OPEN_KEY = "medora-doctor-results-auto-open";

export function getResultsAutoOpenPreference(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(AUTO_OPEN_KEY);
  if (stored === null) return false;
  return stored === "true";
}

export function setResultsAutoOpenPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTO_OPEN_KEY, enabled ? "true" : "false");
}
