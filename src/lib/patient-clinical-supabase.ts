import type { PatientMedication } from "@/lib/mock-data";
import { patientMedications, reports } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { LabResultRow } from "@/lib/reports-utils";
import { fetchPhiResource } from "@/lib/supabase/phi-api";

export type SupabasePatientMedicationRow = {
  id: string;
  name: string;
  dosage: string | null;
  medication_time: string | null;
  frequency: string | null;
  reason: string | null;
  clinical_reason: string | null;
  instruction_tag: string | null;
  best_way_to_take: string | null;
  side_effects: string[] | null;
  interactions: string[] | null;
  alternatives: string[] | null;
  pills_remaining: number | null;
  total_pills: number | null;
  prescribed_by: string | null;
  status: string;
  legacy_id: string | null;
};

export type SupabaseLabItemRow = {
  name: string;
  value: string;
  status: LabResultRow["status"];
};

function mapMedicationRow(row: SupabasePatientMedicationRow): PatientMedication {
  return {
    id: row.legacy_id ?? row.id,
    name: row.name,
    dosage: row.dosage ?? "",
    time: row.medication_time ?? "",
    taken: false,
    frequency: row.frequency ?? "Daily",
    reason: row.reason ?? "",
    clinicalReason: row.clinical_reason ?? undefined,
    instructionTag: row.instruction_tag ?? undefined,
    prescribedBy: row.prescribed_by ?? "",
    bestWayToTake: row.best_way_to_take ?? undefined,
    sideEffects: row.side_effects ?? undefined,
    interactions: row.interactions ?? undefined,
    alternatives: row.alternatives ?? undefined,
    pillsRemaining: row.pills_remaining ?? undefined,
    totalPills: row.total_pills ?? undefined,
    status: row.status === "past" ? "past" : "active",
  };
}

export async function fetchPatientMedicationsFromSupabase(): Promise<PatientMedication[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const res = await fetchPhiResource<SupabasePatientMedicationRow[]>("patient_medications");
  if (!res.ok || !res.data?.length) return null;
  return res.data.map(mapMedicationRow);
}

export async function fetchLabFindingsFromSupabase(): Promise<LabResultRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const res = await fetchPhiResource<SupabaseLabItemRow[]>("lab_findings");
  if (!res.ok || !res.data?.length) return null;

  return res.data.map((row) => ({
    name: row.name,
    value: row.value,
    status: row.status,
  }));
}

export async function fetchLabItemsForReportFromSupabase(
  reportLegacyId: string,
): Promise<LabResultRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const res = await fetchPhiResource<SupabaseLabItemRow[]>("lab_items", {
    reportLegacyId,
  });
  if (!res.ok || !res.data?.length) return null;

  return res.data.map((row) => ({
    name: row.name,
    value: row.value,
    status: row.status,
  }));
}

/** Mock fallback data for offline / unauthenticated dev */
export function getMockClinicalSource() {
  return {
    medications: patientMedications,
    reports,
  };
}
