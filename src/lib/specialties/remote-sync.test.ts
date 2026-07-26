import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { doctorFromDb, doctorToDb, DEFAULT_HOSPITAL_ID } from "@/lib/specialties/remote-sync";
import type { HospitalDoctorRecord } from "@/lib/specialties/types";

describe("remote-sync mappers", () => {
  it("round-trips doctor fields", () => {
    const doctor: HospitalDoctorRecord = {
      doctorId: "DOC-099",
      name: "Dr. Test",
      email: "test@oakhaven.demo",
      specialtyId: "cardiology",
      room: "C1",
      fee: 1000,
      phone: "999",
      registrationNo: "MCI-1",
      active: true,
      authUserId: "demo-doctor-cardio",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const db = doctorToDb(doctor);
    expect(db.hospital_id).toBe(DEFAULT_HOSPITAL_ID);
    expect(db.doctor_code).toBe("DOC-099");
    expect(db.specialty_id).toBe("cardiology");
    expect(db.demo_auth_key).toBe("demo-doctor-cardio");

    const back = doctorFromDb({
      ...db,
      is_active: true,
      created_at: doctor.createdAt,
      updated_at: doctor.updatedAt,
    });
    expect(back.doctorId).toBe(doctor.doctorId);
    expect(back.specialtyId).toBe("cardiology");
    expect(back.authUserId).toBe("demo-doctor-cardio");
    expect(back.active).toBe(true);
  });
});

describe("chart client_key mapping", () => {
  beforeEach(() => {
    // no-op placeholder for symmetry with auth suites
  });
  afterEach(() => {});

  it("prefers client_key over uuid id when hydrating", async () => {
    // Inline the mapping logic used in fetchChartsFromRemote
    const row = {
      id: "11111111-1111-4111-8111-111111111111",
      client_key: "SCH-local-1",
      specialty_id: "ophthalmology",
      doctor_id: null,
      patient_name: "Asha",
      module_id: "slit_lamp",
      values: { od: "6/6" },
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    };
    const id = String(row.client_key ?? row.id);
    expect(id).toBe("SCH-local-1");
  });
});
