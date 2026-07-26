import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
  normalizeName,
  normalizePhone,
  splitName,
  type AllergyInput,
  type EmergencyContactInput,
  type HistoryEntryInput,
  type ManagedPatient,
  type PatientProfileBundle,
  type PatientSearchInput,
  type RegisterPatientInput,
  type SignConsentInput,
  type UpdatePatientInput,
} from "@/lib/patient-management/schemas";
import { rowToManagedPatient } from "@/lib/patient-management/compat";
import type { PhiReadAuth } from "@/server/phi-reads";
import { canPerform, loadStaffRoles } from "@/server/patient-management/rbac";

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function adminOrFail() {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  return admin;
}

async function resolveHospitalPatientId(
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
  const { data } = await query.limit(1).maybeSingle();
  return data?.id ? String(data.id) : null;
}

async function assertAction(
  auth: PhiReadAuth,
  action: Parameters<typeof canPerform>[0],
  patientId?: string | null,
): Promise<Result<true>> {
  const roles = await loadStaffRoles(auth);
  let isOwnPatient = false;
  let hasGrant = false;
  if (patientId && auth.patientId === patientId) isOwnPatient = true;
  if (patientId && !auth.isStaff) {
    const admin = adminOrFail();
    if (admin) {
      const { data } = await admin
        .from("patient_access_grants")
        .select("id")
        .eq("patient_id", patientId)
        .eq("grantee_profile_id", auth.userId)
        .is("revoked_at", null)
        .limit(1);
      hasGrant = Boolean(data?.length);
      if (!isOwnPatient) {
        const { data: own } = await admin
          .from("patients")
          .select("id")
          .eq("id", patientId)
          .eq("profile_id", auth.userId)
          .eq("hospital_id", auth.hospitalId)
          .maybeSingle();
        isOwnPatient = Boolean(own);
      }
    }
  }
  if (!canPerform(action, auth, roles, { isOwnPatient, hasGrant })) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, data: true };
}

export async function findDuplicateCandidates(
  auth: PhiReadAuth,
  input: { phone: string; fullName: string; dateOfBirth: string },
) {
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const phone = normalizePhone(input.phone);
  const name = normalizeName(input.fullName);
  const { data, error } = await admin
    .from("patients")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .neq("status", "merged")
    .or(`search_phone.eq.${phone},and(search_name.eq.${name},date_of_birth.eq.${input.dateOfBirth})`)
    .limit(10);
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data: (data ?? []).map((r) => rowToManagedPatient(r as Record<string, unknown>)) };
}

export async function registerPatient(
  auth: PhiReadAuth,
  input: RegisterPatientInput,
): Promise<Result<{ patient: ManagedPatient; duplicates?: ManagedPatient[] }>> {
  const gate = await assertAction(auth, "register");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const duplicates = await findDuplicateCandidates(auth, {
    phone: input.phone,
    fullName: input.fullName,
    dateOfBirth: input.dateOfBirth,
  });
  if (!duplicates.ok) return duplicates;
  if (duplicates.data.length > 0 && !input.forceCreateDespiteDuplicates) {
    return {
      ok: true,
      data: {
        patient: duplicates.data[0]!,
        duplicates: duplicates.data,
      },
    };
  }

  const { data: mrnData, error: mrnError } = await admin.rpc("next_hospital_mrn", {
    p_hospital_id: auth.hospitalId,
  });
  if (mrnError) return { ok: false, status: 500, error: mrnError.message };
  const mrn = String(mrnData);
  const { firstName, lastName } = splitName(input.fullName);

  const row = {
    hospital_id: auth.hospitalId,
    mrn,
    full_name: input.fullName.trim(),
    first_name: firstName,
    last_name: lastName,
    date_of_birth: input.dateOfBirth,
    gender: input.gender,
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    address_line1: input.addressLine1 ?? null,
    address_line2: input.addressLine2 ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    postal_code: input.postalCode ?? null,
    country: input.country ?? "IN",
    blood_group: input.bloodGroup ?? null,
    national_id: input.nationalId ?? null,
    insurance_provider: input.insuranceProvider ?? null,
    insurance_policy_id: input.insurancePolicyId ?? null,
    allergies_summary: input.allergiesSummary ?? null,
    search_name: normalizeName(input.fullName),
    search_phone: normalizePhone(input.phone),
    status: "active",
    created_by: auth.userId === "demo-staff" ? null : auth.userId,
    updated_by: auth.userId === "demo-staff" ? null : auth.userId,
  };

  const { data, error } = await admin.from("patients").insert(row).select("*").single();
  if (error || !data) return { ok: false, status: 500, error: error?.message ?? "insert_failed" };

  const patient = rowToManagedPatient(data as Record<string, unknown>);

  if (input.emergencyContacts?.length) {
    await insertEmergencyContacts(auth, patient.id, input.emergencyContacts);
  }
  if (input.allergies?.length) {
    await insertAllergies(auth, patient.id, input.allergies);
  }

  // Issue QR token on registration
  await issueQrToken(auth, patient.id);

  return { ok: true, data: { patient } };
}

async function insertEmergencyContacts(
  auth: PhiReadAuth,
  patientId: string,
  contacts: EmergencyContactInput[],
) {
  const admin = adminOrFail();
  if (!admin) return;
  await admin.from("patient_emergency_contacts").insert(
    contacts.map((c, i) => ({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      full_name: c.fullName,
      phone: c.phone,
      relation: c.relation ?? null,
      is_primary: c.isPrimary ?? i === 0,
      notes: c.notes ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })),
  );
}

async function insertAllergies(auth: PhiReadAuth, patientId: string, allergies: AllergyInput[]) {
  const admin = adminOrFail();
  if (!admin) return;
  await admin.from("patient_allergies").insert(
    allergies.map((a) => ({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      substance: a.substance,
      reaction: a.reaction ?? null,
      severity: a.severity,
      status: a.status,
      onset_date: a.onsetDate ?? null,
      notes: a.notes ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })),
  );
}

export async function searchPatients(
  auth: PhiReadAuth,
  input: PatientSearchInput,
): Promise<Result<{ items: ManagedPatient[]; total: number; page: number; pageSize: number }>> {
  const gate = await assertAction(auth, "search");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const page = input.page;
  const pageSize = input.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from("patients")
    .select("*", { count: "exact" })
    .eq("hospital_id", auth.hospitalId)
    .neq("status", "merged")
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (input.status) query = query.eq("status", input.status);
  if (input.q?.trim()) {
    const q = input.q.trim();
    const phone = normalizePhone(q);
    const name = normalizeName(q);
    if (q.toUpperCase().startsWith("MRN-") || /^MRN-\d+$/i.test(q)) {
      query = query.ilike("mrn", q.toUpperCase());
    } else if (phone.length >= 7) {
      query = query.or(`search_phone.ilike.%${phone}%,mrn.ilike.%${q}%`);
    } else {
      query = query.or(`search_name.ilike.%${name}%,mrn.ilike.%${q}%`);
    }
  }

  const { data, error, count } = await query;
  if (error) return { ok: false, status: 500, error: error.message };
  return {
    ok: true,
    data: {
      items: (data ?? []).map((r) => rowToManagedPatient(r as Record<string, unknown>),),
      total: count ?? 0,
      page,
      pageSize,
    },
  };
}

export async function getPatientProfile(
  auth: PhiReadAuth,
  patientId: string,
): Promise<Result<PatientProfileBundle>> {
  const resolvedPatientId = await resolveHospitalPatientId(auth, patientId);
  if (!resolvedPatientId) {
    return { ok: false, status: 404, error: "Patient not found" };
  }
  const gate = await assertAction(auth, "read_profile", resolvedPatientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const { data: patient, error } = await admin
    .from("patients")
    .select("*")
    .eq("id", resolvedPatientId)
    .eq("hospital_id", auth.hospitalId)
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!patient) return { ok: false, status: 404, error: "Patient not found" };

  const [contacts, relationships, allergies, history, consents, documents, qr] = await Promise.all([
    admin
      .from("patient_emergency_contacts")
      .select("*")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .is("archived_at", null)
      .order("is_primary", { ascending: false }),
    admin
      .from("patient_relationships")
      .select("*")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .is("archived_at", null),
    admin
      .from("patient_allergies")
      .select("*")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    admin
      .from("patient_history_entries")
      .select("*")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .is("archived_at", null)
      .order("occurred_on", { ascending: false }),
    admin
      .from("patient_consents")
      .select("*")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .order("created_at", { ascending: false }),
    admin
      .from("patient_documents")
      .select("id, title, category, mime_type, byte_size, status, created_at, archived_at")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    admin
      .from("patient_qr_tokens")
      .select("id, token_prefix, status, expires_at")
      .eq("patient_id", resolvedPatientId)
      .eq("hospital_id", auth.hospitalId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    ok: true,
    data: {
      patient: rowToManagedPatient(patient as Record<string, unknown>),
      emergencyContacts: contacts.data ?? [],
      relationships: relationships.data ?? [],
      allergies: allergies.data ?? [],
      history: history.data ?? [],
      consents: consents.data ?? [],
      documents: documents.data ?? [],
      qr: qr.data
        ? {
            id: String(qr.data.id),
            tokenPrefix: String(qr.data.token_prefix),
            status: String(qr.data.status),
            expiresAt: (qr.data.expires_at as string | null) ?? null,
          }
        : null,
    },
  };
}

export async function updatePatient(
  auth: PhiReadAuth,
  patientId: string,
  input: UpdatePatientInput,
): Promise<Result<ManagedPatient>> {
  const gate = await assertAction(auth, "update_identity", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false, status: 503, error: "admin_unavailable" };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.userId === "demo-staff" ? null : auth.userId,
  };
  if (input.fullName !== undefined) {
    const { firstName, lastName } = splitName(input.fullName);
    patch.full_name = input.fullName.trim();
    patch.first_name = firstName;
    patch.last_name = lastName;
    patch.search_name = normalizeName(input.fullName);
  }
  if (input.phone !== undefined) {
    patch.phone = input.phone.trim();
    patch.search_phone = normalizePhone(input.phone);
  }
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.dateOfBirth !== undefined) patch.date_of_birth = input.dateOfBirth;
  if (input.gender !== undefined) patch.gender = input.gender;
  if (input.addressLine1 !== undefined) patch.address_line1 = input.addressLine1 ?? null;
  if (input.addressLine2 !== undefined) patch.address_line2 = input.addressLine2 ?? null;
  if (input.city !== undefined) patch.city = input.city ?? null;
  if (input.state !== undefined) patch.state = input.state ?? null;
  if (input.postalCode !== undefined) patch.postal_code = input.postalCode ?? null;
  if (input.country !== undefined) patch.country = input.country ?? null;
  if (input.bloodGroup !== undefined) patch.blood_group = input.bloodGroup ?? null;
  if (input.nationalId !== undefined) patch.national_id = input.nationalId ?? null;
  if (input.insuranceProvider !== undefined) patch.insurance_provider = input.insuranceProvider ?? null;
  if (input.insurancePolicyId !== undefined) patch.insurance_policy_id = input.insurancePolicyId ?? null;
  if (input.allergiesSummary !== undefined) patch.allergies_summary = input.allergiesSummary ?? null;

  const { data, error } = await admin
    .from("patients")
    .update(patch)
    .eq("id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .select("*")
    .single();
  if (error || !data) return { ok: false, status: 500, error: error?.message ?? "update_failed" };
  return { ok: true, data: rowToManagedPatient(data as Record<string, unknown>) };
}

export async function replaceEmergencyContacts(
  auth: PhiReadAuth,
  patientId: string,
  contacts: EmergencyContactInput[],
) {
  const gate = await assertAction(auth, "manage_contacts", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  await admin
    .from("patient_emergency_contacts")
    .update({ archived_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .is("archived_at", null);
  await insertEmergencyContacts(auth, patientId, contacts);
  const { data } = await admin
    .from("patient_emergency_contacts")
    .select("*")
    .eq("patient_id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .is("archived_at", null);
  return { ok: true as const, data: data ?? [] };
}

export async function addAllergy(auth: PhiReadAuth, patientId: string, input: AllergyInput) {
  const gate = await assertAction(auth, "manage_allergies", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
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
  if (error) return { ok: false as const, status: 500, error: error.message };
  // refresh summary
  const { data: active } = await admin
    .from("patient_allergies")
    .select("substance")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .is("archived_at", null);
  await admin
    .from("patients")
    .update({
      allergies_summary: (active ?? []).map((a) => a.substance).join(", ") || null,
    })
    .eq("id", patientId)
    .eq("hospital_id", auth.hospitalId);
  return { ok: true as const, data };
}

export async function addHistoryEntry(
  auth: PhiReadAuth,
  patientId: string,
  input: HistoryEntryInput,
) {
  const gate = await assertAction(auth, "manage_history", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("patient_history_entries")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      category: input.category,
      title: input.title,
      detail: input.detail ?? null,
      occurred_on: input.occurredOn ?? null,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data };
}

export async function listConsentTemplates(auth: PhiReadAuth) {
  const gate = await assertAction(auth, "manage_consents");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("consent_templates")
    .select("*")
    .eq("hospital_id", auth.hospitalId)
    .eq("is_active", true)
    .order("title");
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data: data ?? [] };
}

export async function signConsent(
  auth: PhiReadAuth,
  patientId: string,
  input: SignConsentInput,
) {
  const gate = await assertAction(auth, "manage_consents", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };

  let title = input.title;
  let body = input.bodySnapshot;
  let templateId = input.templateId ?? null;
  if (input.templateId) {
    const { data: tpl } = await admin
      .from("consent_templates")
      .select("*")
      .eq("id", input.templateId)
      .eq("hospital_id", auth.hospitalId)
      .maybeSingle();
    if (!tpl) return { ok: false as const, status: 404, error: "Template not found" };
    title = tpl.title;
    body = tpl.body;
    templateId = tpl.id;
  }
  if (!title || !body) return { ok: false as const, status: 400, error: "title and body required" };

  const { data, error } = await admin
    .from("patient_consents")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      template_id: templateId,
      title,
      body_snapshot: body,
      status: "signed",
      signed_at: new Date().toISOString(),
      signed_by_name: input.signedByName,
      signed_by_profile_id: auth.userId === "demo-staff" ? null : auth.userId,
      signature_method: input.signatureMethod,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("*")
    .single();
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data };
}

export async function revokeConsent(
  auth: PhiReadAuth,
  patientId: string,
  consentId: string,
  reason?: string,
) {
  const gate = await assertAction(auth, "manage_consents", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("patient_consents")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: auth.userId === "demo-staff" ? null : auth.userId,
      revoke_reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", consentId)
    .eq("patient_id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .select("*")
    .single();
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueQrToken(auth: PhiReadAuth, patientId: string) {
  const gate = await assertAction(auth, "manage_qr", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };

  // Revoke previous active tokens
  await admin
    .from("patient_qr_tokens")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .eq("patient_id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .eq("status", "active");

  const raw = randomBytes(32).toString("base64url");
  const token = `mq_${raw}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.slice(0, 10);
  const expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("patient_qr_tokens")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      status: "active",
      expires_at: expiresAt,
      created_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("id, token_prefix, status, expires_at")
    .single();
  if (error) return { ok: false as const, status: 500, error: error.message };

  // Opaque URL — no PHI
  const resolvePath = `/api/hospital/patients/qr/resolve`;
  return {
    ok: true as const,
    data: {
      id: data.id,
      tokenPrefix: data.token_prefix,
      status: data.status,
      expiresAt: data.expires_at,
      token, // returned once to issuer for printing; never stored
      payload: { t: token, v: 1 },
      resolvePath,
    },
  };
}

export async function resolveQrToken(auth: PhiReadAuth, token: string) {
  const gate = await assertAction(auth, "resolve_qr");
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };

  const tokenHash = hashToken(token.trim());
  const { data } = await admin
    .from("patient_qr_tokens")
    .select("id, hospital_id, patient_id, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  // Uniform not-found for cross-tenant / missing / revoked (no existence leak)
  if (!data || data.hospital_id !== auth.hospitalId) {
    return { ok: false as const, status: 404, error: "Not found" };
  }
  if (data.status !== "active") {
    return { ok: false as const, status: 404, error: "Not found" };
  }
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false as const, status: 404, error: "Not found" };
  }

  await admin
    .from("patient_qr_tokens")
    .update({ last_resolved_at: new Date().toISOString() })
    .eq("id", data.id);

  return getPatientProfile(auth, data.patient_id);
}

export async function uploadPatientDocumentMeta(
  auth: PhiReadAuth,
  patientId: string,
  meta: {
    title: string;
    category: string;
    mimeType: string;
    byteSize: number;
    storagePath: string;
    sha256?: string;
  },
) {
  const gate = await assertAction(auth, "manage_documents", patientId);
  if (!gate.ok) return gate;
  if (!ALLOWED_DOCUMENT_MIME.includes(meta.mimeType as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
    return { ok: false as const, status: 400, error: "Unsupported file type" };
  }
  if (meta.byteSize <= 0 || meta.byteSize > MAX_DOCUMENT_BYTES) {
    return { ok: false as const, status: 400, error: "File too large" };
  }
  if (!meta.storagePath.startsWith(`${auth.hospitalId}/${patientId}/`)) {
    return { ok: false as const, status: 400, error: "Invalid storage path" };
  }
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("patient_documents")
    .insert({
      hospital_id: auth.hospitalId,
      patient_id: patientId,
      title: meta.title,
      category: meta.category,
      mime_type: meta.mimeType,
      byte_size: meta.byteSize,
      storage_path: meta.storagePath,
      sha256: meta.sha256 ?? null,
      uploaded_by: auth.userId === "demo-staff" ? null : auth.userId,
    })
    .select("id, title, category, mime_type, byte_size, status, created_at")
    .single();
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data };
}

export async function createSignedDocumentUrl(
  auth: PhiReadAuth,
  patientId: string,
  documentId: string,
) {
  const gate = await assertAction(auth, "manage_documents", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const { data: doc } = await admin
    .from("patient_documents")
    .select("storage_path, hospital_id, patient_id, archived_at")
    .eq("id", documentId)
    .eq("patient_id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .maybeSingle();
  if (!doc || doc.archived_at) return { ok: false as const, status: 404, error: "Not found" };

  const { data, error } = await admin.storage
    .from("patient-documents")
    .createSignedUrl(doc.storage_path, 60);
  if (error || !data?.signedUrl) {
    return { ok: false as const, status: 500, error: error?.message ?? "sign_failed" };
  }
  return { ok: true as const, data: { url: data.signedUrl, expiresIn: 60 } };
}

export async function archiveDocument(
  auth: PhiReadAuth,
  patientId: string,
  documentId: string,
) {
  const gate = await assertAction(auth, "manage_documents", patientId);
  if (!gate.ok) return gate;
  const admin = adminOrFail();
  if (!admin) return { ok: false as const, status: 503, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("patient_documents")
    .update({
      archived_at: new Date().toISOString(),
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("patient_id", patientId)
    .eq("hospital_id", auth.hospitalId)
    .select("id, status, archived_at")
    .single();
  if (error) return { ok: false as const, status: 500, error: error.message };
  return { ok: true as const, data };
}
