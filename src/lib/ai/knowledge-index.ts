import { PANEL_PATIENTS } from "@/lib/doctor-patients-apk-data";
import { drugClassFor, getDrugMonograph } from "@/lib/doctor-prescription-workflow";
import {
  FINANCE_KPIS,
  IPD_SUMMARY,
  LAB_ORDERS_SNAPSHOT,
  OPD_TODAY,
  OT_UTILIZATION,
  fmtInr,
} from "@/lib/hospital-erp-data";
import type { KnowledgeChunk } from "@/lib/ai/types";
import { loadPatientRegistry } from "@/lib/shared/patient-registry";
import { loadLedgerInvoices } from "@/lib/shared/billing-ledger";
import { listEncounters } from "@/lib/shared/encounters";
import { DRUGS } from "@/lib/pharmacy-desk/mockData";
import { semanticSearch } from "./semantic-search";

let cachedIndex: KnowledgeChunk[] | null = null;

const NAV_CHUNKS: KnowledgeChunk[] = [
  { id: "nav-doctor-queue", category: "nav", title: "Doctor live queue", body: "OPD waiting room and in-consultation patients", keywords: ["queue", "waiting", "opd", "consult"], to: "/doctor/queue" },
  { id: "nav-prescriptions", category: "nav", title: "E-prescribe", body: "Write prescriptions with AI clinical assistant", keywords: ["prescribe", "rx", "medication", "drug"], to: "/doctor/prescriptions" },
  { id: "nav-billing", category: "nav", title: "Billing dashboard", body: "Revenue, invoices, payments, finance KPIs", keywords: ["billing", "invoice", "payment", "revenue", "finance"], to: "/billing" },
  { id: "nav-lab", category: "nav", title: "Laboratory", body: "Lab orders, collection, validation, reports", keywords: ["lab", "blood", "test", "pathology"], to: "/lab" },
  { id: "nav-radiology", category: "nav", title: "Radiology queue", body: "Imaging orders and scan workflow", keywords: ["radiology", "imaging", "xray", "ct", "mri", "scan"], to: "/lab/radiology" },
  { id: "nav-pharmacy", category: "nav", title: "Pharmacy desk", body: "Dispensing, stock, prescriptions", keywords: ["pharmacy", "dispense", "stock", "formulary"], to: "/pharmacy" },
  { id: "nav-beds", category: "nav", title: "IPD beds", body: "Inpatient bed occupancy and admissions", keywords: ["bed", "ipd", "admission", "ward", "inpatient"], to: "/nursing/beds" },
  { id: "nav-ot", category: "nav", title: "Operation theatre", body: "OT utilization and room status", keywords: ["ot", "surgery", "theatre", "operation"], to: "/admin/ot" },
  { id: "nav-command", category: "nav", title: "Hospital command center", body: "Unified ERP overview across departments", keywords: ["command", "admin", "dashboard", "erp", "hospital"], to: "/admin" },
];

export function buildKnowledgeIndex(): KnowledgeChunk[] {
  if (cachedIndex) return cachedIndex;

  const chunks: KnowledgeChunk[] = [...NAV_CHUNKS];

  for (const p of loadPatientRegistry()) {
    chunks.push({
      id: `patient-${p.id}`,
      category: "patient",
      title: p.name,
      body: `MRN ${p.mrn} · ${p.phone}${p.allergies ? ` · Allergies: ${p.allergies}` : ""}`,
      keywords: [p.name, p.mrn, p.phone, p.allergies].filter(Boolean),
      to: `/reception/patients?patient=${encodeURIComponent(p.id)}`,
    });
  }

  for (const p of PANEL_PATIENTS) {
    chunks.push({
      id: `panel-${p.id}`,
      category: "patient",
      title: p.name,
      body: `${p.condition} · ${p.patientRef} · ${p.status}${p.allergyWarning ? ` · ${p.allergyWarning}` : ""}`,
      keywords: [p.name, p.condition, p.patientRef, p.status, p.allergyWarning ?? ""].filter(Boolean),
      to: `/doctor/patients/${p.id}`,
    });
  }

  for (const drug of DRUGS) {
    const mono = getDrugMonograph(drug.id);
    chunks.push({
      id: `drug-${drug.id}`,
      category: "drug",
      title: `${drug.generic_name} ${drug.strength}`,
      body: [
        drugClassFor(drug.id),
        drug.form,
        drug.route,
        mono.whyUsed,
        mono.howToTake,
        mono.warnings ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
      keywords: [
        drug.generic_name,
        ...drug.brand_names,
        drug.strength,
        drug.form,
        drugClassFor(drug.id),
      ],
      to: `/pharmacy/search?q=${encodeURIComponent(drug.generic_name)}`,
    });
  }

  for (const inv of loadLedgerInvoices()) {
    chunks.push({
      id: `inv-${inv.id}`,
      category: "invoice",
      title: inv.id,
      body: `${inv.patientName} · MRN ${inv.mrn} · ₹${inv.total} · ${inv.status}`,
      keywords: [inv.id, inv.patientName, inv.mrn, inv.status],
      to: `/billing/invoices?invoice=${encodeURIComponent(inv.id)}`,
    });
  }

  for (const e of listEncounters()) {
    chunks.push({
      id: `enc-${e.id}`,
      category: "encounter",
      title: e.id,
      body: `${e.patientName} · MRN ${e.mrn} · ${e.type}`,
      keywords: [e.id, e.patientName, e.mrn, e.type],
      to: `/billing/encounters?encounter=${encodeURIComponent(e.id)}`,
    });
  }

  chunks.push({
    id: "erp-finance",
    category: "erp",
    title: "Finance snapshot",
    body: `Revenue today ${fmtInr(FINANCE_KPIS.revenueToday.value)} · Pending ${fmtInr(FINANCE_KPIS.pendingPayments.value)} · Insurance claims ${FINANCE_KPIS.insuranceClaims.value}`,
    keywords: ["revenue", "finance", "billing", "collections", "insurance"],
    to: "/billing",
  });

  chunks.push({
    id: "erp-ipd",
    category: "erp",
    title: "IPD occupancy",
    body: `${IPD_SUMMARY.occupied} of ${IPD_SUMMARY.totalBeds} beds occupied · ${IPD_SUMMARY.occupancyRate}% occupancy`,
    keywords: ["ipd", "bed", "occupancy", "admission", "ward"],
    to: "/nursing/beds",
  });

  chunks.push({
    id: "erp-opd",
    category: "erp",
    title: "OPD today",
    body: `${OPD_TODAY.length} appointments scheduled today across departments`,
    keywords: ["opd", "appointment", "schedule", "outpatient"],
    to: "/reception",
  });

  chunks.push({
    id: "erp-ot",
    category: "erp",
    title: "OT utilization",
    body: `Operation theatre utilization at ${OT_UTILIZATION}%`,
    keywords: ["ot", "surgery", "theatre", "utilization"],
    to: "/admin/ot",
  });

  for (const lab of LAB_ORDERS_SNAPSHOT.slice(0, 8)) {
    chunks.push({
      id: `lab-${lab.id}`,
      category: "clinical",
      title: lab.test,
      body: `${lab.patient} · ${lab.priority} · ${lab.status} · sample ${lab.sample}`,
      keywords: [lab.test, lab.patient, lab.priority, lab.status],
      to: "/lab",
    });
  }

  cachedIndex = chunks;
  return chunks;
}

export function retrieveRagContext(query: string, limit = 5): KnowledgeChunk[] {
  return semanticSearch(query, limit).map((h) => h.chunk);
}

export function ragContextBlock(chunks: KnowledgeChunk[]): string {
  if (!chunks.length) return "";
  return chunks.map((c, i) => `[${i + 1}] ${c.title}: ${c.body}`).join("\n");
}
