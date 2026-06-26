import { loadPatientRegistry } from "./patient-registry";
import { loadLedgerInvoices } from "./billing-ledger";
import { listEncounters } from "./encounters";
import { semanticSearchToLegacy } from "@/lib/ai/semantic-search";

export type SearchResult = {
  type: "patient" | "invoice" | "encounter" | "drug" | "nav" | "clinical" | "erp";
  id: string;
  label: string;
  sub: string;
  to: string;
  aiEnhanced?: boolean;
  score?: number;
};

function keywordSearch(query: string, limit: number): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: SearchResult[] = [];

  for (const p of loadPatientRegistry()) {
    if (
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    ) {
      out.push({
        type: "patient",
        id: p.id,
        label: p.name,
        sub: p.mrn,
        to: `/reception/patients?patient=${encodeURIComponent(p.id)}`,
      });
    }
  }

  for (const inv of loadLedgerInvoices()) {
    if (
      inv.id.toLowerCase().includes(q) ||
      inv.patientName.toLowerCase().includes(q) ||
      inv.mrn.toLowerCase().includes(q)
    ) {
      out.push({
        type: "invoice",
        id: inv.id,
        label: inv.id,
        sub: `${inv.patientName} · ₹${inv.total}`,
        to: `/billing/invoices?invoice=${encodeURIComponent(inv.id)}`,
      });
    }
  }

  for (const e of listEncounters()) {
    if (
      e.id.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q) ||
      e.mrn.toLowerCase().includes(q)
    ) {
      out.push({
        type: "encounter",
        id: e.id,
        label: e.id,
        sub: e.patientName,
        to: `/billing/encounters?encounter=${encodeURIComponent(e.id)}`,
      });
    }
  }

  return out.slice(0, limit);
}

function mergeResults(keyword: SearchResult[], semantic: SearchResult[], limit: number): SearchResult[] {
  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  for (const r of [...semantic, ...keyword]) {
    const key = `${r.to}-${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
    if (merged.length >= limit) break;
  }

  return merged;
}

export function globalSearch(query: string, limit = 12): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const semantic = semanticSearchToLegacy(q, limit).map((r) => ({
    type: r.type,
    id: r.id,
    label: r.label,
    sub: r.sub,
    to: r.to,
    aiEnhanced: r.aiEnhanced,
    score: r.score,
  }));

  const keyword = keywordSearch(q, limit);
  return mergeResults(keyword, semantic, limit);
}

import { getSharedPatient } from "./patients";

export function patientLabel(id: string) {
  return getSharedPatient(id)?.name ?? id;
}
