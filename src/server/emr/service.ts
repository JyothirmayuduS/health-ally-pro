import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PhiReadAuth } from "@/server/phi-reads";
import { canPerformEmr, loadEmrRoles, type EmrAction } from "./rbac";
import type {
  AllergyEmrInput,
  AttachmentMetaInput,
  DiagnosisInput,
  EmrChartBundle,
  EmrTimelineItem,
  HistoryEmrInput,
  ImmunizationInput,
  ProcedureInput,
  SoapNoteInput,
  VitalsInput,
} from "@/lib/emr/schemas";

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

function adminOrFail() {
  return getSupabaseAdmin();
}

function str(v: unknown) {
  return v == null ? "" : String(v);
}

function iso(v: unknown, fallback = new Date().toISOString()) {
  if (!v) return fallback;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

export async function resolveHospitalPatientId(
  auth: PhiReadAuth,
  suppliedId: string,
): Promise<string | null> {
  const admin = adminOrFail();
  if (!admin) return null;
  let query = admin
    .from("patients")
    .select("id")
    .eq("hospital_id", auth.hospitalId);
  query = /^[0-9a-f-]{36}$/i.test(suppliedId)
    ? query.eq("id", suppliedId)
    : query.or(`mrn.eq.${suppliedId},legacy_id.eq.${suppliedId}`);
  const { data } = await query.maybeSingle();
  return data?.id ? String(data.id) : null;
}

async function patientAccessFlags(auth: PhiReadAuth, patientId: string) {
  const isOwnPatient = Boolean(auth.isPatient && auth.patientId === patientId);
  if (auth.isStaff || isOwnPatient) {
    return { isOwnPatient, hasGrant: false };
  }
  const admin = adminOrFail();
  if (!admin) return { isOwnPatient: false, hasGrant: false };
  const { data } = await admin
    .from("patient_access_grants")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .eq("patient_id", patientId)
    .eq("grantee_profile_id", auth.userId)
    .is("revoked_at", null)
    .maybeSingle();
  return { isOwnPatient: false, hasGrant: Boolean(data?.id) };
}

async function assertAction(
  auth: PhiReadAuth,
  action: EmrAction,
  patientId: string,
): Promise<Result<true>> {
  const roles = await loadEmrRoles(auth);
  const flags = await patientAccessFlags(auth, patientId);
  if (!canPerformEmr(action, auth, roles, flags)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, data: true };
}

async function writeRecordAudit(
  auth: PhiReadAuth,
  patientId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  requestId?: string,
) {
  const admin = adminOrFail();
  if (!admin) return;
  await admin.from("emr_record_audit").insert({
    hospital_id: auth.hospitalId,
    patient_id: patientId,
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    actor_id: auth.userId === "demo-staff" ? null : auth.userId,
    actor_email: auth.email,
    request_id: requestId ?? null,
    metadata,
  });
}

function mapTimeline(
  kind: EmrTimelineItem["kind"],
  rows: Array<Record<string, unknown>>,
  mapper: (row: Record<string, unknown>) => Omit<EmrTimelineItem, "kind"> | null,
): EmrTimelineItem[] {
  return rows
    .map((row) => {
      const mapped = mapper(row);
      if (!mapped) return null;
      return { kind, ...mapped };
    })
    .filter(Boolean) as EmrTimelineItem[];
}

export async function getEmrChart(
  auth: PhiReadAuth,
  suppliedPatientId: string,
): Promise<Result<EmrChartBundle>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "read_chart", patientId);
  if (!gate.ok) return gate;

  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const [
    patientRes,
    encountersRes,
    vitalsRes,
    diagnosesRes,
    proceduresRes,
    allergiesRes,
    immunizationsRes,
    historyRes,
    attachmentsRes,
    noteVersionsRes,
  ] = await Promise.all([
    admin
      .from("patients")
      .select("id, mrn")
      .eq("hospital_id", auth.hospitalId)
      .eq("id", patientId)
      .maybeSingle(),
    admin
      .from("encounters")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .order("started_at", { ascending: false })
      .limit(100),
    admin
      .from("vitals_readings")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("recorded_at", { ascending: false })
      .limit(100),
    admin
      .from("patient_diagnoses")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("recorded_at", { ascending: false })
      .limit(100),
    admin
      .from("patient_procedures")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("patient_allergies")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("patient_immunizations")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("administered_at", { ascending: false })
      .limit(100),
    admin
      .from("patient_history_entries")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("clinical_attachments")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("clinical_note_versions")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const encounters = (encountersRes.data ?? []) as Array<Record<string, unknown>>;
  const vitals = (vitalsRes.data ?? []) as Array<Record<string, unknown>>;
  const diagnoses = (diagnosesRes.data ?? []) as Array<Record<string, unknown>>;
  const procedures = (proceduresRes.data ?? []) as Array<Record<string, unknown>>;
  const allergies = (allergiesRes.data ?? []) as Array<Record<string, unknown>>;
  const immunizations = (immunizationsRes.data ?? []) as Array<
    Record<string, unknown>
  >;
  const history = (historyRes.data ?? []) as Array<Record<string, unknown>>;
  const attachments = (attachmentsRes.data ?? []) as Array<Record<string, unknown>>;
  const noteVersions = (noteVersionsRes.data ?? []) as Array<
    Record<string, unknown>
  >;

  const timeline = [
    ...mapTimeline("encounter", encounters, (row) => ({
      id: `enc-${row.id}`,
      occurredAt: iso(row.started_at ?? row.created_at),
      title: "Encounter",
      summary: str(row.chief_complaint || row.assessment || row.status),
      resourceId: str(row.id),
      encounterId: str(row.id),
      meta: { status: row.status, noteStatus: row.note_status },
    })),
    ...mapTimeline("note", noteVersions, (row) => ({
      id: `note-${row.id}`,
      occurredAt: iso(row.created_at),
      title: `SOAP v${row.version_number}`,
      summary: str(row.change_summary || row.assessment || row.chief_complaint),
      resourceId: str(row.id),
      encounterId: row.encounter_id ? str(row.encounter_id) : null,
      meta: { signedAt: row.signed_at, status: row.note_status },
    })),
    ...mapTimeline("vitals", vitals, (row) => ({
      id: `vitals-${row.id}`,
      occurredAt: iso(row.recorded_at ?? row.created_at),
      title: "Vitals",
      summary: [
        row.bp_systolic && row.bp_diastolic
          ? `BP ${row.bp_systolic}/${row.bp_diastolic}`
          : null,
        row.heart_rate ? `HR ${row.heart_rate}` : null,
        row.temperature_c ? `Temp ${row.temperature_c}°C` : null,
        row.spo2 ? `SpO₂ ${row.spo2}%` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      resourceId: str(row.id),
      encounterId: row.encounter_id ? str(row.encounter_id) : null,
    })),
    ...mapTimeline("diagnosis", diagnoses, (row) => ({
      id: `dx-${row.id}`,
      occurredAt: iso(row.recorded_at ?? row.created_at),
      title: `${row.icd10_code} · ${row.icd10_display}`,
      summary: str(row.clinical_status),
      resourceId: str(row.id),
      encounterId: row.encounter_id ? str(row.encounter_id) : null,
      meta: { primary: row.is_primary },
    })),
    ...mapTimeline("procedure", procedures, (row) => ({
      id: `proc-${row.id}`,
      occurredAt: iso(row.performed_at ?? row.created_at),
      title: str(row.display),
      summary: [row.code, row.status].filter(Boolean).join(" · "),
      resourceId: str(row.id),
      encounterId: row.encounter_id ? str(row.encounter_id) : null,
    })),
    ...mapTimeline("allergy", allergies, (row) => ({
      id: `alg-${row.id}`,
      occurredAt: iso(row.created_at),
      title: `Allergy · ${row.substance}`,
      summary: [row.severity, row.reaction].filter(Boolean).join(" · "),
      resourceId: str(row.id),
    })),
    ...mapTimeline("immunization", immunizations, (row) => ({
      id: `imm-${row.id}`,
      occurredAt: iso(row.administered_at ?? row.created_at),
      title: str(row.vaccine_name),
      summary: [row.status, row.dose_number ? `dose ${row.dose_number}` : null]
        .filter(Boolean)
        .join(" · "),
      resourceId: str(row.id),
      encounterId: row.encounter_id ? str(row.encounter_id) : null,
    })),
    ...mapTimeline("history", history, (row) => ({
      id: `hx-${row.id}`,
      occurredAt: iso(row.created_at),
      title: `${row.category} · ${row.title}`,
      summary: str(row.detail),
      resourceId: str(row.id),
    })),
    ...mapTimeline("attachment", attachments, (row) => ({
      id: `att-${row.id}`,
      occurredAt: iso(row.created_at),
      title: str(row.title),
      summary: str(row.category),
      resourceId: str(row.id),
      encounterId: row.encounter_id ? str(row.encounter_id) : null,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return {
    ok: true,
    data: {
      patientId,
      mrn: patientRes.data?.mrn ? str(patientRes.data.mrn) : null,
      timeline,
      encounters,
      vitals,
      diagnoses,
      procedures,
      allergies,
      immunizations,
      history,
      attachments,
      noteVersions,
    },
  };
}

export async function openEncounter(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: { chiefComplaint?: string; appointmentId?: string | null; doctorStaffId?: string | null },
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "open_encounter", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("encounters")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      doctor_staff_id: input.doctorStaffId ?? null,
      appointment_id: input.appointmentId ?? null,
      chief_complaint: input.chiefComplaint ?? null,
      status: "open",
      note_status: "draft",
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to open encounter" };
  }
  await writeRecordAudit(auth, patientId, "encounters", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function saveSoapNote(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: SoapNoteInput,
): Promise<Result<{ encounter: Record<string, unknown>; version: Record<string, unknown> }>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const action: EmrAction = input.sign ? "sign_note" : "save_soap";
  const gate = await assertAction(auth, action, patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  let encounterId = input.encounterId;
  if (!encounterId) {
    const opened = await openEncounter(auth, patientId, {
      chiefComplaint: input.chiefComplaint,
      appointmentId: input.appointmentId,
    });
    if (!opened.ok) return opened;
    encounterId = str(opened.data.id);
  }

  const { data: encounter, error: encErr } = await admin
    .from("encounters")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("patient_id", patientId)
    .eq("id", encounterId)
    .maybeSingle();
  if (encErr || !encounter) {
    return { ok: false, status: 404, error: "Encounter not found" };
  }

  const nextVersion = Number(encounter.soap_version ?? 0) + 1;
  const signedAt = input.sign ? new Date().toISOString() : null;
  const noteStatus = input.sign ? "signed" : "draft";
  const actorId = auth.userId === "demo-staff" ? null : auth.userId;

  const { data: version, error: verErr } = await admin
    .from("clinical_note_versions")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: encounterId,
      version_number: nextVersion,
      note_status: noteStatus,
      chief_complaint: input.chiefComplaint ?? encounter.chief_complaint,
      subjective: input.subjective ?? encounter.subjective,
      objective: input.objective ?? encounter.objective,
      assessment: input.assessment ?? encounter.assessment,
      plan: input.plan ?? encounter.plan,
      notes: input.notes ?? encounter.notes,
      signed_at: signedAt,
      signed_by: input.sign ? actorId : null,
      authored_by: actorId,
      change_summary: input.changeSummary ?? (input.sign ? "Signed note" : "Draft update"),
    })
    .select("*")
    .single();
  if (verErr || !version) {
    return { ok: false, status: 500, error: verErr?.message || "Failed to version note" };
  }

  const { data: updated, error: updErr } = await admin
    .from("encounters")
    .update({
      chief_complaint: input.chiefComplaint ?? encounter.chief_complaint,
      subjective: input.subjective ?? encounter.subjective,
      objective: input.objective ?? encounter.objective,
      assessment: input.assessment ?? encounter.assessment,
      plan: input.plan ?? encounter.plan,
      notes: input.notes ?? encounter.notes,
      soap_version: nextVersion,
      note_status: noteStatus,
      soap_signed_at: signedAt,
      soap_signed_by: input.sign ? actorId : encounter.soap_signed_by,
      updated_at: new Date().toISOString(),
      status: input.sign ? "closed" : encounter.status ?? "open",
      ended_at: input.sign ? new Date().toISOString() : encounter.ended_at,
    })
    .eq("hospital_id", auth.hospitalId)
    .eq("id", encounterId)
    .select("*")
    .single();
  if (updErr || !updated) {
    return { ok: false, status: 500, error: updErr?.message || "Failed to update encounter" };
  }

  await writeRecordAudit(
    auth,
    patientId,
    "clinical_note_versions",
    str(version.id),
    input.sign ? "sign" : "create",
    { encounter_id: encounterId, version: nextVersion },
  );

  return {
    ok: true,
    data: {
      encounter: updated as Record<string, unknown>,
      version: version as Record<string, unknown>,
    },
  };
}

export async function recordVitals(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: VitalsInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "record_vitals", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  let bmi: number | null = null;
  if (input.weightKg && input.heightCm && input.heightCm > 0) {
    const m = input.heightCm / 100;
    bmi = Math.round((input.weightKg / (m * m)) * 10) / 10;
  }

  const payload = {
    bp_systolic: input.bpSystolic ?? null,
    bp_diastolic: input.bpDiastolic ?? null,
    heart_rate: input.heartRate ?? null,
    respiratory_rate: input.respiratoryRate ?? null,
    temperature_c: input.temperatureC ?? null,
    spo2: input.spo2 ?? null,
    weight_kg: input.weightKg ?? null,
    height_cm: input.heightCm ?? null,
    pain_score: input.painScore ?? null,
    notes: input.notes ?? null,
  };

  const { data, error } = await admin
    .from("vitals_readings")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      recorded_at: input.recordedAt ?? new Date().toISOString(),
      legacy_id: input.legacyId ?? null,
      ...payload,
      bmi,
      recorded_by: auth.userId === "demo-staff" ? null : auth.userId,
      payload,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to record vitals" };
  }
  await writeRecordAudit(auth, patientId, "vitals_readings", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function addDiagnosis(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: DiagnosisInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "manage_diagnoses", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("patient_diagnoses")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      icd10_code: input.icd10Code.toUpperCase(),
      icd10_display: input.icd10Display,
      clinical_status: input.clinicalStatus,
      verification_status: input.verificationStatus,
      onset_date: input.onsetDate ?? null,
      resolved_date: input.resolvedDate ?? null,
      is_primary: input.isPrimary,
      notes: input.notes ?? null,
      recorded_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to add diagnosis" };
  }
  await writeRecordAudit(auth, patientId, "patient_diagnoses", str(data.id), "create", {
    icd10: input.icd10Code,
  });
  return { ok: true, data: data as Record<string, unknown> };
}

export async function addProcedure(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: ProcedureInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "manage_procedures", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("patient_procedures")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      code: input.code ?? null,
      display: input.display,
      status: input.status,
      performed_at: input.performedAt ?? new Date().toISOString(),
      performer_name: input.performerName ?? null,
      body_site: input.bodySite ?? null,
      notes: input.notes ?? null,
      recorded_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to add procedure" };
  }
  await writeRecordAudit(auth, patientId, "patient_procedures", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function addEmrAllergy(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: AllergyEmrInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "manage_allergies", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("patient_allergies")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      substance: input.substance,
      reaction: input.reaction ?? null,
      severity: input.severity,
      status: input.status,
      onset_date: input.onsetDate ?? null,
      notes: input.notes ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to add allergy" };
  }
  await writeRecordAudit(auth, patientId, "patient_allergies", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function addImmunization(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: ImmunizationInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "manage_immunizations", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("patient_immunizations")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      vaccine_code: input.vaccineCode,
      vaccine_name: input.vaccineName,
      dose_number: input.doseNumber ?? null,
      status: input.status,
      administered_at: input.administeredAt ?? new Date().toISOString(),
      lot_number: input.lotNumber ?? null,
      site: input.site ?? null,
      route: input.route ?? null,
      manufacturer: input.manufacturer ?? null,
      aefi_notes: input.aefiNotes ?? null,
      deferral_reason: input.deferralReason ?? null,
      legacy_id: input.legacyId ?? null,
      recorded_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to add immunization" };
  }
  await writeRecordAudit(auth, patientId, "patient_immunizations", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function addEmrHistory(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: HistoryEmrInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "manage_history", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("patient_history_entries")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      category: input.category,
      title: input.title,
      detail: input.detail ?? null,
      occurred_on: input.occurredOn ?? null,
      status: input.status,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to add history" };
  }
  await writeRecordAudit(auth, patientId, "patient_history_entries", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function registerClinicalAttachment(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  input: AttachmentMetaInput,
): Promise<Result<Record<string, unknown>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "manage_attachments", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const expectedPrefix = `${auth.hospitalId}/${patientId}/`;
  if (!input.storagePath.startsWith(expectedPrefix)) {
    return { ok: false, status: 400, error: "Invalid storage path" };
  }

  const { data, error } = await admin
    .from("clinical_attachments")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      note_version_id: input.noteVersionId ?? null,
      title: input.title,
      category: input.category,
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      storage_path: input.storagePath,
      sha256: input.sha256 ?? null,
      uploaded_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to register attachment" };
  }
  await writeRecordAudit(auth, patientId, "clinical_attachments", str(data.id), "create");
  return { ok: true, data: data as Record<string, unknown> };
}

export async function createClinicalAttachmentUrl(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  attachmentId: string,
): Promise<Result<{ signedUrl: string }>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "read_chart", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data: row } = await admin
    .from("clinical_attachments")
    .select("storage_path")
    .eq("hospital_id", auth.hospitalId)
    .eq("patient_id", patientId)
    .eq("id", attachmentId)
    .is("archived_at", null)
    .maybeSingle();
  if (!row?.storage_path) return { ok: false, status: 404, error: "Attachment not found" };

  const { data, error } = await admin.storage
    .from("clinical-attachments")
    .createSignedUrl(String(row.storage_path), 120);
  if (error || !data?.signedUrl) {
    return { ok: false, status: 500, error: error?.message || "Signed URL failed" };
  }
  await writeRecordAudit(auth, patientId, "clinical_attachments", attachmentId, "download");
  return { ok: true, data: { signedUrl: data.signedUrl } };
}

export async function listNoteVersions(
  auth: PhiReadAuth,
  suppliedPatientId: string,
  encounterId?: string,
): Promise<Result<Array<Record<string, unknown>>>> {
  const patientId = await resolveHospitalPatientId(auth, suppliedPatientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const gate = await assertAction(auth, "read_chart", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  let query = admin
    .from("clinical_note_versions")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("patient_id", patientId)
    .order("version_number", { ascending: false });
  if (encounterId) query = query.eq("encounter_id", encounterId);
  const { data, error } = await query.limit(200);
  if (error) return { ok: false, status: 500, error: error.message };
  return { ok: true, data: (data ?? []) as Array<Record<string, unknown>> };
}
