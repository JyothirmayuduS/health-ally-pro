import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  rowToOpdAppointment,
  rowToOpdQueueEntry,
} from "@/lib/opd/compat";
import type {
  AppointmentListInput,
  AvailabilityRuleInput,
  BookAppointmentInput,
  OpdAppointment,
  OpdQueueEntry,
  WalkInInput,
} from "@/lib/opd/schemas";
import type { PhiReadAuth } from "@/server/phi-reads";
import { canPerformOpd, loadOpdActor } from "./rbac";

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; code?: string };

function adminOrFail() {
  return getSupabaseAdmin();
}

async function resolvePatientId(
  hospitalId: string,
  supplied: string,
): Promise<string | null> {
  const admin = adminOrFail();
  if (!admin) return null;
  let query = admin
    .from("patients")
    .select("id")
    .eq("hospital_id", hospitalId);
  query = /^[0-9a-f-]{36}$/i.test(supplied)
    ? query.eq("id", supplied)
    : query.or(`mrn.eq.${supplied},legacy_id.eq.${supplied}`);
  return String((await query.maybeSingle()).data?.id || "") || null;
}

async function resolveDoctorId(
  hospitalId: string,
  supplied: string,
): Promise<string | null> {
  const admin = adminOrFail();
  if (!admin) return null;
  let query = admin
    .from("staff_profiles")
    .select("id")
    .eq("hospital_id", hospitalId)
    .eq("is_active", true);
  query = /^[0-9a-f-]{36}$/i.test(supplied)
    ? query.eq("id", supplied)
    : query.eq("legacy_id", supplied);
  const row = await query.maybeSingle();
  if (row.data?.id) return String(row.data.id);

  const { data: hospitalDoctor } = await admin
    .from("hospital_doctors")
    .select("auth_user_id, doctor_code")
    .eq("hospital_id", hospitalId)
    .eq("doctor_code", supplied)
    .maybeSingle();
  if (!hospitalDoctor?.auth_user_id) return null;
  const { data: linked } = await admin
    .from("staff_profiles")
    .select("id")
    .eq("hospital_id", hospitalId)
    .eq("auth_user_id", hospitalDoctor.auth_user_id)
    .maybeSingle();
  return linked?.id ? String(linked.id) : null;
}

async function emitEvent(
  auth: PhiReadAuth,
  eventType: string,
  appointmentId: string,
  patientId: string,
  payload: Record<string, unknown> = {},
) {
  const admin = adminOrFail();
  if (!admin) return;
  await admin.from("opd_notification_events").insert({
    hospital_id: auth.hospitalId,
    appointment_id: appointmentId,
    patient_id: patientId,
    event_type: eventType,
    payload,
  });
}

export async function listAppointments(
  auth: PhiReadAuth,
  input: AppointmentListInput,
): Promise<Result<{ items: OpdAppointment[]; total: number }>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("read", auth, actor)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const from = (input.page - 1) * input.pageSize;
  let query = admin
    .from("appointments")
    .select("*, patients(mrn, legacy_id), staff_profiles(legacy_id)", {
      count: "exact",
    })
    .eq("hospital_id", auth.hospitalId)
    .order("scheduled_at", { ascending: true })
    .range(from, from + input.pageSize - 1);
  if (auth.isPatient && auth.patientId) query = query.eq("patient_id", auth.patientId);
  if (input.date) {
    query = query
      .gte("scheduled_at", `${input.date}T00:00:00.000Z`)
      .lt("scheduled_at", `${input.date}T23:59:59.999Z`);
  }
  if (input.doctorId) query = query.eq("doctor_staff_id", input.doctorId);
  if (input.patientId) query = query.eq("patient_id", input.patientId);
  if (input.status) query = query.eq("status", input.status);
  const { data, error, count } = await query;
  if (error) return { ok: false, status: 500, error: error.message };
  return {
    ok: true,
    data: {
      items: (data ?? []).map((row) =>
        rowToOpdAppointment(row as Record<string, unknown>),
      ),
      total: count ?? 0,
    },
  };
}

export async function bookAppointment(
  auth: PhiReadAuth,
  input: BookAppointmentInput,
): Promise<Result<OpdAppointment>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("book", auth, actor)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const [patientId, doctorId] = await Promise.all([
    resolvePatientId(auth.hospitalId, input.patientId),
    resolveDoctorId(auth.hospitalId, input.doctorId),
  ]);
  if (!patientId) return { ok: false, status: 404, error: "Patient not found" };
  if (!doctorId) return { ok: false, status: 404, error: "Doctor not found" };
  if (!auth.isStaff && auth.patientId !== patientId) {
    return { ok: false, status: 404, error: "Patient not found" };
  }

  const { data: conflict } = await admin
    .from("appointments")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .eq("doctor_staff_id", doctorId)
    .eq("scheduled_at", input.scheduledAt)
    .not("status", "in", '("cancelled","no_show")')
    .limit(1);
  if (conflict?.length) {
    return {
      ok: false,
      status: 409,
      error: "Doctor already has an appointment at this time",
      code: "slot_conflict",
    };
  }

  const { data, error } = await admin
    .from("appointments")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      doctor_staff_id: doctorId,
      scheduled_at: input.scheduledAt,
      time_label: input.timeLabel ?? null,
      reason: input.reason ?? null,
      appointment_type: input.appointmentType,
      visit_mode: "scheduled",
      status: "upcoming",
      notes: input.notes ?? null,
      follow_up_of_id: input.followUpOfId ?? null,
      follow_up_at: input.followUpOfId ? input.scheduledAt : null,
      legacy_id: input.legacyId ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
      updated_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*, patients(mrn, legacy_id), staff_profiles(legacy_id)")
    .single();
  if (error || !data) {
    const conflictError = error?.code === "23505";
    return {
      ok: false,
      status: conflictError ? 409 : 500,
      error: conflictError ? "Doctor already has an appointment at this time" : error?.message || "Booking failed",
      code: conflictError ? "slot_conflict" : undefined,
    };
  }
  const appointment = rowToOpdAppointment(data as Record<string, unknown>);
  await emitEvent(
    auth,
    input.followUpOfId ? "appointment.follow_up_scheduled" : "appointment.booked",
    appointment.id,
    patientId,
    { scheduled_at: appointment.scheduledAt },
  );
  return { ok: true, data: appointment };
}

export async function createWalkIn(
  auth: PhiReadAuth,
  input: WalkInInput,
): Promise<Result<{ appointment: OpdAppointment; queue: OpdQueueEntry }>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("book", auth, actor)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const [patientId, doctorId] = await Promise.all([
    resolvePatientId(auth.hospitalId, input.patientId),
    resolveDoctorId(auth.hospitalId, input.doctorId),
  ]);
  if (!patientId || !doctorId) {
    return { ok: false, status: 404, error: !patientId ? "Patient not found" : "Doctor not found" };
  }
  const now = new Date();
  const { data: tokenData, error: tokenError } = await admin.rpc(
    "next_doctor_token",
    {
      p_hospital_id: auth.hospitalId,
      p_doctor_staff_id: doctorId,
      p_day_date: now.toISOString().slice(0, 10),
    },
  );
  if (tokenError) return { ok: false, status: 500, error: tokenError.message };
  const token = Number(tokenData);
  const { data: appointmentRow, error: appointmentError } = await admin
    .from("appointments")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      doctor_staff_id: doctorId,
      scheduled_at: now.toISOString(),
      time_label: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      reason: input.reason ?? null,
      appointment_type: input.appointmentType,
      visit_mode: "walk_in",
      status: "in_queue",
      token_number: token,
      checked_in_at: now.toISOString(),
      notes: input.notes ?? null,
      legacy_id: input.legacyId ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (appointmentError || !appointmentRow) {
    return { ok: false, status: 500, error: appointmentError?.message || "Walk-in failed" };
  }
  const { count } = await admin
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", auth.hospitalId)
    .eq("doctor_staff_id", doctorId)
    .in("status", ["waiting", "called", "in_progress"]);
  const { data: queueRow, error: queueError } = await admin
    .from("queue_entries")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      doctor_staff_id: doctorId,
      appointment_id: appointmentRow.id,
      token_number: token,
      position: (count ?? 0) + 1,
      estimated_wait_minutes: (count ?? 0) * 15,
      status: "waiting",
    })
    .select("*")
    .single();
  if (queueError || !queueRow) {
    return { ok: false, status: 500, error: queueError?.message || "Queue insert failed" };
  }
  await emitEvent(auth, "appointment.checked_in", appointmentRow.id, patientId, {
    token_number: token,
    visit_mode: "walk_in",
  });
  return {
    ok: true,
    data: {
      appointment: rowToOpdAppointment(appointmentRow as Record<string, unknown>),
      queue: rowToOpdQueueEntry(queueRow as Record<string, unknown>),
    },
  };
}

export async function checkInAppointment(
  auth: PhiReadAuth,
  suppliedId: string,
): Promise<Result<{ appointment: OpdAppointment; queue: OpdQueueEntry }>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("check_in", auth, actor)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  let query = admin
    .from("appointments")
    .select("*")
    .eq("hospital_id", auth.hospitalId);
  query = /^[0-9a-f-]{36}$/i.test(suppliedId)
    ? query.eq("id", suppliedId)
    : query.eq("legacy_id", suppliedId);
  const { data: appointment } = await query.maybeSingle();
  if (!appointment) return { ok: false, status: 404, error: "Appointment not found" };
  if (appointment.status !== "upcoming") {
    return { ok: false, status: 409, error: "Appointment is not eligible for check-in" };
  }
  if (!appointment.doctor_staff_id) {
    return { ok: false, status: 409, error: "Appointment has no doctor" };
  }
  const day = new Date(appointment.scheduled_at).toISOString().slice(0, 10);
  const { data: tokenData, error: tokenError } = await admin.rpc("next_doctor_token", {
    p_hospital_id: auth.hospitalId,
    p_doctor_staff_id: appointment.doctor_staff_id,
    p_day_date: day,
  });
  if (tokenError) return { ok: false, status: 500, error: tokenError.message };
  const token = Number(tokenData);
  const { count } = await admin
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", auth.hospitalId)
    .eq("doctor_staff_id", appointment.doctor_staff_id)
    .in("status", ["waiting", "called", "in_progress"]);
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("appointments")
    .update({
      status: "in_queue",
      token_number: token,
      checked_in_at: now,
      updated_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .eq("id", appointment.id)
    .eq("hospital_id", auth.hospitalId)
    .eq("status", "upcoming")
    .select("*")
    .single();
  if (updateError || !updated) {
    return { ok: false, status: 409, error: "Appointment was already checked in" };
  }
  const { data: queueRow, error: queueError } = await admin
    .from("queue_entries")
    .upsert(
      {
        hospital_id: auth.hospitalId,
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_staff_id: appointment.doctor_staff_id,
        token_number: token,
        position: (count ?? 0) + 1,
        estimated_wait_minutes: (count ?? 0) * 15,
        status: "waiting",
      },
      { onConflict: "appointment_id" },
    )
    .select("*")
    .single();
  if (queueError || !queueRow) {
    return { ok: false, status: 500, error: queueError?.message || "Queue insert failed" };
  }
  await emitEvent(auth, "appointment.checked_in", appointment.id, appointment.patient_id, {
    token_number: token,
  });
  return {
    ok: true,
    data: {
      appointment: rowToOpdAppointment(updated as Record<string, unknown>),
      queue: rowToOpdQueueEntry(queueRow as Record<string, unknown>),
    },
  };
}

export async function rescheduleAppointment(
  auth: PhiReadAuth,
  suppliedId: string,
  scheduledAt: string,
  suppliedDoctorId?: string,
  reason?: string,
): Promise<Result<OpdAppointment>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("reschedule", auth, actor)) return { ok: false, status: 403, error: "Forbidden" };
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  let currentQuery = admin
    .from("appointments")
    .select("*")
    .eq("hospital_id", auth.hospitalId);
  currentQuery = /^[0-9a-f-]{36}$/i.test(suppliedId)
    ? currentQuery.eq("id", suppliedId)
    : currentQuery.eq("legacy_id", suppliedId);
  const { data: current } = await currentQuery.maybeSingle();
  if (!current) return { ok: false, status: 404, error: "Appointment not found" };
  const doctorId = suppliedDoctorId
    ? await resolveDoctorId(auth.hospitalId, suppliedDoctorId)
    : current.doctor_staff_id;
  if (!doctorId) return { ok: false, status: 404, error: "Doctor not found" };
  const { data: conflict } = await admin
    .from("appointments")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .eq("doctor_staff_id", doctorId)
    .eq("scheduled_at", scheduledAt)
    .neq("id", current.id)
    .not("status", "in", '("cancelled","no_show")')
    .limit(1);
  if (conflict?.length) return { ok: false, status: 409, error: "Slot conflict", code: "slot_conflict" };
  const { data, error } = await admin
    .from("appointments")
    .update({
      doctor_staff_id: doctorId,
      scheduled_at: scheduledAt,
      status: "upcoming",
      token_number: null,
      checked_in_at: null,
      rescheduled_from_id: current.id,
      notes: reason ? [current.notes, `Rescheduled: ${reason}`].filter(Boolean).join("\n") : current.notes,
      updated_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .eq("id", current.id)
    .eq("hospital_id", auth.hospitalId)
    .select("*")
    .single();
  if (error || !data) return { ok: false, status: error?.code === "23505" ? 409 : 500, error: error?.message || "Reschedule failed" };
  await admin.from("queue_entries").update({ status: "cancelled" }).eq("appointment_id", current.id).eq("hospital_id", auth.hospitalId);
  await emitEvent(auth, "appointment.rescheduled", current.id, current.patient_id, { scheduled_at: scheduledAt });
  return { ok: true, data: rowToOpdAppointment(data as Record<string, unknown>) };
}

export async function cancelAppointment(
  auth: PhiReadAuth,
  suppliedId: string,
  reason: string,
  notes?: string,
): Promise<Result<OpdAppointment>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("cancel", auth, actor)) return { ok: false, status: 403, error: "Forbidden" };
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const now = new Date().toISOString();
  let cancelQuery = admin
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancel_reason: reason,
      notes: notes ?? null,
      updated_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .eq("hospital_id", auth.hospitalId);
  cancelQuery = /^[0-9a-f-]{36}$/i.test(suppliedId)
    ? cancelQuery.eq("id", suppliedId)
    : cancelQuery.eq("legacy_id", suppliedId);
  const { data, error } = await cancelQuery
    .not("status", "in", '("completed","cancelled")')
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!data) return { ok: false, status: 404, error: "Appointment not found or already closed" };
  await admin.from("queue_entries").update({ status: "cancelled" }).eq("appointment_id", data.id).eq("hospital_id", auth.hospitalId);
  await emitEvent(auth, "appointment.cancelled", data.id, data.patient_id);
  return { ok: true, data: rowToOpdAppointment(data as Record<string, unknown>) };
}

export async function listQueue(
  auth: PhiReadAuth,
  doctorId?: string,
): Promise<Result<OpdQueueEntry[]>> {
  const actor = await loadOpdActor(auth);
  const resolvedDoctorId = doctorId ? await resolveDoctorId(auth.hospitalId, doctorId) : null;
  if (!canPerformOpd("read", auth, actor)) return { ok: false, status: 403, error: "Forbidden" };
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  let query = admin
    .from("queue_entries")
    .select("*, patients(mrn, legacy_id), staff_profiles(legacy_id)")
    .eq("hospital_id", auth.hospitalId)
    .in("status", ["waiting", "called", "in_progress"])
    .order("position");
  if (resolvedDoctorId) query = query.eq("doctor_staff_id", resolvedDoctorId);
  if (auth.isPatient && auth.patientId) query = query.eq("patient_id", auth.patientId);
  const { data, error } = await query;
  if (error) return { ok: false, status: 500, error: error.message };
  return { ok: true, data: (data ?? []).map((row) => rowToOpdQueueEntry(row as Record<string, unknown>)) };
}

export async function transitionQueue(
  auth: PhiReadAuth,
  queueEntryId: string,
  action: "call" | "start" | "complete" | "cancel",
): Promise<Result<OpdQueueEntry>> {
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const { data: current } = await admin
    .from("queue_entries")
    .select("*")
    .eq("id", queueEntryId)
    .eq("hospital_id", auth.hospitalId)
    .maybeSingle();
  if (!current) return { ok: false, status: 404, error: "Queue entry not found" };
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("manage_queue", auth, actor, current.doctor_staff_id)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const allowed: Record<string, { from: string[]; to: string }> = {
    call: { from: ["waiting"], to: "called" },
    start: { from: ["waiting", "called"], to: "in_progress" },
    complete: { from: ["in_progress"], to: "completed" },
    cancel: { from: ["waiting", "called", "in_progress"], to: "cancelled" },
  };
  const transition = allowed[action];
  if (!transition.from.includes(current.status)) {
    return { ok: false, status: 409, error: `Cannot ${action} from ${current.status}` };
  }
  const patch: Record<string, unknown> = { status: transition.to };
  if (action === "call") patch.called_at = new Date().toISOString();
  if (action === "complete") patch.completed_at = new Date().toISOString();
  const { data, error } = await admin
    .from("queue_entries")
    .update(patch)
    .eq("id", queueEntryId)
    .eq("hospital_id", auth.hospitalId)
    .eq("status", current.status)
    .select("*")
    .single();
  if (error || !data) return { ok: false, status: 409, error: error?.message || "Queue changed concurrently" };
  if (current.appointment_id) {
    const appointmentStatus =
      action === "complete" ? "completed" : action === "cancel" ? "cancelled" : "in_queue";
    await admin
      .from("appointments")
      .update({ status: appointmentStatus })
      .eq("id", current.appointment_id)
      .eq("hospital_id", auth.hospitalId);
    await emitEvent(
      auth,
      `appointment.${action === "start" ? "consultation_started" : action === "complete" ? "completed" : action === "call" ? "called" : "cancelled"}`,
      current.appointment_id,
      current.patient_id,
      { token_number: current.token_number },
    );
  }
  return { ok: true, data: rowToOpdQueueEntry(data as Record<string, unknown>) };
}

export async function listAvailability(
  auth: PhiReadAuth,
  suppliedDoctorId: string,
  date?: string,
): Promise<Result<{ rules: unknown[]; exceptions: unknown[]; slots: string[] }>> {
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("read", auth, actor)) return { ok: false, status: 403, error: "Forbidden" };
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const doctorId = await resolveDoctorId(auth.hospitalId, suppliedDoctorId);
  if (!doctorId) return { ok: false, status: 404, error: "Doctor not found" };
  const [{ data: rules }, { data: exceptions }] = await Promise.all([
    admin.from("doctor_availability_rules").select("*").eq("hospital_id", auth.hospitalId).eq("doctor_staff_id", doctorId).eq("is_active", true).order("weekday"),
    admin.from("doctor_availability_exceptions").select("*").eq("hospital_id", auth.hospitalId).eq("doctor_staff_id", doctorId).order("exception_date"),
  ]);
  const slots: string[] = [];
  if (date) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const blocked = (exceptions ?? []).some((e) => e.exception_date === date && e.kind === "blocked");
    if (!blocked) {
      for (const rule of (rules ?? []).filter((r) => r.weekday === weekday)) {
        const [startHour, startMinute] = String(rule.start_time).split(":").map(Number);
        const [endHour, endMinute] = String(rule.end_time).split(":").map(Number);
        let cursor = startHour * 60 + startMinute;
        const end = endHour * 60 + endMinute;
        while (cursor < end) {
          slots.push(`${date}T${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}:00.000Z`);
          cursor += Number(rule.slot_minutes);
        }
      }
      const { data: booked } = await admin.from("appointments").select("scheduled_at").eq("hospital_id", auth.hospitalId).eq("doctor_staff_id", doctorId).gte("scheduled_at", `${date}T00:00:00.000Z`).lte("scheduled_at", `${date}T23:59:59.999Z`).not("status", "in", '("cancelled","no_show")');
      const occupied = new Set((booked ?? []).map((row) => String(row.scheduled_at)));
      return { ok: true, data: { rules: rules ?? [], exceptions: exceptions ?? [], slots: slots.filter((slot) => !occupied.has(slot)) } };
    }
  }
  return { ok: true, data: { rules: rules ?? [], exceptions: exceptions ?? [], slots } };
}

export async function upsertAvailabilityRule(
  auth: PhiReadAuth,
  input: AvailabilityRuleInput,
): Promise<Result<unknown>> {
  const doctorId = await resolveDoctorId(auth.hospitalId, input.doctorId);
  if (!doctorId) return { ok: false, status: 404, error: "Doctor not found" };
  const actor = await loadOpdActor(auth);
  if (!canPerformOpd("manage_availability", auth, actor, doctorId)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };
  const row = {
    hospital_id: auth.hospitalId,
    doctor_staff_id: doctorId,
    weekday: input.weekday,
    start_time: input.startTime,
    end_time: input.endTime,
    slot_minutes: input.slotMinutes,
    capacity: input.capacity,
    effective_from: input.effectiveFrom ?? null,
    effective_to: input.effectiveTo ?? null,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
    created_by: auth.userId === "demo-staff" ? null : auth.userId,
  };
  let existingQuery = admin
    .from("doctor_availability_rules")
    .select("id")
    .eq("hospital_id", auth.hospitalId)
    .eq("doctor_staff_id", doctorId)
    .eq("weekday", input.weekday)
    .eq("start_time", input.startTime);
  existingQuery = input.effectiveFrom
    ? existingQuery.eq("effective_from", input.effectiveFrom)
    : existingQuery.is("effective_from", null);
  const { data: existing } = await existingQuery.maybeSingle();
  const write = existing
    ? admin
        .from("doctor_availability_rules")
        .update(row)
        .eq("id", existing.id)
        .eq("hospital_id", auth.hospitalId)
    : admin.from("doctor_availability_rules").insert(row);
  const { data, error } = await write.select("*").single();
  if (error) return { ok: false, status: 500, error: error.message };
  return { ok: true, data };
}
