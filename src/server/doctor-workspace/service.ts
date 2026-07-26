import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PhiReadAuth } from "@/server/phi-reads";
import { openEncounter } from "@/server/emr/service";
import { bookAppointment } from "@/server/opd/service";
import {
  canPerformDoctorWorkspace,
  loadDoctorWorkspaceRoles,
  type DoctorWorkspaceAction,
} from "./rbac";
import type {
  ClinicalTaskInput,
  ConsultationBundle,
  DoctorWorkspaceBoard,
  FollowUpInput,
  LabOrderInput,
  PrescriptionOrderInput,
  RadiologyOrderInput,
  ReferralInput,
  StartConsultationInput,
} from "@/lib/doctor-workspace/schemas";

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

function adminOrFail() {
  return getSupabaseAdmin();
}

function str(v: unknown) {
  return v == null ? "" : String(v);
}

async function assertAction(
  auth: PhiReadAuth,
  action: DoctorWorkspaceAction,
): Promise<Result<true>> {
  const roles = await loadDoctorWorkspaceRoles(auth);
  if (!canPerformDoctorWorkspace(action, auth, roles)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, data: true };
}

async function resolvePatientId(
  hospitalId: string,
  supplied: string,
): Promise<string | null> {
  const admin = adminOrFail();
  if (!admin) return null;
  let query = admin.from("patients").select("id").eq("hospital_id", hospitalId);
  query = /^[0-9a-f-]{36}$/i.test(supplied)
    ? query.eq("id", supplied)
    : query.or(`mrn.eq.${supplied},legacy_id.eq.${supplied}`);
  const { data } = await query.maybeSingle();
  return data?.id ? String(data.id) : null;
}

async function resolveDoctorStaffId(
  auth: PhiReadAuth,
  supplied?: string | null,
): Promise<string | null> {
  if (supplied && /^[0-9a-f-]{36}$/i.test(supplied)) return supplied;
  const admin = adminOrFail();
  if (!admin || auth.userId === "demo-staff") return null;
  const { data } = await admin
    .from("staff_profiles")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .eq("auth_user_id", auth.userId)
    .eq("is_active", true)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDoctorBoard(
  auth: PhiReadAuth,
  opts?: { date?: string; doctorStaffId?: string },
): Promise<Result<DoctorWorkspaceBoard>> {
  const gate = await assertAction(auth, "read_board");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const date = opts?.date || todayIsoDate();
  const doctorStaffId = await resolveDoctorStaffId(auth, opts?.doctorStaffId);

  let apptQuery = admin
    .from("appointments")
    .select("*, patients(mrn, full_name, legacy_id)")
    .eq("hospital_id", auth.hospitalId)
    .gte("scheduled_at", `${date}T00:00:00.000Z`)
    .lte("scheduled_at", `${date}T23:59:59.999Z`)
    .order("scheduled_at", { ascending: true })
    .limit(100);
  if (doctorStaffId) apptQuery = apptQuery.eq("doctor_staff_id", doctorStaffId);

  let queueQuery = admin
    .from("queue_entries")
    .select("*, patients(mrn, full_name, legacy_id)")
    .eq("hospital_id", auth.hospitalId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (doctorStaffId) queueQuery = queueQuery.eq("doctor_staff_id", doctorStaffId);

  let taskQuery = admin
    .from("clinical_tasks")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("status", "open")
    .is("archived_at", null)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(50);
  if (doctorStaffId) taskQuery = taskQuery.eq("doctor_staff_id", doctorStaffId);

  let activeQuery = admin
    .from("doctor_consultations")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1);
  if (doctorStaffId) activeQuery = activeQuery.eq("doctor_staff_id", doctorStaffId);

  const [appts, queue, tasks, active] = await Promise.all([
    apptQuery,
    queueQuery,
    taskQuery,
    activeQuery,
  ]);

  if (appts.error) return { ok: false, status: 500, error: appts.error.message };
  if (queue.error) return { ok: false, status: 500, error: queue.error.message };
  if (tasks.error) return { ok: false, status: 500, error: tasks.error.message };

  return {
    ok: true,
    data: {
      date,
      appointments: (appts.data ?? []) as Array<Record<string, unknown>>,
      queue: (queue.data ?? []) as Array<Record<string, unknown>>,
      tasks: (tasks.data ?? []) as Array<Record<string, unknown>>,
      activeConsultation: (active.data?.[0] as Record<string, unknown>) ?? null,
    },
  };
}

export async function startConsultation(
  auth: PhiReadAuth,
  input: StartConsultationInput,
): Promise<Result<ConsultationBundle>> {
  const gate = await assertAction(auth, "start_consultation");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const patientId = await resolvePatientId(auth.hospitalId, input.patientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const doctorStaffId = await resolveDoctorStaffId(auth, input.doctorStaffId);

  // Close any other active consult for this doctor (fast single-patient flow)
  if (doctorStaffId) {
    await admin
      .from("doctor_consultations")
      .update({
        status: "interrupted",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("hospital_id", auth.hospitalId)
      .eq("doctor_staff_id", doctorStaffId)
      .eq("status", "active");
  }

  const opened = await openEncounter(auth, patientId, {
    chiefComplaint: input.chiefComplaint,
    appointmentId: input.appointmentId,
    doctorStaffId,
  });
  if (!opened.ok) return opened;
  const encounterId = str(opened.data.id);

  const { data: consult, error } = await admin
    .from("doctor_consultations")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      doctor_staff_id: doctorStaffId,
      appointment_id: input.appointmentId ?? null,
      queue_entry_id: input.queueEntryId ?? null,
      encounter_id: encounterId,
      status: "active",
      chief_complaint: input.chiefComplaint ?? null,
      room_label: input.roomLabel ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !consult) {
    return { ok: false, status: 500, error: error?.message || "Failed to start consultation" };
  }

  if (input.queueEntryId) {
    await admin
      .from("queue_entries")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("hospital_id", auth.hospitalId)
      .eq("id", input.queueEntryId);
  }

  return getConsultationBundle(auth, str(consult.id));
}

export async function completeConsultation(
  auth: PhiReadAuth,
  consultationId: string,
  notes?: string,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "complete_consultation");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data: existing } = await admin
    .from("doctor_consultations")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("id", consultationId)
    .maybeSingle();
  if (!existing) return { ok: false, status: 404, error: "Consultation not found" };

  const { data, error } = await admin
    .from("doctor_consultations")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      notes: notes ?? existing.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("hospital_id", auth.hospitalId)
    .eq("id", consultationId)
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to complete" };
  }

  if (existing.queue_entry_id) {
    await admin
      .from("queue_entries")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("hospital_id", auth.hospitalId)
      .eq("id", existing.queue_entry_id);
  }

  return { ok: true, data: data as Record<string, unknown> };
}

export async function getConsultationBundle(
  auth: PhiReadAuth,
  consultationId: string,
): Promise<Result<ConsultationBundle>> {
  const gate = await assertAction(auth, "read_board");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data: consult } = await admin
    .from("doctor_consultations")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("id", consultationId)
    .maybeSingle();
  if (!consult) return { ok: false, status: 404, error: "Consultation not found" };

  const patientId = str(consult.patient_id);
  const [rx, labs, rad, refs, tasks] = await Promise.all([
    admin
      .from("prescriptions")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("consultation_id", consultationId)
      .is("archived_at", null),
    admin
      .from("lab_orders")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("consultation_id", consultationId)
      .is("archived_at", null),
    admin
      .from("radiology_orders")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("consultation_id", consultationId)
      .is("archived_at", null),
    admin
      .from("clinical_referrals")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("consultation_id", consultationId)
      .is("archived_at", null),
    admin
      .from("clinical_tasks")
      .select("*")
      .eq("hospital_id", auth.hospitalId)
      .eq("consultation_id", consultationId)
      .is("archived_at", null),
  ]);

  return {
    ok: true,
    data: {
      consultation: consult as Record<string, unknown>,
      patientId,
      encounterId: consult.encounter_id ? str(consult.encounter_id) : null,
      prescriptions: (rx.data ?? []) as Array<Record<string, unknown>>,
      labOrders: (labs.data ?? []) as Array<Record<string, unknown>>,
      radiologyOrders: (rad.data ?? []) as Array<Record<string, unknown>>,
      referrals: (refs.data ?? []) as Array<Record<string, unknown>>,
      tasks: (tasks.data ?? []) as Array<Record<string, unknown>>,
    },
  };
}

export async function orderPrescription(
  auth: PhiReadAuth,
  input: PrescriptionOrderInput,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "order_rx");
  if (!gate.ok) return gate;
  if (!input.allergyChecked) {
    return { ok: false, status: 400, error: "Allergy check required before prescribing" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const patientId = await resolvePatientId(auth.hospitalId, input.patientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const doctorStaffId = await resolveDoctorStaffId(auth);

  // Clinical safety: block if active matching allergy substance
  const { data: allergies } = await admin
    .from("patient_allergies")
    .select("substance, status")
    .eq("hospital_id", auth.hospitalId)
    .eq("patient_id", patientId)
    .eq("status", "active")
    .is("archived_at", null);
  const med = input.medicationName.toLowerCase();
  const hit = (allergies ?? []).find((a) =>
    med.includes(String(a.substance || "").toLowerCase()),
  );
  if (hit) {
    return {
      ok: false,
      status: 409,
      error: `Allergy conflict: ${hit.substance}`,
    };
  }

  const { data, error } = await admin
    .from("prescriptions")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      consultation_id: input.consultationId ?? null,
      prescribed_by_staff_id: doctorStaffId,
      medication_name: input.medicationName,
      dosage: input.dosage ?? null,
      frequency: input.frequency ?? null,
      duration: input.duration ?? null,
      route: input.route ?? null,
      quantity: input.quantity ?? null,
      instructions: input.instructions ?? null,
      allergy_checked: true,
      status: "active",
      legacy_id: input.legacyId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to order Rx" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

export async function orderLab(
  auth: PhiReadAuth,
  input: LabOrderInput,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "order_lab");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const patientId = await resolvePatientId(auth.hospitalId, input.patientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const doctorStaffId = await resolveDoctorStaffId(auth);

  const { data, error } = await admin
    .from("lab_orders")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      encounter_id: input.encounterId ?? null,
      consultation_id: input.consultationId ?? null,
      ordered_by_staff_id: doctorStaffId,
      test_name: input.testName,
      test_code: input.testCode ?? null,
      priority: input.priority,
      clinical_indication: input.clinicalIndication ?? null,
      notes: input.notes ?? null,
      status: "ordered",
      modality: "lab",
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to order lab" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

export async function orderRadiology(
  auth: PhiReadAuth,
  input: RadiologyOrderInput,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "order_radiology");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const patientId = await resolvePatientId(auth.hospitalId, input.patientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const doctorStaffId = await resolveDoctorStaffId(auth);

  const { data, error } = await admin
    .from("radiology_orders")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      consultation_id: input.consultationId ?? null,
      encounter_id: input.encounterId ?? null,
      ordered_by_staff_id: doctorStaffId,
      modality: input.modality,
      study_name: input.studyName,
      study_code: input.studyCode ?? null,
      body_site: input.bodySite ?? null,
      priority: input.priority,
      clinical_indication: input.clinicalIndication ?? null,
      notes: input.notes ?? null,
      status: "ordered",
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to order radiology" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

export async function createReferral(
  auth: PhiReadAuth,
  input: ReferralInput,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "create_referral");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const patientId = await resolvePatientId(auth.hospitalId, input.patientId);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  const doctorStaffId = await resolveDoctorStaffId(auth);

  const { data, error } = await admin
    .from("clinical_referrals")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      consultation_id: input.consultationId ?? null,
      encounter_id: input.encounterId ?? null,
      referred_by_staff_id: doctorStaffId,
      to_specialty: input.toSpecialty,
      to_doctor_name: input.toDoctorName ?? null,
      to_facility: input.toFacility ?? null,
      reason: input.reason,
      urgency: input.urgency,
      notes: input.notes ?? null,
      scheduled_at: input.scheduledAt ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to create referral" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

export async function createClinicalTask(
  auth: PhiReadAuth,
  input: ClinicalTaskInput,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "manage_tasks");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const doctorStaffId = await resolveDoctorStaffId(auth);
  let patientId: string | null = null;
  if (input.patientId) {
    patientId = await resolvePatientId(auth.hospitalId, input.patientId);
    if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  }

  const { data, error } = await admin
    .from("clinical_tasks")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      doctor_staff_id: doctorStaffId,
      consultation_id: input.consultationId ?? null,
      encounter_id: input.encounterId ?? null,
      title: input.title,
      detail: input.detail ?? null,
      task_type: input.taskType,
      priority: input.priority,
      due_at: input.dueAt ?? null,
      status: "open",
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to create task" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

export async function completeClinicalTask(
  auth: PhiReadAuth,
  taskId: string,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "manage_tasks");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data, error } = await admin
    .from("clinical_tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("hospital_id", auth.hospitalId)
    .eq("id", taskId)
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, error: error?.message || "Failed to complete task" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

export async function scheduleFollowUp(
  auth: PhiReadAuth,
  input: FollowUpInput,
): Promise<Result<Record<string, unknown>>> {
  const gate = await assertAction(auth, "schedule_follow_up");
  if (!gate.ok) return gate;
  const booked = await bookAppointment(auth, {
    patientId: input.patientId,
    doctorId: input.doctorId,
    scheduledAt: input.scheduledAt,
    reason: input.reason,
    appointmentType: "follow_up",
    notes: input.notes,
    followUpOfId: input.followUpOfId,
  });
  if (!booked.ok) return booked;
  return { ok: true, data: booked.data as unknown as Record<string, unknown> };
}
