import type { PatientMedication } from "@/lib/mock-data";
import { patientMedications, reports } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { LabResultRow } from "@/lib/reports-utils";

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

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  if (!patient) return null;

  const { data, error } = await supabase
    .from("patient_medications")
    .select(
      "id, name, dosage, medication_time, frequency, reason, clinical_reason, instruction_tag, best_way_to_take, side_effects, interactions, alternatives, pills_remaining, total_pills, prescribed_by, status, legacy_id",
    )
    .eq("patient_id", patient.id)
    .order("status")
    .order("name");

  if (error || !data?.length) return null;
  return (data as SupabasePatientMedicationRow[]).map(mapMedicationRow);
}

export async function fetchLabFindingsFromSupabase(): Promise<LabResultRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  if (!patient) return null;

  const { data: labReports, error: reportsError } = await supabase
    .from("lab_results")
    .select("id")
    .eq("patient_id", patient.id)
    .eq("report_type", "Lab");

  if (reportsError || !labReports?.length) return null;

  const reportIds = labReports.map((r) => r.id as string);

  const { data, error } = await supabase
    .from("lab_result_items")
    .select("name, value, status")
    .in("lab_result_id", reportIds);

  if (error || !data?.length) return null;

  return data.map((row) => ({
    name: row.name as string,
    value: row.value as string,
    status: row.status as LabResultRow["status"],
  }));
}

export async function fetchLabItemsForReportFromSupabase(
  reportLegacyId: string,
): Promise<LabResultRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  if (!patient) return null;

  const { data: report } = await supabase
    .from("lab_results")
    .select("id")
    .eq("patient_id", patient.id)
    .eq("legacy_id", reportLegacyId)
    .maybeSingle();

  if (!report) return null;

  const { data, error } = await supabase
    .from("lab_result_items")
    .select("name, value, status, sort_order")
    .eq("lab_result_id", report.id)
    .order("sort_order");

  if (error || !data?.length) return null;

  return data.map((row) => ({
    name: row.name as string,
    value: row.value as string,
    status: row.status as LabResultRow["status"],
  }));
}

/** Mock fallback data for offline / unauthenticated dev */
export function getMockClinicalSource() {
  return {
    medications: patientMedications,
    reports,
  };
}
