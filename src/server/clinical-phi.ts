/**
 * Clinical entity persistence via Postgres (service_role) + JSONB payload for rich client shapes.
 */
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PhiReadAuth } from "@/server/phi-reads";

type UpsertRow = {
  legacy_id: string;
  payload: Record<string, unknown>;
  [key: string]: unknown;
};

async function listPayloadTable(
  auth: PhiReadAuth,
  table: string,
  orderCol = "updated_at",
) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  const { data, error } = await admin
    .from(table)
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .order(orderCol, { ascending: false })
    .limit(500);
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

async function resolvePatientIdForPayload(
  auth: PhiReadAuth,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const mrn = String(payload.mrn ?? payload.patientId ?? "").trim();
  if (mrn) {
    const { data } = await admin
      .from("patients")
      .select("id")
      .eq("hospital_id", auth.hospitalId)
      .eq("mrn", mrn)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  const { data: fallback } = await admin
    .from("patients")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .limit(1)
    .maybeSingle();
  return (fallback?.id as string) ?? null;
}

async function resolveInvoiceIdForPayload(
  auth: PhiReadAuth,
  invoiceLegacyId: string,
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("invoices")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .eq("legacy_id", invoiceLegacyId)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

async function upsertPayloadRowsAsync(
  auth: PhiReadAuth,
  table: string,
  rows: UpsertRow[],
  extra?: (row: UpsertRow) => Promise<Record<string, unknown>> | Record<string, unknown>,
) {
  const admin = getSupabaseAdmin();
  if (!admin || rows.length === 0) return { error: "admin_unavailable", data: [] as unknown[] };
  const payload = [];
  for (const r of rows) {
    const extras = extra ? await extra(r) : {};
    payload.push({
      hospital_id: auth.hospitalId,
      legacy_id: r.legacy_id,
      payload: r.payload ?? {},
      updated_at: new Date().toISOString(),
      ...extras,
    });
  }
  const { data, error } = await admin
    .from(table)
    .upsert(payload, { onConflict: "hospital_id,legacy_id" })
    .select();
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function listEncountersForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "encounters");
}

export async function listInvoicesForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "invoices");
}

export async function listPaymentsForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "payments");
}

export async function listLabOrdersForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "lab_orders", "ordered_at");
}

export async function listPrescriptionsForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "prescriptions");
}

export async function listNotificationsForAuth(auth: PhiReadAuth) {
  const admin = getSupabaseAdmin();
  if (!admin) return { error: "admin_unavailable", data: [] as unknown[] };
  let q = admin
    .from("notifications")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (auth.isPatient && !auth.isStaff) {
    q = q.eq("profile_id", auth.userId);
  }
  const { data, error } = await q;
  if (error) return { error: error.message, data: [] as unknown[] };
  return { error: null as string | null, data: data ?? [] };
}

export async function listBranchesForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "branches");
}

export async function listVitalsForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "vitals_readings", "recorded_at");
}

export async function listBedsForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "beds");
}

export async function listAdmissionsForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "admissions");
}

export async function listOtRoomsForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "ot_rooms");
}

export async function listOtCasesForAuth(auth: PhiReadAuth) {
  return listPayloadTable(auth, "ot_cases");
}

export async function upsertEncounters(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "encounters", rows, async (r) => ({
    patient_id: await resolvePatientIdForPayload(auth, r.payload),
    status: String(r.payload?.status ?? "open"),
    chief_complaint: String(r.payload?.chiefComplaint ?? r.payload?.chief_complaint ?? ""),
    started_at: r.payload?.createdAt ?? new Date().toISOString(),
  }));
}

export async function upsertInvoices(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "invoices", rows, async (r) => {
    const patientId = await resolvePatientIdForPayload(auth, r.payload);
    return {
      patient_id: patientId,
      status: mapInvoiceStatus(String(r.payload?.status ?? "draft")),
      subtotal: Number(r.payload?.subtotal ?? 0),
      tax: Number(r.payload?.tax ?? 0),
      total: Number(r.payload?.total ?? 0),
      invoice_number: String(r.payload?.id ?? r.legacy_id),
    };
  });
}

export async function upsertPayments(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "payments", rows, async (r) => {
    const invoiceLegacy = String(r.payload?.invoiceId ?? "");
    const invoiceId = invoiceLegacy ? await resolveInvoiceIdForPayload(auth, invoiceLegacy) : null;
    return {
      invoice_id: invoiceId,
      amount: Number(r.payload?.amount ?? 0),
      method: "cash",
      reference: String(r.payload?.id ?? r.legacy_id),
      paid_at: r.payload?.at ?? new Date().toISOString(),
    };
  });
}

export async function upsertLabOrders(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "lab_orders", rows, (r) => ({
    test_name: String(r.payload?.testName ?? r.payload?.test_name ?? "Lab panel"),
    status: "ordered",
    priority: String(r.payload?.priority ?? "routine"),
  }));
}

export async function upsertPrescriptions(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "prescriptions", rows, async (r) => ({
    patient_id: await resolvePatientIdForPayload(auth, r.payload),
    medication_name: String(r.payload?.medicationName ?? r.payload?.name ?? "Medication"),
    dosage: String(r.payload?.dosage ?? ""),
    frequency: String(r.payload?.frequency ?? ""),
  }));
}

export async function upsertVitals(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "vitals_readings", rows, (r) => ({
    recorded_at: r.payload?.recordedAt ?? new Date().toISOString(),
  }));
}

export async function upsertBeds(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "beds", rows, (r) => ({
    ward: String(r.payload?.ward ?? ""),
    name: String(r.payload?.label ?? r.payload?.id ?? r.legacy_id),
  }));
}

export async function upsertAdmissions(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "admissions", rows, (r) => ({
    status: String(r.payload?.status ?? "active"),
  }));
}

export async function upsertOtRooms(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "ot_rooms", rows, (r) => ({
    name: String(r.payload?.name ?? r.legacy_id),
  }));
}

export async function upsertOtCases(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "ot_cases", rows, (r) => ({
    status: String(r.payload?.status ?? "scheduled"),
    scheduled_at: r.payload?.scheduledAt ?? null,
  }));
}

export async function upsertBranches(auth: PhiReadAuth, rows: UpsertRow[]) {
  return upsertPayloadRowsAsync(auth, "branches", rows, (r) => ({
    name: String(r.payload?.name ?? r.legacy_id),
    code: String(r.payload?.id ?? r.legacy_id),
  }));
}

function mapInvoiceStatus(s: string): string {
  if (s === "paid") return "paid";
  if (s === "partial" || s === "partial-refund") return "partial";
  if (s === "refunded") return "cancelled";
  return "draft";
}

export type ClinicalResource =
  | "encounters"
  | "invoices"
  | "payments"
  | "lab_orders"
  | "prescriptions"
  | "notifications"
  | "branches"
  | "vitals_readings"
  | "beds"
  | "admissions"
  | "ot_rooms"
  | "ot_cases";

export async function listClinicalResource(auth: PhiReadAuth, resource: ClinicalResource) {
  switch (resource) {
    case "encounters":
      return listEncountersForAuth(auth);
    case "invoices":
      return listInvoicesForAuth(auth);
    case "payments":
      return listPaymentsForAuth(auth);
    case "lab_orders":
      return listLabOrdersForAuth(auth);
    case "prescriptions":
      return listPrescriptionsForAuth(auth);
    case "notifications":
      return listNotificationsForAuth(auth);
    case "branches":
      return listBranchesForAuth(auth);
    case "vitals_readings":
      return listVitalsForAuth(auth);
    case "beds":
      return listBedsForAuth(auth);
    case "admissions":
      return listAdmissionsForAuth(auth);
    case "ot_rooms":
      return listOtRoomsForAuth(auth);
    case "ot_cases":
      return listOtCasesForAuth(auth);
    default:
      return { error: "unknown_resource", data: [] as unknown[] };
  }
}

export async function upsertClinicalResource(
  auth: PhiReadAuth,
  resource: ClinicalResource,
  rows: UpsertRow[],
) {
  switch (resource) {
    case "encounters":
      return upsertEncounters(auth, rows);
    case "invoices":
      return upsertInvoices(auth, rows);
    case "payments":
      return upsertPayments(auth, rows);
    case "lab_orders":
      return upsertLabOrders(auth, rows);
    case "prescriptions":
      return upsertPrescriptions(auth, rows);
    case "branches":
      return upsertBranches(auth, rows);
    case "vitals_readings":
      return upsertVitals(auth, rows);
    case "beds":
      return upsertBeds(auth, rows);
    case "admissions":
      return upsertAdmissions(auth, rows);
    case "ot_rooms":
      return upsertOtRooms(auth, rows);
    case "ot_cases":
      return upsertOtCases(auth, rows);
    default:
      return { error: "unknown_resource", data: [] as unknown[] };
  }
}
