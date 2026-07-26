import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HOSPITAL_SCOPED_TABLES } from "@/server/hospital-scoped-tables";
import { LIVE_POLICY_SCOPE } from "@/server/rls-policy-inventory.test";
import {
  DiagnosisInputSchema,
  Icd10CodeSchema,
  SoapNoteSchema,
  VitalsInputSchema,
} from "@/lib/emr/schemas";
import { canPerformEmr } from "@/server/emr/rbac";
import type { PhiReadAuth } from "@/server/phi-reads";

const TABLES = [
  "clinical_note_versions",
  "patient_diagnoses",
  "patient_procedures",
  "patient_immunizations",
  "clinical_attachments",
  "emr_record_audit",
] as const;

const staffAuth = {
  isStaff: true,
  isPatient: false,
  userId: "demo-staff",
  hospitalId: "00000000-0000-0000-0000-000000000001",
  hospitalIds: ["00000000-0000-0000-0000-000000000001"],
  email: "demo@example.com",
  patientId: null,
} as PhiReadAuth;

describe("EMR contracts and RBAC", () => {
  it("validates ICD-10 and SOAP contracts", () => {
    expect(Icd10CodeSchema.safeParse("E11.9").success).toBe(true);
    expect(Icd10CodeSchema.safeParse("BAD").success).toBe(false);
    expect(
      DiagnosisInputSchema.safeParse({
        icd10Code: "J06.9",
        icd10Display: "Acute upper respiratory infection",
      }).success,
    ).toBe(true);
    expect(
      SoapNoteSchema.safeParse({
        subjective: "Cough",
        objective: "Clear lungs",
        assessment: "URI",
        plan: "Supportive care",
        sign: true,
      }).success,
    ).toBe(true);
    expect(
      VitalsInputSchema.safeParse({
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 72,
      }).success,
    ).toBe(true);
  });

  it("enforces clinical write RBAC", () => {
    const doctor = ["doctor"] as const;
    expect(canPerformEmr("read_chart", staffAuth, [...doctor])).toBe(true);
    expect(canPerformEmr("save_soap", staffAuth, [...doctor])).toBe(true);
    expect(canPerformEmr("sign_note", staffAuth, [...doctor])).toBe(true);
    expect(canPerformEmr("manage_diagnoses", staffAuth, ["receptionist"])).toBe(false);
    expect(canPerformEmr("record_vitals", staffAuth, ["nurse"])).toBe(true);
    expect(canPerformEmr("sign_note", staffAuth, ["nurse"])).toBe(false);
  });

  it("allows patient read of own chart only", () => {
    const patientAuth = {
      ...staffAuth,
      isStaff: false,
      isPatient: true,
      patientId: "p1",
      userId: "patient-1",
    } as PhiReadAuth;
    expect(
      canPerformEmr("read_chart", patientAuth, [], { isOwnPatient: true }),
    ).toBe(true);
    expect(canPerformEmr("save_soap", patientAuth, [], { isOwnPatient: true })).toBe(
      false,
    );
  });
});

describe("EMR tenant security inventory", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260726180000_emr_ehr_phase3.sql"),
    "utf8",
  );

  it("registers every new table as hospital scoped", () => {
    for (const table of TABLES) expect(HOSPITAL_SCOPED_TABLES).toContain(table);
    expect(HOSPITAL_SCOPED_TABLES).toContain("vitals_readings");
  });

  it("enables RLS and revokes direct PostgREST", () => {
    for (const table of TABLES) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toMatch(
      /REVOKE ALL ON TABLE[\s\S]+clinical_note_versions[\s\S]+FROM anon, authenticated/,
    );
  });

  it("has scoped policy inventory entries", () => {
    for (const table of TABLES) {
      const policies = LIVE_POLICY_SCOPE.filter((item) => item.table === table);
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.every((item) => item.scoped === "Y")).toBe(true);
    }
  });

  it("enforces immutable note versions and audit", () => {
    expect(sql).toContain("clinical_note_versions is immutable");
    expect(sql).toContain("emr_record_audit is immutable");
    expect(sql).toContain("trg_clinical_note_versions_no_update");
    expect(sql).toContain("trg_emr_record_audit_no_delete");
  });
});
