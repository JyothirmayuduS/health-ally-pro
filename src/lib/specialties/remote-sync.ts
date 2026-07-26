import type { HospitalDoctorRecord, SpecialtyId } from "@/lib/specialties/types";
import type { SpecialtyChartNote } from "@/lib/specialties/chart-store";
import type { UnitRecord } from "@/lib/admin-desk/hospital-units";
import type { HospitalBrand } from "@/lib/hospital-brand";
import type { BodyMarker } from "@/lib/shared/body-anatomy";

const API = "/api/hospital/persist";
export const DEFAULT_HOSPITAL_ID = "a0000001-0001-4001-8001-000000000001";

async function authHeaders(json = false): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  try {
    const { getSession } = await import("@/lib/supabase/auth");
    const session = await getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    /* ignore */
  }
  // Demo / evaluation: server only accepts this outside production (or ALLOW_DEMO_PERSIST)
  headers["x-medora-persist-demo"] = "1";
  return headers;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function postJson<T>(body: unknown): Promise<T | null> {
  try {
    const res = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: await authHeaders(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function remotePersistenceStatus() {
  return getJson<{ ok: boolean; persistence: boolean; offline?: boolean }>(
    `${API}?resource=status`,
  );
}

export function doctorToDb(d: HospitalDoctorRecord, hospitalId = DEFAULT_HOSPITAL_ID) {
  return {
    hospital_id: hospitalId,
    doctor_code: d.doctorId,
    name: d.name,
    email: d.email,
    specialty_id: d.specialtyId,
    room: d.room,
    fee: d.fee,
    phone: d.phone ?? null,
    registration_no: d.registrationNo ?? null,
    demo_auth_key: d.authUserId ?? null,
    is_active: d.active,
  };
}

export function doctorFromDb(row: Record<string, unknown>): HospitalDoctorRecord {
  return {
    doctorId: String(row.doctor_code ?? row.doctorId ?? ""),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    specialtyId: String(row.specialty_id ?? "general_medicine") as SpecialtyId,
    room: String(row.room ?? ""),
    fee: Number(row.fee ?? 0),
    phone: row.phone ? String(row.phone) : undefined,
    registrationNo: row.registration_no ? String(row.registration_no) : undefined,
    active: row.is_active !== false,
    authUserId: row.demo_auth_key ? String(row.demo_auth_key) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function syncDoctorsToRemote(doctors: HospitalDoctorRecord[]) {
  return postJson({
    action: "upsert_doctors",
    doctors: doctors.map((d) => doctorToDb(d)),
  });
}

export async function fetchDoctorsFromRemote() {
  const res = await getJson<{ ok: boolean; data: Record<string, unknown>[] }>(
    `${API}?resource=doctors`,
  );
  if (!res?.ok || !Array.isArray(res.data)) return null;
  return res.data.map(doctorFromDb);
}

export async function syncChartToRemote(note: SpecialtyChartNote) {
  return postJson<{ ok: boolean; data?: { id?: string } }>({
    action: "insert_chart",
    chart: {
      hospital_id: DEFAULT_HOSPITAL_ID,
      specialty_id: note.specialtyId,
      patient_name: note.patientName,
      patient_id: note.patientId ?? null,
      module_id: note.moduleId,
      values: note.values,
      client_key: note.id,
    },
  });
}

export async function fetchChartsFromRemote(specialtyId?: SpecialtyId) {
  const q = specialtyId
    ? `${API}?resource=charts&specialtyId=${encodeURIComponent(specialtyId)}`
    : `${API}?resource=charts`;
  const res = await getJson<{ ok: boolean; data: Record<string, unknown>[] }>(q);
  if (!res?.ok || !Array.isArray(res.data)) return null;
  return res.data.map(
    (row): SpecialtyChartNote => ({
      id: String(row.client_key ?? row.id),
      specialtyId: String(row.specialty_id) as SpecialtyId,
      doctorId: String(row.doctor_id ?? "remote"),
      patientName: String(row.patient_name ?? ""),
      patientId: row.patient_id ? String(row.patient_id) : undefined,
      moduleId: String(row.module_id ?? ""),
      values: (row.values as Record<string, unknown>) ?? {},
      createdAt: String(row.created_at ?? new Date().toISOString()),
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    }),
  );
}

export async function syncUnitsToRemote(units: UnitRecord[]) {
  return postJson({
    action: "upsert_units",
    units: units.map((u) => ({
      id: u.id.match(/^[0-9a-f-]{36}$/i) ? u.id : undefined,
      hospital_id: DEFAULT_HOSPITAL_ID,
      unit_id: u.unitId,
      title: u.title,
      status: u.status,
      detail: u.detail,
      meta: u.meta ?? null,
      priority: u.priority ?? "routine",
      record_key: u.id.match(/^[0-9a-f-]{36}$/i) ? undefined : u.id,
    })),
  });
}

export async function fetchUnitsFromRemote() {
  const res = await getJson<{ ok: boolean; data: Record<string, unknown>[] }>(
    `${API}?resource=units`,
  );
  if (!res?.ok || !Array.isArray(res.data)) return null;
  return res.data.map(
    (row): UnitRecord => ({
      id: String(row.record_key ?? row.id),
      unitId: String(row.unit_id) as UnitRecord["unitId"],
      title: String(row.title ?? ""),
      status: String(row.status ?? ""),
      detail: String(row.detail ?? ""),
      meta: row.meta ? String(row.meta) : undefined,
      priority: (row.priority as UnitRecord["priority"]) ?? "routine",
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    }),
  );
}

export async function syncUnitStatusRemote(id: string, status: string) {
  return postJson({ action: "update_unit_status", unitStatus: { id, status } });
}

export async function syncOnboardingLead(brand: HospitalBrand, opts?: { turnstileToken?: string }) {
  return postJson({
    action: "onboard",
    turnstileToken: opts?.turnstileToken,
    lead: {
      hospital_name: brand.hospitalName,
      legal_name: brand.legalName,
      admin_name: brand.adminName,
      admin_email: brand.adminEmail,
      city: brand.city,
      beds: brand.beds,
      plan: brand.plan,
      specialties: brand.specialties,
      accent_color: brand.accent,
      payload: { source: "register-hospital", createdAt: brand.createdAt },
    },
  });
}

export async function syncAnatomyMarkers(specialtyId: SpecialtyId, markers: BodyMarker[]) {
  return postJson({
    action: "save_anatomy",
    anatomy: {
      specialtyId,
      markers: markers.map((m) => ({
        hospital_id: DEFAULT_HOSPITAL_ID,
        specialty_id: specialtyId,
        region_id: m.regionId,
        label: m.label,
        view: m.view,
        mesh_type: m.meshType ?? null,
        meta: {},
      })),
    },
  });
}

export async function fetchAnatomyMarkers(specialtyId: SpecialtyId) {
  const res = await getJson<{ ok: boolean; data: Record<string, unknown>[] }>(
    `${API}?resource=anatomy&specialtyId=${encodeURIComponent(specialtyId)}`,
  );
  if (!res?.ok || !Array.isArray(res.data)) return null;
  return res.data.map(
    (row): BodyMarker => ({
      regionId: String(row.region_id),
      label: String(row.label),
      view: String(row.view) as BodyMarker["view"],
      meshType: row.mesh_type ? String(row.mesh_type) : undefined,
    }),
  );
}
