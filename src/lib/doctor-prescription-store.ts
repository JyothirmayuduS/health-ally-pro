import { apkDoctor } from "@/lib/doctor-apk-data";
import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import type { PrescriptionDraft, RxFrequency } from "@/lib/doctor-prescription-workflow";
import {
  createLineFromDrug,
  defaultPrescriptionDraft,
} from "@/lib/doctor-prescription-workflow";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";

export type DoctorRxDispatchTarget = "pharmacy" | "patient" | "both";
export type DoctorSentRxStatus = "sent" | "cancelled" | "amended";

export type DoctorSentRxRecord = {
  id: string;
  rx_number: string;
  panelPatientId: string;
  patientName: string;
  patientRef: string;
  encounterId?: string;
  draft: PrescriptionDraft;
  target: DoctorRxDispatchTarget;
  pharmacyName?: string;
  sent_at: string;
  status: DoctorSentRxStatus;
  cancelled_at?: string;
  cancel_reason?: string;
  amended_from_rx_number?: string;
  doctor_name: string;
  doctor_specialty: string;
};

export type DoctorRxTemplateLine = {
  drug_id: string;
  frequency: RxFrequency;
  durationDays: number;
};

export type DoctorRxTemplate = {
  id: string;
  label: string;
  diagnosis: string;
  diagnosisIcd?: string;
  lines: DoctorRxTemplateLine[];
  createdAt: string;
};

const SENT_KEY = "medora-doctor-sent-rx-v1";
const TEMPLATE_KEY = "medora-doctor-rx-templates-v1";
export const DOCTOR_RX_STORE_EVENT = "medora-doctor-rx-store-updated";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DOCTOR_RX_STORE_EVENT));
  }
}

function loadSent(): DoctorSentRxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return raw ? (JSON.parse(raw) as DoctorSentRxRecord[]) : [];
  } catch {
    return [];
  }
}

function saveSent(list: DoctorSentRxRecord[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SENT_KEY, JSON.stringify(list));
    emit();
  }
}

function loadTemplates(): DoctorRxTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    return raw ? (JSON.parse(raw) as DoctorRxTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveTemplates(list: DoctorRxTemplate[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(list));
    emit();
  }
}

function seedSentIfEmpty() {
  if (loadSent().length > 0) return;
  const sneha = PANEL_PATIENTS.find((p) => p.id === "p1");
  if (!sneha) return;

  const draft1: PrescriptionDraft = {
    ...defaultPrescriptionDraft("p1"),
    diagnosis: "Persistent asthma — maintenance",
    diagnosisIcd: "ICD-10 J45.9",
    lines: [
      createLineFromDrug("drug-sal100", { frequency: "SOS", durationDays: 90 }),
    ],
    patientInstructions: "Use inhaler for wheeze. Seek urgent care if no relief.",
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  };

  const draft2: PrescriptionDraft = {
    ...defaultPrescriptionDraft("p1"),
    diagnosis: "Acute asthma exacerbation",
    diagnosisIcd: "ICD-10 J45.9",
    lines: [
      createLineFromDrug("drug-pred5", { frequency: "OD", durationDays: 5 }),
      createLineFromDrug("drug-par500", { frequency: "QID", durationDays: 5 }),
    ],
    patientInstructions: "Complete steroid course. Return if worsening.",
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  };

  const seeds: DoctorSentRxRecord[] = [
    {
      id: "doc-rx-seed-1",
      rx_number: "RX-2025-498",
      panelPatientId: "p1",
      patientName: sneha.name,
      patientRef: sneha.patientRef,
      draft: draft1,
      target: "both",
      pharmacyName: "Oak Haven Central Pharmacy",
      sent_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      status: "sent",
      doctor_name: apkDoctor.name,
      doctor_specialty: apkDoctor.specialty,
    },
    {
      id: "doc-rx-seed-2",
      rx_number: "RX-2025-472",
      panelPatientId: "p1",
      patientName: sneha.name,
      patientRef: sneha.patientRef,
      draft: draft2,
      target: "both",
      pharmacyName: "Oak Haven Central Pharmacy",
      sent_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      status: "sent",
      doctor_name: apkDoctor.name,
      doctor_specialty: apkDoctor.specialty,
    },
  ];
  saveSent(seeds);
}

export function listDoctorSentRx(patientId?: string): DoctorSentRxRecord[] {
  seedSentIfEmpty();
  const list = loadSent().sort((a, b) => b.sent_at.localeCompare(a.sent_at));
  if (!patientId) return list;
  return list.filter((r) => r.panelPatientId === patientId);
}

export function getDoctorSentRx(rxNumber: string): DoctorSentRxRecord | undefined {
  seedSentIfEmpty();
  return loadSent().find((r) => r.rx_number === rxNumber);
}

export function recordDoctorSentRx(input: Omit<DoctorSentRxRecord, "id" | "status">): DoctorSentRxRecord {
  const record: DoctorSentRxRecord = {
    ...input,
    id: `doc-rx-${Date.now()}`,
    status: "sent",
  };
  const list = loadSent();
  list.unshift(record);
  saveSent(list);
  return record;
}

export function cancelDoctorSentRx(rxNumber: string, reason?: string): DoctorSentRxRecord | undefined {
  const list = loadSent();
  const idx = list.findIndex((r) => r.rx_number === rxNumber && r.status === "sent");
  if (idx < 0) return undefined;
  list[idx] = {
    ...list[idx],
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
    cancel_reason: reason?.trim() || "Cancelled by prescriber",
  };
  saveSent(list);
  if (typeof window !== "undefined") {
    void import("@/lib/shared/rx-lifecycle-bridge").then(({ propagateRxCancellation }) =>
      propagateRxCancellation(list[idx]!, reason),
    );
  }
  return list[idx];
}

export function markDoctorSentRxAmended(rxNumber: string): DoctorSentRxRecord | undefined {
  const list = loadSent();
  const idx = list.findIndex((r) => r.rx_number === rxNumber && r.status === "sent");
  if (idx < 0) return undefined;
  list[idx] = { ...list[idx], status: "amended" };
  saveSent(list);
  if (typeof window !== "undefined") {
    void import("@/lib/shared/rx-lifecycle-bridge").then(({ propagateRxAmendment }) =>
      propagateRxAmendment(list[idx]!),
    );
  }
  return list[idx];
}

export function listDoctorTemplates(): DoctorRxTemplate[] {
  return loadTemplates().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveDoctorTemplate(input: {
  label: string;
  diagnosis: string;
  diagnosisIcd?: string;
  lines: DoctorRxTemplateLine[];
}): DoctorRxTemplate {
  const tpl: DoctorRxTemplate = {
    id: `tpl-${Date.now()}`,
    label: input.label.trim(),
    diagnosis: input.diagnosis.trim(),
    diagnosisIcd: input.diagnosisIcd,
    lines: input.lines,
    createdAt: new Date().toISOString(),
  };
  const list = loadTemplates();
  list.unshift(tpl);
  saveTemplates(list);
  return tpl;
}

export function deleteDoctorTemplate(id: string): void {
  saveTemplates(loadTemplates().filter((t) => t.id !== id));
}

export function medicationNamesFromDraft(draft: PrescriptionDraft): string[] {
  return draft.lines.map((line) => {
    const drug = DRUGS.find((d) => d.id === line.drug_id);
    return drug ? `${drug.generic_name} ${drug.strength}` : line.drug_id;
  });
}
