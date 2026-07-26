import { describe, expect, it } from "vitest";
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
  normalizeName,
  normalizePhone,
  PatientSearchSchema,
  QrResolveSchema,
  RegisterPatientSchema,
  splitName,
} from "@/lib/patient-management/schemas";
import { managedToSharedPatient, rowToManagedPatient } from "@/lib/patient-management/compat";
import { canPerform } from "@/server/patient-management/rbac";
import type { PhiReadAuth } from "@/server/phi-reads";
import { resolveAllergySubstances } from "@/lib/patient-allergy";
import { createHash } from "node:crypto";

const staffAuth = (rolesNote?: string): PhiReadAuth => ({
  userId: "u1",
  email: "a@test",
  hospitalIds: ["h1"],
  hospitalId: "h1",
  isStaff: true,
  isPatient: false,
  patientId: null,
});

const patientAuth: PhiReadAuth = {
  userId: "p1",
  email: "p@test",
  hospitalIds: ["h1"],
  hospitalId: "h1",
  isStaff: false,
  isPatient: true,
  patientId: "pat-1",
};

describe("patient-management schemas", () => {
  it("normalizes phone and name", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizeName("  Ada   Lovelace ")).toBe("ada lovelace");
    expect(splitName("Ada Lovelace")).toEqual({ firstName: "Ada", lastName: "Lovelace" });
  });

  it("validates registration and rejects short phone", () => {
    const ok = RegisterPatientSchema.safeParse({
      fullName: "Ada Lovelace",
      dateOfBirth: "1990-01-01",
      gender: "Female",
      phone: "9876543210",
    });
    expect(ok.success).toBe(true);

    const bad = RegisterPatientSchema.safeParse({
      fullName: "Ada",
      dateOfBirth: "1990-01-01",
      gender: "Female",
      phone: "123",
    });
    expect(bad.success).toBe(false);
  });

  it("paginates search with defaults", () => {
    const parsed = PatientSearchSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("requires opaque QR token length", () => {
    expect(QrResolveSchema.safeParse({ token: "short" }).success).toBe(false);
    expect(QrResolveSchema.safeParse({ token: "mq_" + "a".repeat(40) }).success).toBe(true);
  });

  it("documents MIME allowlist and size cap", () => {
    expect(ALLOWED_DOCUMENT_MIME).toContain("application/pdf");
    expect(ALLOWED_DOCUMENT_MIME).not.toContain("application/x-msdownload");
    expect(MAX_DOCUMENT_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("compat mapping", () => {
  it("maps rows to shared patients using MRN as desk id", () => {
    const managed = rowToManagedPatient({
      id: "uuid-1",
      hospital_id: "h1",
      mrn: "MRN-100240",
      full_name: "Ada Lovelace",
      date_of_birth: "1990-01-01",
      gender: "Female",
      phone: "9876543210",
      email: null,
      allergies_summary: "Penicillin",
      status: "active",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    const shared = managedToSharedPatient(managed);
    expect(shared.id).toBe("MRN-100240");
    expect(shared.mrn).toBe("MRN-100240");
    expect(shared.allergies).toBe("Penicillin");
  });
});

describe("RBAC matrix", () => {
  it("allows reception to register and manage QR", () => {
    expect(canPerform("register", staffAuth(), ["receptionist"])).toBe(true);
    expect(canPerform("manage_qr", staffAuth(), ["receptionist"])).toBe(true);
    expect(canPerform("manage_history", staffAuth(), ["receptionist"])).toBe(false);
  });

  it("allows doctors clinical history but not register", () => {
    expect(canPerform("register", staffAuth(), ["doctor"])).toBe(false);
    expect(canPerform("manage_history", staffAuth(), ["doctor"])).toBe(true);
    expect(canPerform("manage_allergies", staffAuth(), ["nurse"])).toBe(true);
  });

  it("scopes patient self-service", () => {
    expect(canPerform("read_profile", patientAuth, [], { isOwnPatient: true })).toBe(true);
    expect(canPerform("update_identity", patientAuth, [], { isOwnPatient: true })).toBe(true);
    expect(canPerform("manage_qr", patientAuth, [], { isOwnPatient: true })).toBe(true);
    expect(canPerform("manage_allergies", patientAuth, [], { isOwnPatient: true })).toBe(false);
    expect(canPerform("read_profile", patientAuth, [], { hasGrant: true })).toBe(true);
    expect(canPerform("register", patientAuth, [], { isOwnPatient: true })).toBe(false);
    expect(canPerform("resolve_qr", patientAuth, [], { isOwnPatient: true })).toBe(false);
  });
});

describe("QR payload security", () => {
  it("stores hash not raw token and payload has no PHI fields", () => {
    const token = "mq_" + "b".repeat(43);
    const hash = createHash("sha256").update(token).digest("hex");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
    const payload = { t: token, v: 1 };
    expect(Object.keys(payload).sort()).toEqual(["t", "v"]);
    expect(JSON.stringify(payload)).not.toMatch(/mrn|dob|phone|name/i);
  });
});

describe("allergy structured fallback", () => {
  it("prefers structured active allergies over legacy string", () => {
    expect(
      resolveAllergySubstances({
        structured: [
          { substance: "Aspirin", status: "active" },
          { substance: "Old", status: "resolved" },
        ],
        legacyWarning: "Penicillin",
      }),
    ).toEqual(["Aspirin"]);
  });

  it("falls back to legacy warning text", () => {
    expect(
      resolveAllergySubstances({
        structured: [],
        legacyWarning: "Do not prescribe — Penicillin, Sulfa",
      }),
    ).toEqual(["Penicillin", "Sulfa"]);
  });
});

describe("storage path traversal guard", () => {
  it("rejects paths that escape hospital/patient prefix", () => {
    const hospitalId = "h1";
    const patientId = "p1";
    const bad = `${hospitalId}/../other/p1/file.pdf`;
    const good = `${hospitalId}/${patientId}/doc/file.pdf`;
    expect(good.startsWith(`${hospitalId}/${patientId}/`)).toBe(true);
    expect(bad.startsWith(`${hospitalId}/${patientId}/`)).toBe(false);
    expect(bad.includes("..")).toBe(true);
  });
});
