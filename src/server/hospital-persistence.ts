import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

/** Default Oak Haven hospital from demo seed */
export const DEFAULT_HOSPITAL_ID = "a0000001-0001-4001-8001-000000000001";

export type DbHospitalDoctor = {
  id?: string;
  hospital_id: string;
  doctor_code: string;
  name: string;
  email: string;
  specialty_id: string;
  room?: string | null;
  fee: number;
  phone?: string | null;
  registration_no?: string | null;
  demo_auth_key?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DbSpecialtyChart = {
  id?: string;
  hospital_id: string;
  doctor_id?: string | null;
  specialty_id: string;
  patient_name: string;
  patient_id?: string | null;
  module_id: string;
  values: Record<string, unknown>;
  client_key?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DbUnitRecord = {
  id?: string;
  hospital_id: string;
  unit_id: string;
  title: string;
  status: string;
  detail?: string | null;
  meta?: string | null;
  priority?: string | null;
  record_key?: string | null;
  updated_at?: string;
};

export type DbOnboardingLead = {
  hospital_name: string;
  legal_name?: string;
  admin_name: string;
  admin_email: string;
  city?: string;
  beds?: number;
  plan: string;
  specialties: string[];
  accent_color?: string;
  status?: string;
  payload?: Record<string, unknown>;
};

export type DbAnatomyMarker = {
  id?: string;
  hospital_id: string;
  specialty_id?: string | null;
  doctor_id?: string | null;
  patient_id?: string | null;
  region_id: string;
  label: string;
  view: string;
  mesh_type?: string | null;
  meta?: Record<string, unknown>;
};

export function persistenceAvailable() {
  return isSupabaseAdminConfigured();
}

export async function upsertHospitalDoctors(rows: DbHospitalDoctor[]) {
  const admin = getSupabaseAdmin();
  if (!admin || rows.length === 0) return { ok: false as const, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("hospital_doctors")
    .upsert(
      rows.map((r) => ({
        ...r,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "hospital_id,doctor_code" },
    )
    .select();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function listHospitalDoctors(hospitalId = DEFAULT_HOSPITAL_ID) {
  const admin = getSupabaseAdmin();
  if (!admin)
    return { ok: false as const, error: "admin_unavailable", data: [] as DbHospitalDoctor[] };
  const { data, error } = await admin
    .from("hospital_doctors")
    .select("*")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });
  if (error) return { ok: false as const, error: error.message, data: [] as DbHospitalDoctor[] };
  return { ok: true as const, data: (data ?? []) as DbHospitalDoctor[] };
}

export async function insertSpecialtyChart(row: DbSpecialtyChart) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "admin_unavailable" };

  const payload = {
    hospital_id: row.hospital_id,
    doctor_id: row.doctor_id ?? null,
    specialty_id: row.specialty_id,
    patient_name: row.patient_name,
    patient_id: row.patient_id ?? null,
    module_id: row.module_id,
    values: row.values ?? {},
    client_key: row.client_key ?? null,
    updated_at: new Date().toISOString(),
  };

  if (payload.client_key) {
    const { data: existing } = await admin
      .from("specialty_chart_notes")
      .select("id")
      .eq("hospital_id", payload.hospital_id)
      .eq("client_key", payload.client_key)
      .maybeSingle();
    if (existing?.id) {
      const { data, error } = await admin
        .from("specialty_chart_notes")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, data };
    }
  }

  const { data, error } = await admin
    .from("specialty_chart_notes")
    .insert(payload)
    .select()
    .single();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function listSpecialtyCharts(hospitalId: string, specialtyId?: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, data: [] as DbSpecialtyChart[] };
  let q = admin
    .from("specialty_chart_notes")
    .select("*")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (specialtyId) q = q.eq("specialty_id", specialtyId);
  const { data, error } = await q;
  if (error) return { ok: false as const, data: [] as DbSpecialtyChart[], error: error.message };
  return { ok: true as const, data: (data ?? []) as DbSpecialtyChart[] };
}

export async function upsertUnitRecords(rows: DbUnitRecord[]) {
  const admin = getSupabaseAdmin();
  if (!admin || rows.length === 0) return { ok: false as const, error: "admin_unavailable" };

  for (const row of rows) {
    const recordKey =
      row.record_key || (row.id && !/^[0-9a-f-]{36}$/i.test(row.id) ? row.id : null);
    const payload = {
      hospital_id: row.hospital_id,
      unit_id: row.unit_id,
      title: row.title,
      status: row.status,
      detail: row.detail ?? null,
      meta: row.meta ?? null,
      priority: row.priority ?? "routine",
      record_key: recordKey,
      updated_at: new Date().toISOString(),
    };

    if (row.id && /^[0-9a-f-]{36}$/i.test(row.id)) {
      const { error } = await admin
        .from("hospital_unit_records")
        .upsert({ ...payload, id: row.id });
      if (error) return { ok: false as const, error: error.message };
      continue;
    }

    if (recordKey) {
      const { data: existing } = await admin
        .from("hospital_unit_records")
        .select("id")
        .eq("hospital_id", payload.hospital_id)
        .eq("record_key", recordKey)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await admin
          .from("hospital_unit_records")
          .update(payload)
          .eq("id", existing.id);
        if (error) return { ok: false as const, error: error.message };
        continue;
      }
    }

    const { error } = await admin.from("hospital_unit_records").insert(payload);
    if (error) return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function listUnitRecords(hospitalId = DEFAULT_HOSPITAL_ID) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, data: [] as DbUnitRecord[] };
  const { data, error } = await admin
    .from("hospital_unit_records")
    .select("*")
    .eq("hospital_id", hospitalId)
    .order("updated_at", { ascending: false });
  if (error) return { ok: false as const, data: [] as DbUnitRecord[], error: error.message };
  return { ok: true as const, data: (data ?? []) as DbUnitRecord[] };
}

export async function updateUnitRecordStatus(id: string, status: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "admin_unavailable" };
  const { error } = await admin
    .from("hospital_unit_records")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function insertOnboardingLead(
  lead: DbOnboardingLead,
  opts?: { provisionHospital?: boolean },
) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "admin_unavailable" };

  const { data: leadRow, error: leadErr } = await admin
    .from("hospital_onboarding_leads")
    .insert({
      hospital_name: lead.hospital_name,
      legal_name: lead.legal_name,
      admin_name: lead.admin_name,
      admin_email: lead.admin_email,
      city: lead.city,
      beds: lead.beds,
      plan: lead.plan,
      specialties: lead.specialties,
      accent_color: lead.accent_color,
      status: lead.status ?? "draft",
      payload: lead.payload ?? {},
    })
    .select()
    .single();

  if (leadErr) return { ok: false as const, error: leadErr.message };

  if (!opts?.provisionHospital) {
    return { ok: true as const, data: leadRow, hospital: null, provisioned: false as const };
  }

  // Provision hospital tenant + subscription stub (auth-gated by caller)
  const slug =
    lead.hospital_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || `hospital-${Date.now()}`;

  const { data: hospital, error: hospErr } = await admin
    .from("hospitals")
    .insert({
      name: lead.hospital_name,
      slug: `${slug}-${Date.now().toString(36)}`,
      legal_name: lead.legal_name ?? lead.hospital_name,
      email: lead.admin_email,
      city: lead.city,
      bed_count: lead.beds,
      plan: lead.plan,
      accent_color: lead.accent_color ?? "#1B3B2E",
      onboarded_at: new Date().toISOString(),
      settings: { specialties: lead.specialties, admin_name: lead.admin_name },
    })
    .select()
    .single();

  if (hospErr || !hospital) {
    return {
      ok: true as const,
      data: leadRow,
      hospital: null,
      provisioned: false as const,
      warning: hospErr?.message,
    };
  }

  await admin
    .from("hospital_onboarding_leads")
    .update({ hospital_id: hospital.id, status: "provisioned" })
    .eq("id", leadRow.id);

  await admin.from("hospital_subscriptions").upsert({
    hospital_id: hospital.id,
    plan: lead.plan,
    status: "trialing",
    seats: lead.plan === "enterprise" ? 500 : lead.plan === "professional" ? 150 : 25,
  });

  await admin.from("branches").insert({
    hospital_id: hospital.id,
    name: "Main campus",
    code: "MAIN",
    address: lead.city ?? null,
  });

  return { ok: true as const, data: leadRow, hospital, provisioned: true as const };
}

export async function replaceAnatomyMarkers(
  hospitalId: string,
  specialtyId: string,
  markers: DbAnatomyMarker[],
) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "admin_unavailable" };

  await admin
    .from("anatomy_markers")
    .delete()
    .eq("hospital_id", hospitalId)
    .eq("specialty_id", specialtyId)
    .is("patient_id", null);

  if (markers.length === 0) return { ok: true as const, data: [] };

  const { data, error } = await admin
    .from("anatomy_markers")
    .insert(markers.map((m) => ({ ...m, hospital_id: hospitalId, specialty_id: specialtyId })))
    .select();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function listAnatomyMarkers(hospitalId: string, specialtyId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, data: [] as DbAnatomyMarker[] };
  const { data, error } = await admin
    .from("anatomy_markers")
    .select("*")
    .eq("hospital_id", hospitalId)
    .eq("specialty_id", specialtyId)
    .is("patient_id", null);
  if (error) return { ok: false as const, data: [] as DbAnatomyMarker[] };
  return { ok: true as const, data: (data ?? []) as DbAnatomyMarker[] };
}

export type DeskId =
  | "reception"
  | "lab"
  | "pharmacy"
  | "billing"
  | "nursing"
  | "admin"
  | "doctor"
  | "patient";

export type DbDeskRecord = {
  id?: string;
  hospital_id: string;
  desk: DeskId;
  record_key: string;
  payload: Record<string, unknown>;
  updated_at?: string;
};

export async function upsertDeskRecords(rows: DbDeskRecord[]) {
  const admin = getSupabaseAdmin();
  if (!admin || rows.length === 0) return { ok: false as const, error: "admin_unavailable" };
  const { data, error } = await admin
    .from("hospital_desk_records")
    .upsert(
      rows.map((r) => ({
        hospital_id: r.hospital_id,
        desk: r.desk,
        record_key: r.record_key,
        payload: r.payload ?? {},
      })),
      { onConflict: "hospital_id,desk,record_key" },
    )
    .select();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data };
}

export async function listDeskRecords(hospitalId: string, desk: DeskId) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, data: [] as DbDeskRecord[] };
  const { data, error } = await admin
    .from("hospital_desk_records")
    .select("*")
    .eq("hospital_id", hospitalId)
    .eq("desk", desk)
    .order("updated_at", { ascending: false });
  if (error) return { ok: false as const, data: [] as DbDeskRecord[], error: error.message };
  return { ok: true as const, data: (data ?? []) as DbDeskRecord[] };
}
